import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label}
                        {props.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
                        block w-full px-4 py-3 text-slate-900 text-sm
                        bg-white border border-slate-300 rounded-xl
                        placeholder:text-slate-400
                        transition-all duration-200
                        hover:border-slate-400
                        focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                        disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed
                        ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {hint && !error && (
                    <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
                )}
                {error && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

// Select Component
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options?: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, options, children, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label}
                        {props.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={`
                            block w-full px-4 py-3 text-slate-900 text-sm
                            bg-white border border-slate-300 rounded-xl
                            appearance-none cursor-pointer
                            transition-all duration-200
                            hover:border-slate-400
                            focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                            disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed
                            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
                            ${className}
                        `}
                        {...props}
                    >
                        {options
                            ? options.map((option) => (
                                  <option key={option.value} value={option.value}>
                                      {option.label}
                                  </option>
                              ))
                            : children}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {hint && !error && (
                    <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
                )}
                {error && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label}
                        {props.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`
                        block w-full px-4 py-3 text-slate-900 text-sm
                        bg-white border border-slate-300 rounded-xl
                        placeholder:text-slate-400
                        transition-all duration-200
                        hover:border-slate-400
                        focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                        disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed
                        resize-none
                        ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {hint && !error && (
                    <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
                )}
                {error && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

// Checkbox Component
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, description, className = '', ...props }, ref) => {
        return (
            <label className="flex items-start gap-3 cursor-pointer group">
                <input
                    ref={ref}
                    type="checkbox"
                    className={`
                        w-4 h-4 mt-0.5
                        text-violet-600 bg-white border-slate-300 rounded
                        transition-all duration-200
                        focus:ring-2 focus:ring-violet-500/20
                        disabled:bg-slate-100 disabled:cursor-not-allowed
                        ${className}
                    `}
                    {...props}
                />
                <div className="flex-1">
                    {label && (
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                            {label}
                        </span>
                    )}
                    {description && (
                        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                    )}
                </div>
            </label>
        );
    }
);

Checkbox.displayName = 'Checkbox';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
        const baseStyles = `
            inline-flex items-center justify-center gap-2 font-medium
            rounded-xl transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
        `;

        const variants = {
            primary: `
                bg-gradient-to-r from-violet-600 to-purple-600
                text-white shadow-lg shadow-violet-500/30
                hover:from-violet-700 hover:to-purple-700
                focus:outline-none focus:ring-2 focus:ring-violet-500/50
            `,
            secondary: `
                bg-white border border-slate-300 text-slate-700
                hover:bg-slate-50 hover:border-slate-400
                focus:outline-none focus:ring-2 focus:ring-slate-500/20
            `,
            danger: `
                bg-red-600 text-white shadow-lg shadow-red-500/30
                hover:bg-red-700
                focus:outline-none focus:ring-2 focus:ring-red-500/50
            `,
            ghost: `
                text-slate-600
                hover:bg-slate-100 hover:text-slate-900
                focus:outline-none focus:ring-2 focus:ring-slate-500/20
            `,
        };

        const sizes = {
            sm: 'px-3 py-2 text-xs',
            md: 'px-5 py-3 text-sm',
            lg: 'px-6 py-3.5 text-base',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {loading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : icon ? (
                    icon
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

// Badge Component
interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    children: React.ReactNode;
    className?: string;
}

export function Badge({ variant = 'default', size = 'sm', children, className = '' }: BadgeProps) {
    const variants = {
        default: 'bg-slate-100 text-slate-700',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </span>
    );
}

// Card Component
interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 ${paddings[padding]} ${className}`}>
            {children}
        </div>
    );
}

// Empty State Component
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            {icon && (
                <div className="flex justify-center mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}
