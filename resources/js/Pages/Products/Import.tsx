import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';

export default function Import() {
    const { data, setData, post, processing, errors } = useForm({
        file: null as File | null,
    });

    const [fileName, setFileName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('file', file);
            setFileName(file.name);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('products.import.store'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Import Products</h2>}
        >
            <Head title="Import Products" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-6">
                                <Link
                                    href={route('products.index')}
                                    className="text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                    &larr; Back to Products
                                </Link>
                            </div>

                            <h3 className="mb-4 text-lg font-medium text-gray-900">Import Products from CSV</h3>

                            {/* Instructions */}
                            <div className="mb-6 rounded-lg bg-blue-50 p-4">
                                <h4 className="mb-2 font-medium text-blue-900">CSV Format Instructions</h4>
                                <p className="mb-2 text-sm text-blue-800">
                                    Your CSV file should have the following columns in order:
                                </p>
                                <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                                    <li><strong>SKU</strong> (required) - Unique product identifier</li>
                                    <li><strong>Name</strong> (required) - Product name</li>
                                    <li><strong>Category</strong> (required) - Product category</li>
                                    <li><strong>Description</strong> - Product description</li>
                                    <li><strong>Daily Rate</strong> (required) - Daily rental rate</li>
                                    <li><strong>Stock Quantity</strong> (required) - Available quantity</li>
                                    <li><strong>Status</strong> - active/inactive/discontinued (default: active)</li>
                                </ol>
                                <p className="mt-2 text-sm text-blue-800">
                                    Note: Products with existing SKUs will be updated instead of creating duplicates.
                                </p>
                            </div>

                            {/* Download Template */}
                            <div className="mb-6">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const headers = 'SKU,Name,Category,Description,Daily Rate,Stock Quantity,Status';
                                        const example = 'PROD-001,Example Product,Equipment,Product description,25.00,10,active';
                                        const csvContent = `${headers}\n${example}`;
                                        const blob = new Blob([csvContent], { type: 'text/csv' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'products-template.csv';
                                        a.click();
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                    Download CSV Template
                                </a>
                            </div>

                            <form onSubmit={submit}>
                                {/* File Upload */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700">
                                        CSV File *
                                    </label>
                                    <div className="mt-2">
                                        <label
                                            htmlFor="file-upload"
                                            className="flex cursor-pointer justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 hover:border-gray-400"
                                        >
                                            <div className="text-center">
                                                <svg
                                                    className="mx-auto h-12 w-12 text-gray-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                    />
                                                </svg>
                                                <div className="mt-4">
                                                    {fileName ? (
                                                        <p className="font-medium text-indigo-600">{fileName}</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium text-indigo-600">
                                                                Click to upload
                                                            </span>{' '}
                                                            or drag and drop
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">CSV file up to 10MB</p>
                                            </div>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                accept=".csv,.txt"
                                                onChange={handleFileChange}
                                                className="sr-only"
                                            />
                                        </label>
                                    </div>
                                    {errors.file && (
                                        <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                                    )}
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end gap-3">
                                    <Link
                                        href={route('products.index')}
                                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.file}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {processing ? 'Importing...' : 'Import Products'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
