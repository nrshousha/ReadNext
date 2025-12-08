import BookList from '@/app/components/BookList';
import { getBook, getRecommendations } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface BookPageProps {
    params: Promise<{ id: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
    const { id } = await params;
    const bookIndex = parseInt(id);

    if (isNaN(bookIndex)) {
        notFound();
    }

    try {
        const book = await getBook(bookIndex);
        const recommendationData = await getRecommendations(bookIndex, 8);

        return (
            <div className="py-10">
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center text-sm font-medium text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Search
                </Link>

                <div className="mb-16 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 sm:text-4xl">
                            {book.title}
                        </h1>
                        <p className="mb-6 text-xl font-medium text-zinc-500 dark:text-zinc-400">
                            by {book.author}
                        </p>

                        <div className="mb-6 flex flex-wrap gap-2">
                            {book.genres.map((genre) => (
                                <span
                                    key={genre}
                                    className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>

                        <div className="prose prose-zinc max-w-none dark:prose-invert">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Description</h3>
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{book.description}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/50">
                        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Book Details
                        </h3>
                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="text-zinc-500 dark:text-zinc-400">Index</dt>
                                <dd className="font-medium text-zinc-900 dark:text-zinc-50">{book.index}</dd>
                            </div>
                            {/* Add more details if available in the future */}
                        </dl>
                    </div>
                </div>

                <div className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
                    <BookList
                        books={recommendationData.recommendations}
                        title="You might also like"
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error fetching book details:', error);
        notFound();
    }
}
