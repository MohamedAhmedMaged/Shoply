"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { Search } from "lucide-react";

type Suggestion = {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
};

interface SearchSuggestionsProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    onSearch?: (value: string) => void;
}

export default function SearchSuggestions({
    value,
    onChange,
    placeholder = "Search products...",
    className = "",
    inputClassName = "",
    onSearch,
}: SearchSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        if (query.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);

        try {
            const data = await apiFetch<Suggestion[]>(
                `/api/products/suggestions?q=${encodeURIComponent(query)}`,
                { signal: controller.signal },
            );
            setSuggestions(data || []);
            setIsOpen(data && data.length > 0);
            setSelectedIndex(-1);
        } catch (err: any) {
            if (err.name !== "AbortError") {
                setSuggestions([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedFetch = useCallback(
        (query: string) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
        },
        [fetchSuggestions],
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        debouncedFetch(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "Enter" && onSearch) {
                onSearch(value);
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : 0,
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : suggestions.length - 1,
                );
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    window.location.href = `/products/${suggestions[selectedIndex].slug}`;
                } else if (onSearch) {
                    onSearch(value);
                }
                setIsOpen(false);
                break;
            case "Escape":
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    const handleSelect = (slug: string) => {
        setIsOpen(false);
        window.location.href = `/products/${slug}`;
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className={`flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${inputClassName}`}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls="search-suggestions-list"
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                )}
            </div>

            {isOpen && (
                <ul
                    id="search-suggestions-list"
                    role="listbox"
                    className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-border/50 bg-card shadow-lg"
                >
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={suggestion.id}
                            role="option"
                            aria-selected={index === selectedIndex}
                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${index === selectedIndex
                                    ? "bg-muted"
                                    : "hover:bg-muted/50"
                                }`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(suggestion.slug);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                                {suggestion.image ? (
                                    <Image
                                        src={suggestion.image}
                                        alt={suggestion.name}
                                        width={40}
                                        height={40}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                                        <Search className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {suggestion.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(suggestion.price)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
