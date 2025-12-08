import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, ArrowLeft, BookOpen } from 'lucide-react'

// ============================================================
// Types matching the backend API
// ============================================================
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

// ============================================================
// API Configuration
// ============================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ============================================================
// Utility Functions
// ============================================================

// Generate a deterministic gradient based on book title
const generateGradient = (title: string): string => {
    let hash = 0
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash)
    }

    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
        'linear-gradient(135deg, #b721ff 0%, #21d4fd 100%)',
    ]

    return gradients[Math.abs(hash) % gradients.length]
}

// Genre color mapping
const genreColors: Record<string, string> = {
    fiction: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    fantasy: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    romance: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
    mystery: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    thriller: 'bg-red-500/20 text-red-300 border border-red-500/30',
    'science fiction': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    horror: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    historical: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    biography: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    default: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
}

const getGenreColor = (genre: string): string => {
    const lowerGenre = genre.toLowerCase()
    for (const key of Object.keys(genreColors)) {
        if (lowerGenre.includes(key)) {
            return genreColors[key]
        }
    }
    return genreColors.default
}

// ============================================================
// Sub-Components
// ============================================================

// Dynamic gradient book cover placeholder
const BookCover = ({ title }: { title: string }) => (
    <div
        className="w-full aspect-[2/3] rounded-lg shadow-lg flex items-center justify-center relative overflow-hidden"
        style={{ background: generateGradient(title) }}
    >
        <BookOpen className="w-8 h-8 text-white/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
)

// Genre badge component
const GenreBadge = ({ genre }: { genre: string }) => (
    <span className={`genre-badge ${getGenreColor(genre)}`}>
        {genre}
    </span>
)

// Match score progress bar
const MatchScoreBar = ({ score }: { score: number }) => {
    const percentage = Math.round(score * 100)
    return (
        <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Match</span>
                <span className="text-xs font-medium text-purple-400">{percentage}%</span>
            </div>
            <div className="match-bar">
                <motion.div
                    className="match-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
            </div>
        </div>
    )
}

// Search result book card
const SearchBookCard = ({
    book,
    onClick
}: {
    book: Book
    onClick: () => void
}) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="book-card rounded-xl overflow-hidden cursor-pointer group"
        onClick={onClick}
    >
        <div className="flex gap-4 p-4">
            {/* Book Cover */}
            <div className="w-20 flex-shrink-0">
                <BookCover title={book.title} />
            </div>

            {/* Book Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                    {book.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">by {book.author}</p>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{book.description}</p>

                {book.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {book.genres.slice(0, 3).map((genre, i) => (
                            <GenreBadge key={i} genre={genre} />
                        ))}
                    </div>
                )}
            </div>

            {/* Arrow indicator */}
            <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 transition-all">
                    <ArrowLeft className="w-4 h-4 text-purple-400 rotate-180 group-hover:text-white transition-colors" />
                </div>
            </div>
        </div>
    </motion.div>
)

// Recommendation book card
const RecommendationCard = ({
    book,
    index
}: {
    book: RecommendedBook
    index: number
}) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="book-card rounded-xl overflow-hidden"
    >
        {/* Book Cover */}
        <div className="p-4 pb-0">
            <BookCover title={book.title} />
        </div>

        {/* Book Info */}
        <div className="p-4">
            <h3 className="text-base font-semibold text-white line-clamp-2 min-h-[2.5rem]">
                {book.title}
            </h3>
            <p className="text-sm text-slate-400 mt-1">by {book.author}</p>

            {book.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {book.genres.slice(0, 2).map((genre, i) => (
                        <GenreBadge key={i} genre={genre} />
                    ))}
                </div>
            )}

            <MatchScoreBar score={book.similarity_score} />
        </div>
    </motion.div>
)

// Loading spinner
const Spinner = () => (
    <div className="flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5 text-purple-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-slate-400">Loading...</span>
    </div>
)

// ============================================================
// Main App Component
// ============================================================
function App() {
    // State (preserved from original)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Book[]>([])
    const [selectedBook, setSelectedBook] = useState<Book | null>(null)
    const [recommendations, setRecommendations] = useState<RecommendedBook[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'search' | 'results' | 'recommendations'>('search')

    // Search for books (API logic preserved)
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

    // Get recommendations for a book (API logic preserved)
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

    // Reset to search (logic preserved)
    const handleReset = () => {
        setStep('search')
        setSearchResults([])
        setSelectedBook(null)
        setRecommendations([])
        setSearchQuery('')
        setError(null)
    }

    // Back to results (logic preserved)
    const handleBackToResults = () => {
        setStep('results')
        setSelectedBook(null)
        setRecommendations([])
    }

    return (
        <div className="min-h-screen relative">
            {/* Background glow effect */}
            <div className="bg-glow" />

            {/* Main content */}
            <div className="relative z-10 px-4 py-8 md:py-16">
                <div className="max-w-6xl mx-auto">

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="glass rounded-xl p-4 mb-6 border-red-500/30 bg-red-500/10 text-center max-w-2xl mx-auto"
                            >
                                <p className="text-red-400">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ================================================== */}
                    {/* STEP 1: HERO / SEARCH VIEW */}
                    {/* ================================================== */}
                    <AnimatePresence mode="wait">
                        {step === 'search' && (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-16 md:py-24"
                            >
                                {/* Hero Text */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
                                        Discover your next
                                        <br />
                                        <span className="gradient-text">favorite book</span>
                                    </h1>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12"
                                >
                                    Our AI-powered recommendation engine analyzes thousands of books
                                    to find your perfect match
                                </motion.p>

                                {/* Search Bar */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="max-w-2xl mx-auto"
                                >
                                    <div className="glass-strong rounded-2xl p-2 flex gap-2">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="Search for a book by title..."
                                                className="w-full pl-12 pr-4 py-4 rounded-xl search-input text-white text-lg"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSearch}
                                            disabled={loading || !searchQuery.trim()}
                                            className="btn-primary px-8 py-4 rounded-xl font-semibold text-white flex items-center gap-2"
                                        >
                                            {loading ? (
                                                <Spinner />
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    Search
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* ================================================== */}
                        {/* STEP 2: SEARCH RESULTS */}
                        {/* ================================================== */}
                        {step === 'results' && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Header */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-between mb-8"
                                >
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                                            Search Results
                                        </h2>
                                        <p className="text-slate-400 mt-1">
                                            Found {searchResults.length} book{searchResults.length !== 1 ? 's' : ''} • Select one to get recommendations
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="btn-ghost px-4 py-2 rounded-lg text-slate-300 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        New Search
                                    </button>
                                </motion.div>

                                {/* Results List */}
                                {searchResults.length === 0 ? (
                                    <div className="glass rounded-xl p-12 text-center">
                                        <p className="text-slate-400 text-lg">No books found. Try a different search term.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {searchResults.map((book) => (
                                                <SearchBookCard
                                                    key={book.index}
                                                    book={book}
                                                    onClick={() => handleGetRecommendations(book)}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ================================================== */}
                        {/* STEP 3: RECOMMENDATIONS */}
                        {/* ================================================== */}
                        {step === 'recommendations' && selectedBook && (
                            <motion.div
                                key="recommendations"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Back Button */}
                                <motion.button
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={handleBackToResults}
                                    className="btn-ghost px-4 py-2 rounded-lg text-slate-300 flex items-center gap-2 mb-8"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Results
                                </motion.button>

                                {/* Selected Book Header */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass rounded-2xl p-6 md:p-8 mb-12"
                                >
                                    <div className="flex gap-6">
                                        <div className="w-28 md:w-36 flex-shrink-0">
                                            <BookCover title={selectedBook.title} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-purple-400 uppercase tracking-wider font-medium mb-2">
                                                Selected Book
                                            </p>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                                {selectedBook.title}
                                            </h2>
                                            <p className="text-lg text-slate-400 mb-4">by {selectedBook.author}</p>
                                            <p className="text-slate-500 line-clamp-3">{selectedBook.description}</p>
                                            {selectedBook.genres.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {selectedBook.genres.slice(0, 5).map((genre, i) => (
                                                        <GenreBadge key={i} genre={genre} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Recommendations Section */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <Sparkles className="w-6 h-6 text-purple-400" />
                                        You might also like
                                    </h3>

                                    {loading ? (
                                        <div className="glass rounded-xl p-16 text-center">
                                            <svg className="animate-spin h-12 w-12 mx-auto text-purple-500" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <p className="text-slate-400 mt-4">Finding similar books...</p>
                                        </div>
                                    ) : recommendations.length === 0 ? (
                                        <div className="glass rounded-xl p-12 text-center">
                                            <p className="text-slate-400 text-lg">No recommendations found for this book.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                            {recommendations.map((book, index) => (
                                                <RecommendationCard
                                                    key={book.index}
                                                    book={book}
                                                    index={index}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Start Over Button */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-center mt-12"
                                >
                                    <button
                                        onClick={handleReset}
                                        className="btn-ghost px-8 py-3 rounded-xl font-semibold text-white"
                                    >
                                        <Search className="w-4 h-4 inline mr-2" />
                                        Search for Another Book
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <footer className="text-center mt-20 pt-8 border-t border-white/5">
                        <p className="text-slate-500 text-sm">
                            Powered by AI-driven content similarity • Built with React + FastAPI
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    )
}

export default App
