import BookList from './components/BookList';
import { getRandomBooks, searchBooks } from '@/lib/api';

interface HomeProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { q } = await searchParams;
  const query = q;

  let books: import('@/lib/api').Book[] = [];
  let title = '';

  try {
    if (query) {
      books = await searchBooks(query);
      title = `Search results for "${query}"`;
    } else {
      books = await getRandomBooks(12);
      title = 'Discover New Books';
    }
  } catch (error) {
    console.error('Error fetching books:', error);
    // In a real app, we'd handle this better, maybe with an error boundary or toast
  }

  return (
    <div className="py-16 sm:py-24">
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          <span className="block">Discover your next</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400">
            favorite book
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Our AI-powered recommendation engine analyzes thousands of books to find the perfect match for your reading taste.
        </p>
      </div>

      <BookList books={books} title={title} />
    </div>
  );
}
