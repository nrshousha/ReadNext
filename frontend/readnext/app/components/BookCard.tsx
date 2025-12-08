import Link from 'next/link';
import { Book } from '@/lib/api';

interface BookCardProps {
    book: Book;
}

export default function BookCard({ book }: BookCardProps) {
    return (
        <Link href={`/books/${book.index}`} className="group block h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:border-indigo-400/30 dark:hover:shadow-indigo-400/10">
                <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 text-lg font-bold leading-tight text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
                        {book.title}
                    </h3>
                    <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        by {book.author}
                    </p>
                    <p className="mb-4 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                        {book.description}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2">
                        {book.genres.slice(0, 3).map((genre) => (
                            <span
                                key={genre}
                                className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30"
                            >
                                {genre}
                            </span>
                        ))}
                    </div>
                    {book.similarity_score !== undefined && (
                        <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                            <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                <div
                                    className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                    style={{ width: `${book.similarity_score * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {(book.similarity_score * 100).toFixed(0)}% Match
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
