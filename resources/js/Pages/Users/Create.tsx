import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

interface Props {
    roles: Role[];
}

export default function UsersCreate({ roles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        role_id: '',
        company_name: '',
        job_title: '',
        department: '',
        phone: '',
        mobile: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/users');
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Create User
                </h2>
            }
        >
            <Head title="Create User" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h1 className="text-xl font-semibold text-gray-900">Create New User</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                A password setup email will be sent to the user.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="name" value="Full Name *" />
                                        <TextInput
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={data.name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="Email Address *" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="role_id" value="Role *" />
                                    <select
                                        id="role_id"
                                        name="role_id"
                                        value={data.role_id}
                                        onChange={(e) => setData('role_id', e.target.value)}
                                        className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        required
                                    >
                                        <option value="">Select a role</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.role_id} className="mt-2" />
                                </div>
                            </div>

                            {/* Profile Information */}
                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Profile Information (Optional)</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="company_name" value="Company Name" />
                                        <TextInput
                                            id="company_name"
                                            type="text"
                                            name="company_name"
                                            value={data.company_name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('company_name', e.target.value)}
                                        />
                                        <InputError message={errors.company_name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="job_title" value="Job Title" />
                                        <TextInput
                                            id="job_title"
                                            type="text"
                                            name="job_title"
                                            value={data.job_title}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('job_title', e.target.value)}
                                        />
                                        <InputError message={errors.job_title} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="department" value="Department" />
                                        <TextInput
                                            id="department"
                                            type="text"
                                            name="department"
                                            value={data.department}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('department', e.target.value)}
                                        />
                                        <InputError message={errors.department} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="phone" value="Phone" />
                                        <TextInput
                                            id="phone"
                                            type="text"
                                            name="phone"
                                            value={data.phone}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        <InputError message={errors.phone} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="mobile" value="Mobile" />
                                        <TextInput
                                            id="mobile"
                                            type="text"
                                            name="mobile"
                                            value={data.mobile}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('mobile', e.target.value)}
                                        />
                                        <InputError message={errors.mobile} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                                <Link
                                    href="/users"
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    Cancel
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Creating...' : 'Create User'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
