export interface Book {
  index: number;
  title: string;
  author: string;
  description: string;
  genres: string[];
  similarity_score?: number;
}

export interface SearchResponse {
  query: string;
  count: number;
  books: Book[];
}

export interface RecommendationResponse {
  source_book: Book;
  recommendations: Book[];
}

// For server-side (inside Docker), use the container name; for client-side, use localhost
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer
  ? (process.env.API_URL_INTERNAL || 'http://backend:8000')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

export async function searchBooks(query: string, limit: number = 10): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  const data: SearchResponse = await response.json();
  return data.books;
}

export async function getBook(index: number): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/books/${index}`);
  if (!response.ok) {
    throw new Error('Failed to fetch book');
  }
  return response.json();
}

export async function getRecommendations(bookIndex: number, topK: number = 5): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE_URL}/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ book_index: bookIndex, top_k: topK }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  return response.json();
}

export async function getRandomBooks(count: number = 10): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books/random/?count=${count}`);
  if (!response.ok) {
    throw new Error('Failed to fetch random books');
  }
  return response.json();
}
