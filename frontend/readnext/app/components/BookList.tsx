import { Book } from '@/lib/api';
import BookCard from './BookCard';

interface BookListProps {
    books: Book[];
    title?: string;
}

export default function BookList({ books, title }: BookListProps) {
    if (books.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">No books found.</p>
            </div>
        );
    }

    return (
        <section className="py-8">
            {title && (
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {title}
                </h2>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book) => (
                    <BookCard key={book.index} book={book} />
                ))}
            </div>
        </section>
    );
}
