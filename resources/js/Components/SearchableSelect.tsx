import { useState, useRef, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
    subLabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    onAddNew?: () => void;
    addNewLabel?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    className = '',
    error,
    disabled = false,
    required = false,
    onAddNew,
    addNewLabel = 'Add New',
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.subLabel && option.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-3 text-left text-sm bg-white border rounded-xl transition-all duration-200 flex items-center justify-between ${
                    error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 hover:border-slate-400 focus:border-violet-500 focus:ring-violet-500/20'
                } ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'cursor-pointer'} focus:outline-none focus:ring-2`}
            >
                <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full px-3 py-2 pl-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                            />
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-violet-50 flex items-center justify-between ${
                                        option.value === value ? 'bg-violet-50 text-violet-700' : 'text-slate-700'
                                    }`}
                                >
                                    <div>
                                        <div className="font-medium">{option.label}</div>
                                        {option.subLabel && (
                                            <div className="text-xs text-slate-500">{option.subLabel}</div>
                                        )}
                                    </div>
                                    {option.value === value && (
                                        <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {onAddNew && (
                        <div className="p-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setSearchQuery('');
                                    onAddNew();
                                }}
                                className="w-full px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {addNewLabel}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
