"""
BookRecommender - Production-grade ML inference for ReadNext.

This module provides the BookRecommender class that handles:
- Loading trained ML models and metadata
- Book search functionality
- Book recommendation using cluster-based KNN
"""

import pickle
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors


class BookRecommender:
    """
    A class for book recommendations using cluster-based K-Nearest Neighbors.
    
    The recommender uses pre-trained models and embeddings to find similar books
    within the same cluster, providing more relevant recommendations.
    
    Attributes:
        cat_data (pd.DataFrame): Book metadata (Title, Author, Description, Genres)
        embeddings (np.ndarray): Book embeddings/features
        cluster_labels (np.ndarray): Cluster assignments for each book
        nn_model: Pre-trained NearestNeighbors model
        kmeans_model: Pre-trained KMeans clustering model
    """
    
    def __init__(self, ml_dir: Optional[Path] = None):
        """
        Initialize the BookRecommender by loading all required data and models.
        
        Args:
            ml_dir: Path to the ML directory containing 'data' and 'training' folders.
                   If None, defaults to the parent of the inference directory.
        
        Raises:
            FileNotFoundError: If required pickle files are not found.
            RuntimeError: If there's an error loading the models.
        """
        if ml_dir is None:
            # Default: assume we're in ml/inference, so go up one level
            ml_dir = Path(__file__).parent.parent
        else:
            ml_dir = Path(ml_dir)
        
        self.ml_dir = ml_dir
        self._load_data()
        self._load_model()
        
        print(f"✅ BookRecommender initialized with {len(self.cat_data)} books")
    
    def _load_data(self) -> None:
        """Load book metadata and processed data."""
        data_dir = self.ml_dir / "data"
        
        # Load book metadata
        cat_data_path = data_dir / "cat_data.pkl"
        if not cat_data_path.exists():
            raise FileNotFoundError(f"Book metadata not found: {cat_data_path}")
        
        with open(cat_data_path, "rb") as f:
            self.cat_data = pickle.load(f)
        
        # Normalize column names (handle different possible column names)
        self.cat_data.columns = [col.strip() for col in self.cat_data.columns]
        
        # Load processed data (optional, for potential future use)
        processed_data_path = data_dir / "processed_data.pkl"
        if processed_data_path.exists():
            try:
                with open(processed_data_path, "rb") as f:
                    self.processed_data = pickle.load(f)
            except Exception as e:
                print(f"⚠️ Warning: Could not load processed_data.pkl: {e}")
                self.processed_data = None
        else:
            self.processed_data = None
    
    def _load_model(self) -> None:
        """Load the trained model package."""
        model_path = self.ml_dir / "training" / "model.pkl"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        with open(model_path, "rb") as f:
            package = pickle.load(f)
        
        # Extract components from model package
        self.embeddings = package["embeddings"]
        self.cluster_labels = package["cluster_labels"]
        self.nn_model = package.get("nn_model")
        self.kmeans_model = package.get("kmeans_model")
        self.config = package.get("config", {})
        
        # Validate data consistency
        if len(self.embeddings) != len(self.cat_data):
            raise RuntimeError(
                f"Data mismatch: {len(self.embeddings)} embeddings vs "
                f"{len(self.cat_data)} books in metadata"
            )
    
    def get_book_by_index(self, index: int) -> dict:
        """
        Get book details by its index.
        
        Args:
            index: The book index (0-based).
        
        Returns:
            Dictionary with book details.
        
        Raises:
            ValueError: If index is out of range.
        """
        if not 0 <= index < len(self.cat_data):
            raise ValueError(
                f"Book index {index} out of range. Valid range: 0-{len(self.cat_data) - 1}"
            )
        
        row = self.cat_data.iloc[index]
        
        # Handle genres - could be list or string
        genres = row.get("Genres", [])
        if isinstance(genres, str):
            genres = [g.strip() for g in genres.split(",")]
        elif not isinstance(genres, list):
            genres = list(genres) if genres else []
        
        return {
            "index": int(index),
            "title": str(row.get("Book", row.get("Title", "Unknown"))),
            "author": str(row.get("Author", "Unknown")),
            "description": str(row.get("Description", "")),
            "genres": genres,
        }
    
    def search_books(self, query: str, limit: int = 10) -> list[dict]:
        """
        Search for books by title (case-insensitive).
        
        Args:
            query: Search query string.
            limit: Maximum number of results to return (default 10).
        
        Returns:
            List of book dictionaries with their indices.
        """
        if not query or not query.strip():
            return []
        
        query = query.strip().lower()
        
        # Get the title column (handle different possible names)
        title_col = None
        for col_name in ["Book", "Title", "book", "title"]:
            if col_name in self.cat_data.columns:
                title_col = col_name
                break
        
        if title_col is None:
            raise RuntimeError("Could not find title column in book data")
        
        # Case-insensitive search
        mask = self.cat_data[title_col].str.lower().str.contains(query, na=False)
        matching_indices = self.cat_data[mask].index.tolist()
        
        # Limit results
        matching_indices = matching_indices[:limit]
        
        return [self.get_book_by_index(idx) for idx in matching_indices]
    
    def get_recommendations(
        self, 
        book_index: int, 
        top_k: int = 5
    ) -> tuple[dict, list[dict]]:
        """
        Get book recommendations based on a source book.
        
        Uses cluster-based KNN: finds the most similar books within
        the same cluster as the source book.
        
        Args:
            book_index: Index of the source book.
            top_k: Number of recommendations to return (default 5).
        
        Returns:
            Tuple of (source_book_dict, list_of_recommended_book_dicts)
        
        Raises:
            ValueError: If book_index is out of range.
        """
        # Validate index
        if not 0 <= book_index < len(self.cat_data):
            raise ValueError(
                f"Book index {book_index} out of range. Valid range: 0-{len(self.cat_data) - 1}"
            )
        
        # Get source book details
        source_book = self.get_book_by_index(book_index)
        
        # Get cluster of the source book
        cluster_id = self.cluster_labels[book_index]
        
        # Get all books in the same cluster (excluding source)
        same_cluster_indices = np.where(self.cluster_labels == cluster_id)[0]
        same_cluster_indices = same_cluster_indices[same_cluster_indices != book_index]
        
        if len(same_cluster_indices) == 0:
            return source_book, []
        
        # Fit Nearest Neighbors within the cluster
        n_neighbors = min(top_k, len(same_cluster_indices))
        nn_cluster = NearestNeighbors(
            n_neighbors=n_neighbors,
            metric="cosine",
            algorithm="brute"
        )
        nn_cluster.fit(self.embeddings[same_cluster_indices])
        
        # Query neighbors
        distances, indices = nn_cluster.kneighbors(
            self.embeddings[book_index].reshape(1, -1)
        )
        
        # Convert local cluster indices to global dataset indices
        recommended_indices = same_cluster_indices[indices[0]]
        similarity_scores = 1 - distances[0]  # Convert distance to similarity
        
        # Build recommendation list
        recommendations = []
        for idx, score in zip(recommended_indices, similarity_scores):
            book = self.get_book_by_index(int(idx))
            book["similarity_score"] = round(float(score), 4)
            recommendations.append(book)
        
        return source_book, recommendations
    
    def get_total_books(self) -> int:
        """Return the total number of books in the dataset."""
        return len(self.cat_data)
    
    def get_random_books(self, count: int = 10) -> list[dict]:
        """
        Get random books for discovery/browsing.
        
        Args:
            count: Number of random books to return.
        
        Returns:
            List of book dictionaries.
        """
        count = min(count, len(self.cat_data))
        random_indices = np.random.choice(len(self.cat_data), size=count, replace=False)
        return [self.get_book_by_index(int(idx)) for idx in random_indices]


# Convenience function for backward compatibility
def recommend_books(book_idx: int, top_k: int = 5, recommender: Optional[BookRecommender] = None):
    """
    Legacy function for backward compatibility.
    
    For new code, use BookRecommender class directly.
    """
    if recommender is None:
        recommender = BookRecommender()
    
    _, recommendations = recommender.get_recommendations(book_idx, top_k)
    recommended_indices = [r["index"] for r in recommendations]
    distances = [1 - r["similarity_score"] for r in recommendations]
    
    return np.array(recommended_indices), np.array(distances)
