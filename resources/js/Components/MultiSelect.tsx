import { useState, useRef, useEffect, useCallback } from 'react';

export interface MultiSelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    color?: string; // Tailwind bg class for badge e.g. 'bg-emerald-100 text-emerald-700'
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    value: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    label?: string;
    maxDisplay?: number;
    searchable?: boolean;
    className?: string;
}

export default function MultiSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    label,
    maxDisplay = 3,
    searchable = true,
    className = '',
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && searchable && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen, searchable]);

    const filteredOptions = search
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    const toggleOption = useCallback((optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    }, [value, onChange]);

    const removeOption = useCallback((optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    }, [value, onChange]);

    const selectAll = useCallback(() => {
        onChange(filteredOptions.map(o => o.value));
    }, [filteredOptions, onChange]);

    const clearAll = useCallback(() => {
        onChange([]);
        setSearch('');
    }, [onChange]);

    const selectedOptions = options.filter(o => value.includes(o.value));
    const displayOptions = selectedOptions.slice(0, maxDisplay);
    const overflowCount = selectedOptions.length - maxDisplay;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative flex min-h-[2.75rem] w-full items-center gap-1.5 rounded-xl border px-3 py-2 text-left text-sm transition-all duration-200 ${
                    isOpen
                        ? 'border-violet-500 ring-2 ring-violet-500/20 bg-white'
                        : value.length > 0
                        ? 'border-violet-300 bg-violet-50/50 hover:border-violet-400'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
            >
                <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
                    {selectedOptions.length === 0 ? (
                        <span className="text-slate-400">{placeholder}</span>
                    ) : (
                        <>
                            {displayOptions.map(opt => (
                                <span
                                    key={opt.value}
                                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
                                        opt.color || 'bg-violet-100 text-violet-700'
                                    }`}
                                >
                                    {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                                    <span className="truncate max-w-[120px]">{opt.label}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => removeOption(opt.value, e)}
                                        className="ml-0.5 flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                            {overflowCount > 0 && (
                                <span className="inline-flex items-center rounded-lg bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                                    +{overflowCount} more
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Clear & Chevron */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                    {value.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); clearAll(); }}
                            className="rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Clear all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Search */}
                    {searchable && options.length > 5 && (
                        <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full rounded-lg border-slate-200 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                                />
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    {filteredOptions.length > 1 && (
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/50">
                            <span className="text-xs text-slate-500">
                                {value.length} of {options.length} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAll}
                                    className="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                                >
                                    Select All
                                </button>
                                {value.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-slate-400">
                                No options found
                            </div>
                        ) : (
                            filteredOptions.map(option => {
                                const isSelected = value.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => toggleOption(option.value)}
                                        className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                                            isSelected
                                                ? 'bg-violet-50 text-violet-900'
                                                : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {/* Checkbox */}
                                        <span className={`flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded border transition-all ${
                                            isSelected
                                                ? 'border-violet-500 bg-violet-500'
                                                : 'border-slate-300 bg-white'
                                        }`}
                                        style={{ width: '18px', height: '18px' }}
                                        >
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>

                                        {/* Icon + Label */}
                                        <span className="flex items-center gap-2 flex-1 min-w-0">
                                            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                                            {option.color ? (
                                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${option.color}`}>
                                                    {option.label}
                                                </span>
                                            ) : (
                                                <span className="truncate">{option.label}</span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
