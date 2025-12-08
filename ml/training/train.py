import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
import pickle
import os

# --- Data Loading and Inspection (Cells 2, 3, 7) ---

# Load the processed data from the pickle file
try:
    with open("processed_data.pkl", "rb") as f:
        df = pickle.load(f)

    # Basic inspection (from Cell 7 output)
    print(f"shape: {df.shape}")
    print(f"Number of books: {df.shape[0]:,}")
    print(f"Total features: {df.shape[1]:,}")
    print()

except FileNotFoundError:
    print("ERROR: processed_data.pkl not found.")
    exit(1)

# --- Feature Preparation (Cell 8) ---

embedding_cols = [col for col in df.columns if col.startswith('emb_')]
print(f"{len(embedding_cols)} embedding dimensions")

# Extract embeddings as numpy array
X_embeddings = df[embedding_cols].values
print(f"Embeddings shape: {X_embeddings.shape}")
print()

# --- Configuration (Cell 6) ---

os.makedirs("ml/models", exist_ok=True)
# 9000 books, and 609 genres
N_CLUSTERS = 100  # Number of clusters for K-Means
N_NEIGHBORS = 10  # How many recommendations to find

print(f"{N_CLUSTERS} clusters")
print()

# --- K-Means Clustering (Cell 13) ---

kmeans = KMeans(
    n_clusters=N_CLUSTERS,
    random_state=42,
    n_init=10,
    max_iter=300,
    verbose=0,
    algorithm='lloyd'
)

cluster_labels = kmeans.fit_predict(X_embeddings)
cluster_counts = pd.Series(cluster_labels).value_counts()

print("Cluster Size Distribution:")
bins = [0, 50, 75, 100, 125, 150, 200, 500]
for i in range(len(bins)-1):
    count = ((cluster_counts >= bins[i]) & (cluster_counts < bins[i+1])).sum()
    print(f"      • {bins[i]:3d}-{bins[i+1]:3d} books: {count:2d} clusters")
print()

# --- Nearest Neighbors (NN) Model Fitting (Cell 14) ---

# Train NearestNeighbors on the embeddings
nn_model = NearestNeighbors(
    n_neighbors=N_NEIGHBORS + 1,  # +1 because query book is included
    metric='cosine',
    algorithm='brute',
    n_jobs=-1
)
nn_model.fit(X_embeddings)

# --- Model Packaging (Cell 15) ---

model_package = {
    'nn_model': nn_model,
    'kmeans_model': kmeans,

    'embeddings': X_embeddings,
    'cluster_labels': cluster_labels,

    'n_books': df.shape[0],
    'n_features': len(embedding_cols),
    'feature_names': embedding_cols,

    'dataset_stats': {
        'total_genres': 609,
        'genres_with_50plus_books': 147,
        'top_genre': 'Fiction (5686 books)'
    },

    'config': {
        'n_clusters': N_CLUSTERS,
        'n_neighbors': N_NEIGHBORS,
        'metric': 'cosine',
        'algorithm': 'brute'
    }
}

# --- Model Persistence (Cell 16) ---

output_path = "ml/models/model.pkl"
try:
    with open(output_path, 'wb') as f:
        pickle.dump(model_package, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"Model successfully saved to {output_path}")
except Exception as e:
    print(f"ERROR saving model: {e}")
    exit(1)

# --- Model Testing (Cell 17) ---

# Test 1: Basic recommendation
test_book_idx = 0
test_embedding = X_embeddings[test_book_idx].reshape(1, -1)
distances, indices = nn_model.kneighbors(test_embedding)

print(f"\n--- Model Testing Results ---")
print(f"   Test 1: Basic Recommendation")
print(f"   • Query book index: {test_book_idx}")
print(f"   • Found {len(indices[0])-1} similar books")
print(f"   • Top 5 similar books: {list(indices[0][1:6])}")
print(f"   • Cosine distances: {distances[0][1:6].round(3)}")
print()

# Test 2: Cluster distribution
print(f"   Test 2: Cluster Quality")
unique_clusters = len(np.unique(cluster_labels))
print(f"   • Unique clusters created: {unique_clusters}/{N_CLUSTERS}")
print(f"   • Cluster ID of test book: {cluster_labels[test_book_idx]}")
print()

# Test 3: Model integrity
print(f"   Test 3: Model Integrity")
print(f"   • Embedding shape matches: {X_embeddings.shape[0] == df.shape[0]}")
print(f"   • All books clustered: {len(cluster_labels) == df.shape[0]}")
print(f"   • No NaN in embeddings: {not np.isnan(X_embeddings).any()}")
print()
