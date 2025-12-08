import { useState, useCallback } from 'react'

// Types matching the backend API
interface Book {
    index: number
    title: string
    author: string
    description: string
    genres: string[]
}

interface RecommendedBook extends Book {
    similarity_score: number
}

// API base URL - uses VITE_API_URL env var or defaults to localhost:8000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
    // State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Book[]>([])
    const [selectedBook, setSelectedBook] = useState<Book | null>(null)
    const [recommendations, setRecommendations] = useState<RecommendedBook[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'search' | 'results' | 'recommendations'>('search')

    // Search for books
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_URL}/books/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
            if (!response.ok) throw new Error('Failed to search books')

            const data = await response.json()
            setSearchResults(data.books)
            setStep('results')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed')
        } finally {
            setLoading(false)
        }
    }, [searchQuery])

    // Get recommendations for a book
    const handleGetRecommendations = useCallback(async (book: Book) => {
        setLoading(true)
        setError(null)
        setSelectedBook(book)

        try {
            const response = await fetch(`${API_URL}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ book_index: book.index, top_k: 6 })
            })
            if (!response.ok) throw new Error('Failed to get recommendations')

            const data = await response.json()
            setRecommendations(data.recommendations)
            setStep('recommendations')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Recommendations failed')
        } finally {
            setLoading(false)
        }
    }, [])

    // Reset to search
    const handleReset = () => {
        setStep('search')
        setSearchResults([])
        setSelectedBook(null)
        setRecommendations([])
        setSearchQuery('')
        setError(null)
    }

    // Back to results
    const handleBackToResults = () => {
        setStep('results')
        setSelectedBook(null)
        setRecommendations([])
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        📚 ReadNext
                    </h1>
                    <p className="text-slate-400 text-lg">Discover your next favorite book with AI-powered recommendations</p>
                </header>

                {/* Error Display */}
                {error && (
                    <div className="glass rounded-xl p-4 mb-6 border-red-500/50 bg-red-500/10 text-center">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Step 1: Search */}
                {step === 'search' && (
                    <div className="glass rounded-2xl p-8 max-w-2xl mx-auto glow-hover transition-smooth">
                        <h2 className="text-2xl font-semibold mb-6 text-center">Find a Book</h2>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search by book title..."
                                className="flex-1 px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-600/50 
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                         placeholder-slate-500 text-white text-lg transition-smooth"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading || !searchQuery.trim()}
                                className="px-8 py-4 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-indigo-600 to-purple-600
                         hover:from-indigo-500 hover:to-purple-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-smooth transform hover:scale-105 active:scale-95"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Searching...
                                    </span>
                                ) : 'Search'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Search Results */}
                {step === 'results' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold">
                                Found {searchResults.length} book{searchResults.length !== 1 ? 's' : ''}
                            </h2>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-smooth"
                            >
                                ← New Search
                            </button>
                        </div>

                        {searchResults.length === 0 ? (
                            <div className="glass rounded-xl p-8 text-center">
                                <p className="text-slate-400 text-lg">No books found. Try a different search term.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {searchResults.map((book) => (
                                    <div
                                        key={book.index}
                                        onClick={() => handleGetRecommendations(book)}
                                        className="glass rounded-xl p-6 cursor-pointer glow-hover transition-smooth
                             hover:border-indigo-500/50 hover:bg-indigo-500/5 group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-smooth truncate">
                                                    {book.title}
                                                </h3>
                                                <p className="text-slate-400 mt-1">by {book.author}</p>
                                                <p className="text-slate-500 mt-3 line-clamp-2">{book.description}</p>
                                                {book.genres.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {book.genres.slice(0, 4).map((genre, i) => (
                                                            <span key={i} className="px-3 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300">
                                                                {genre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full 
                                       bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 
                                       group-hover:text-white transition-smooth">
                                                    →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Recommendations */}
                {step === 'recommendations' && selectedBook && (
                    <div>
                        <button
                            onClick={handleBackToResults}
                            className="mb-6 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-smooth"
                        >
                            ← Back to Results
                        </button>

                        {/* Selected Book */}
                        <div className="glass rounded-xl p-6 mb-8 border-indigo-500/30">
                            <p className="text-sm text-indigo-400 uppercase tracking-wider mb-2">You Selected</p>
                            <h3 className="text-2xl font-bold text-white">{selectedBook.title}</h3>
                            <p className="text-slate-400 mt-1">by {selectedBook.author}</p>
                        </div>

                        {/* Recommendations Header */}
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                            <span className="text-3xl">✨</span>
                            Recommended for You
                        </h2>

                        {loading ? (
                            <div className="glass rounded-xl p-12 text-center">
                                <svg className="animate-spin h-12 w-12 mx-auto text-indigo-500" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <p className="text-slate-400 mt-4">Finding similar books...</p>
                            </div>
                        ) : recommendations.length === 0 ? (
                            <div className="glass rounded-xl p-8 text-center">
                                <p className="text-slate-400 text-lg">No recommendations found for this book.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recommendations.map((book, index) => (
                                    <div
                                        key={book.index}
                                        className="glass rounded-xl p-5 glow-hover transition-smooth hover:border-purple-500/50
                             transform hover:-translate-y-1"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {/* Similarity Badge */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs text-slate-500">#{index + 1}</span>
                                            <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 
                                     text-purple-300 font-medium">
                                                {Math.round(book.similarity_score * 100)}% match
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-white line-clamp-2 mb-1">
                                            {book.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm mb-3">by {book.author}</p>
                                        <p className="text-slate-500 text-sm line-clamp-3">{book.description}</p>

                                        {book.genres.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {book.genres.slice(0, 3).map((genre, i) => (
                                                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-slate-400">
                                                        {genre}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Start Over Button */}
                        <div className="text-center mt-10">
                            <button
                                onClick={handleReset}
                                className="px-8 py-3 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-slate-700 to-slate-600
                         hover:from-slate-600 hover:to-slate-500
                         transition-smooth transform hover:scale-105"
                            >
                                🔍 Search for Another Book
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer className="text-center mt-16 text-slate-500 text-sm">
                    <p>Powered by AI-driven content similarity • Built with React + FastAPI</p>
                </footer>
            </div>
        </div>
    )
}

export default App
