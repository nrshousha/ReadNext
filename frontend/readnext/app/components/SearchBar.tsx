'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            // For now, we'll just log it or maybe redirect to a search page if we had one.
            // But since the plan is to have search on the home page, we might want to pass a callback.
            // However, for a simple "search anywhere" bar, we can use query params.
            // Let's assume the home page handles ?q=...
            router.push(`/?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for your next favorite book..."
                    className="w-full rounded-full border border-zinc-200 bg-white py-3 pl-12 pr-4 text-sm text-zinc-900 shadow-sm transition-all placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-400" />
                </div>
            </div>
        </form>
    );
}
