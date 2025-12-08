"""
ReadNext API - FastAPI Backend for Book Recommendations.

This module provides a RESTful API for:
- Searching books by title
- Getting book recommendations based on similarity
- Health checks

API documentation is auto-generated at /docs (Swagger UI) and /redoc.
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add the parent directory to path so we can import from ml.inference
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.inference.predictor import BookRecommender


# =============================================================================
# Pydantic Models
# =============================================================================

class BookBase(BaseModel):
    """Base book information."""
    index: int = Field(..., description="Unique book index in the dataset")
    title: str = Field(..., description="Book title")
    author: str = Field(..., description="Book author")
    description: str = Field(..., description="Book description/summary")
    genres: list[str] = Field(default_factory=list, description="List of genres")

    model_config = {
        "json_schema_extra": {
            "example": {
                "index": 1,
                "title": "Harry Potter and the Philosopher's Stone",
                "author": "J.K. Rowling",
                "description": "A young wizard discovers his magical heritage...",
                "genres": ["Fantasy", "Fiction", "Young Adult"]
            }
        }
    }


class RecommendedBook(BookBase):
    """Book with similarity score for recommendations."""
    similarity_score: float = Field(
        ..., 
        ge=0, 
        le=1, 
        description="Similarity score (0-1, higher is more similar)"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "index": 42,
                "title": "The Name of the Wind",
                "author": "Patrick Rothfuss",
                "description": "A young man grows to be the most notorious wizard...",
                "genres": ["Fantasy", "Fiction", "Adventure"],
                "similarity_score": 0.8542
            }
        }
    }


class SearchResponse(BaseModel):
    """Response for book search endpoint."""
    query: str = Field(..., description="The search query that was executed")
    count: int = Field(..., description="Number of books found")
    books: list[BookBase] = Field(..., description="List of matching books")

    model_config = {
        "json_schema_extra": {
            "example": {
                "query": "harry",
                "count": 2,
                "books": [
                    {
                        "index": 1,
                        "title": "Harry Potter and the Philosopher's Stone",
                        "author": "J.K. Rowling",
                        "description": "A young wizard discovers his magical heritage...",
                        "genres": ["Fantasy", "Fiction"]
                    }
                ]
            }
        }
    }


class RecommendationRequest(BaseModel):
    """Request body for recommendation endpoint."""
    book_index: int = Field(..., ge=0, description="Index of the source book")
    top_k: int = Field(
        default=5, 
        ge=1, 
        le=20, 
        description="Number of recommendations to return (1-20)"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "book_index": 1,
                "top_k": 5
            }
        }
    }


class RecommendationResponse(BaseModel):
    """Response for recommendation endpoint."""
    source_book: BookBase = Field(..., description="The book used as reference")
    recommendations: list[RecommendedBook] = Field(
        ..., 
        description="List of recommended similar books"
    )


class HealthResponse(BaseModel):
    """Response for health check endpoint."""
    status: str = Field(..., description="Service status")
    total_books: int = Field(..., description="Total number of books in the system")
    version: str = Field(default="1.0.0", description="API version")


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str = Field(..., description="Error message")


# =============================================================================
# Application Setup
# =============================================================================

# Global recommender instance (singleton)
recommender: Optional[BookRecommender] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown events.
    
    Loads the BookRecommender on startup.
    """
    global recommender
    
    # Startup: Load the recommender
    print("🚀 Starting ReadNext API...")
    
    # Get ML directory from environment or use default
    ml_dir = os.environ.get("ML_DATA_DIR")
    if ml_dir:
        ml_path = Path(ml_dir)
    else:
        # Default: look for ml directory relative to this file
        ml_path = Path(__file__).parent.parent / "ml"
    
    print(f"📂 Loading ML data from: {ml_path}")
    
    try:
        recommender = BookRecommender(ml_path)
        print(f"✅ Loaded {recommender.get_total_books()} books")
    except Exception as e:
        print(f"❌ Failed to load recommender: {e}")
        raise
    
    yield
    
    # Shutdown
    print("👋 Shutting down ReadNext API...")


# Create FastAPI app
app = FastAPI(
    title="ReadNext API",
    description="""
## Book Recommendation API

ReadNext provides intelligent book recommendations using machine learning.

### Features
- 🔍 **Search**: Find books by title
- 📚 **Recommendations**: Get similar book suggestions based on content
- ⚡ **Fast**: Optimized for quick responses

### Getting Started
1. Use `/books/search` to find a book and get its index
2. Use `/recommend` with the book index to get recommendations
    """,
    version="1.0.0",
    lifespan=lifespan,
    responses={
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    }
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# API Endpoints
# =============================================================================

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health check",
    description="Check if the API is running and get basic statistics."
)
async def health_check():
    """Health check endpoint."""
    if recommender is None:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    return HealthResponse(
        status="healthy",
        total_books=recommender.get_total_books(),
        version="1.0.0"
    )


@app.get(
    "/books/search",
    response_model=SearchResponse,
    tags=["Books"],
    summary="Search books by title",
    description="""
Search for books by title. Returns matching books with their indices.

Use the returned `index` field to get recommendations for a specific book.
    """,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid query"}
    }
)
async def search_books(
    q: str = Query(
        ..., 
        min_length=1, 
        max_length=100,
        description="Search query (book title)",
        examples=["harry potter", "lord of the rings", "1984"]
    ),
    limit: int = Query(
        default=10, 
        ge=1, 
        le=50,
        description="Maximum number of results to return"
    )
):
    """Search for books by title."""
    if recommender is None:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    try:
        books = recommender.search_books(q, limit=limit)
        return SearchResponse(
            query=q,
            count=len(books),
            books=[BookBase(**book) for book in books]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    "/recommend",
    response_model=RecommendationResponse,
    tags=["Recommendations"],
    summary="Get book recommendations",
    description="""
Get personalized book recommendations based on a source book.

The algorithm finds similar books within the same genre cluster,
ensuring relevant recommendations.

**Tip**: Use `/books/search` first to find the book index.
    """,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid book index"},
        404: {"model": ErrorResponse, "description": "Book not found"}
    }
)
async def get_recommendations(request: RecommendationRequest):
    """Get book recommendations based on a source book."""
    if recommender is None:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    try:
        source_book, recommendations = recommender.get_recommendations(
            request.book_index, 
            top_k=request.top_k
        )
        
        return RecommendationResponse(
            source_book=BookBase(**source_book),
            recommendations=[RecommendedBook(**rec) for rec in recommendations]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/books/{book_index}",
    response_model=BookBase,
    tags=["Books"],
    summary="Get book by index",
    description="Get detailed information about a specific book by its index.",
    responses={
        404: {"model": ErrorResponse, "description": "Book not found"}
    }
)
async def get_book(book_index: int):
    """Get a specific book by its index."""
    if recommender is None:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    try:
        book = recommender.get_book_by_index(book_index)
        return BookBase(**book)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/books/random/",
    response_model=list[BookBase],
    tags=["Books"],
    summary="Get random books",
    description="Get a random selection of books for discovery and browsing."
)
async def get_random_books(
    count: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Number of random books to return"
    )
):
    """Get random books for discovery."""
    if recommender is None:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    try:
        books = recommender.get_random_books(count)
        return [BookBase(**book) for book in books]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
