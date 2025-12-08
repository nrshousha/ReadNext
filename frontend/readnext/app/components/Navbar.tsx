import Link from 'next/link';
import SearchBar from './SearchBar';
import { BookOpen } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/60 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-black/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 text-white shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Read<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Next</span>
                    </span>
                </Link>
                <div className="hidden md:block md:w-1/3">
                    <SearchBar />
                </div>
                <div className="flex items-center gap-4">
                    {/* Add more nav items here if needed */}
                </div>
            </div>
            <div className="md:hidden px-4 pb-4">
                <SearchBar />
            </div>
        </nav>
    );
}
