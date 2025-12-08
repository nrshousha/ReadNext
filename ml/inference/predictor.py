import pickle
import numpy as np
from sklearn.neighbors import NearestNeighbors

# Load model package

with open("ml\models/model.pkl", "rb") as f:
    package = pickle.load(f)

cluster_labels = package["cluster_labels"]
X_embeddings = package["embeddings"]

print("Book recommender loaded.")


# Recommendation function

def recommend_books(book_idx, top_k=5):
    book_idx = int(book_idx)

    # 1) Identify cluster of the book
    cluster_id = cluster_labels[book_idx]

    # 2) Get all books in the same cluster
    same_cluster_indices = np.where(cluster_labels == cluster_id)[0]

    # 3) Exclude the queried book
    same_cluster_indices = same_cluster_indices[same_cluster_indices != book_idx]

    if len(same_cluster_indices) == 0:
        return [], []

    # 4) Fit Nearest Neighbors **inside this cluster only**
    nn_cluster = NearestNeighbors(
        n_neighbors=min(top_k, len(same_cluster_indices)),
        metric='cosine',
        algorithm='brute'
    )

    nn_cluster.fit(X_embeddings[same_cluster_indices])

    # 5) Query neighbors
    distances, indices = nn_cluster.kneighbors(
        X_embeddings[book_idx].reshape(1, -1)
    )

    # 6) Convert local cluster indices -> global dataset indices
    recommended_indices = same_cluster_indices[indices[0]]

    return recommended_indices, distances[0]


# test

if __name__ == "__main__":
    book_idx = 0
    recommended, distances = recommend_books(book_idx, top_k=5)

    print(f"Query book index: {book_idx}")
    print(f"Recommended book indices: {recommended}")
    print(f"Cosine distances: {distances.round(3)}")
