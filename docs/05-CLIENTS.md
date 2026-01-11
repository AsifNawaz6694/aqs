# 05 - CLIENTS MODULE

## Overview

The Clients module manages customer/client information for the rental quote system. It provides full CRUD operations with search functionality, pagination, and international phone number support with country code selection. All client operations are automatically logged via the Observer pattern.

## Database Design

### Table: `clients`

```sql
CREATE TABLE clients (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    reference VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    quote_count INT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL
);
```

### Column Specifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Company/organization name |
| `reference` | VARCHAR(255) | NOT NULL | Client reference code |
| `contact_name` | VARCHAR(255) | NOT NULL | Primary contact person |
| `phone_number` | VARCHAR(255) | NOT NULL | Phone with country code |
| `quote_count` | INT | DEFAULT 0 | Number of quotes created |
| `created_at` | TIMESTAMP | NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NULL | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULL | Soft delete timestamp |

### Migration History

**Initial Migration (2025_07_11_193632):**
```php
Schema::create('clients', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('reference');
    $table->string('contact_name');
    $table->string('phone_number');
    $table->integer('quote_count')->default(0);
    $table->timestamps();
    $table->softDeletes();
});
```

**Remove Unique Constraint (2025_08_07_064712):**
```php
// Removed unique index from reference field
Schema::table('clients', function (Blueprint $table) {
    $table->dropUnique('clients_reference_unique');
});
```

## Backend Architecture

### Model: `app/Models/Client.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'reference',
        'contact_name',
        'phone_number',
        'quote_count'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get full name accessor
     * Returns contact_person if exists, otherwise returns name
     */
    public function getFullNameAttribute()
    {
        return $this->contact_person ? $this->contact_person : $this->name;
    }
}
```

### Model Features

1. **Soft Deletes**: Uses `SoftDeletes` trait for safe deletion
2. **Mass Assignment**: Protected fillable fields
3. **Date Casting**: Automatic datetime casting for timestamps
4. **Accessor**: `full_name` attribute accessor

### Controller: `app/Http/Controllers/ClientsController.php`

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use App\Models\Client;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientsController extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    /**
     * List all clients with search and pagination
     */
    public function index(Request $request)
    {
        $query = Client::query();

        // Search filter - searches across multiple fields
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('reference', 'like', '%' . $request->search . '%')
                    ->orWhere('contact_name', 'like', '%' . $request->search . '%')
                    ->orWhere('phone_number', 'like', '%' . $request->search . '%');
            });
        }

        $clients = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        return Inertia::render('clients/Create');
    }

    /**
     * Store new client
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'reference' => 'required|string:clients,reference',
            'quote_count' => 'integer|min:0'
        ]);

        Client::create($validated);

        return redirect()->route('clients.index')
            ->with('success', 'Client created successfully');
    }

    /**
     * Show edit form
     */
    public function edit(Client $client)
    {
        return Inertia::render('clients/Edit', [
            'client' => $client
        ]);
    }

    /**
     * Update existing client
     */
    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'reference' => 'required|string:clients,reference,' . $client->id,
            'quote_count' => 'nullable|integer|min:0'
        ]);

        $client->update($validated);

        return redirect()->route('clients.index')
            ->with('success', 'Client updated successfully');
    }

    /**
     * Delete client (soft delete)
     */
    public function destroy(Client $client)
    {
        $client->delete();
        return redirect()->back()
            ->with('success', 'Client deleted successfully');
    }
}
```

### Controller Methods Summary

| Method | HTTP | Route | Permission | Description |
|--------|------|-------|------------|-------------|
| `index()` | GET | `/clients` | `clients.view` | List with search |
| `create()` | GET | `/clients/create` | `clients.create` | Show create form |
| `store()` | POST | `/clients` | `clients.create` | Store new client |
| `edit()` | GET | `/clients/{client}/edit` | `clients.edit` | Show edit form |
| `update()` | PUT | `/clients/{client}` | `clients.edit` | Update client |
| `destroy()` | DELETE | `/clients/{client}` | `clients.delete` | Soft delete client |

### Observer: `app/Observers/ClientObserver.php`

```php
<?php

namespace App\Observers;

use App\Models\Client;

class ClientObserver
{
    /**
     * Handle the Client "created" event
     */
    public function created(Client $client)
    {
        activity_log(
            'client_created',
            'Client created: ' . $client->name,
            $client,
            ['client' => $client->toArray()]
        );
    }

    /**
     * Handle the Client "updated" event
     */
    public function updated(Client $client)
    {
        $changes = $client->getChanges();

        // Log only if there are actual changes (not just timestamps)
        if (!empty($changes)) {
            activity_log(
                'client_updated',
                'Client updated: ' . $client->name,
                $client,
                ['changes' => $changes]
            );
        }
    }

    /**
     * Handle the Client "deleted" event
     */
    public function deleted(Client $client)
    {
        activity_log(
            'client_deleted',
            'Client deleted: ' . $client->name,
            $client
        );
    }

    /**
     * Handle the Client "restored" event
     */
    public function restored(Client $client)
    {
        activity_log(
            'client_restored',
            'Client restored: ' . $client->name,
            $client
        );
    }

    /**
     * Handle the Client "forceDeleted" event
     */
    public function forceDeleted(Client $client)
    {
        activity_log(
            'client_force_deleted',
            'Client permanently deleted: ' . $client->name,
            $client
        );
    }
}
```

### Observer Registration

Register in `app/Providers/EventServiceProvider.php`:

```php
use App\Models\Client;
use App\Observers\ClientObserver;

public function boot()
{
    Client::observe(ClientObserver::class);
}
```

## Validation Rules

### Store (Create) Validation

```php
[
    'name' => 'required|string|max:255',
    'contact_name' => 'required|string|max:255',
    'phone_number' => 'required|string|max:20',
    'reference' => 'required|string:clients,reference',
    'quote_count' => 'integer|min:0'
]
```

### Update Validation

```php
[
    'name' => 'required|string|max:255',
    'contact_name' => 'required|string|max:255',
    'phone_number' => 'required|string|max:20',
    'reference' => 'required|string:clients,reference,' . $client->id,
    'quote_count' => 'nullable|integer|min:0'
]
```

### Frontend Validation (Real-time)

```javascript
const validationErrors = {};
if (!data.name.trim()) validationErrors.name = 'Name is required';
if (!data.contact_name.trim()) validationErrors.contact_name = 'Contact name is required';
if (!data.phone_number.trim()) {
    validationErrors.phone_number = 'Phone number is required';
} else if (data.phone_number.length < 7) {
    validationErrors.phone_number = 'Phone number is too short';
}
```

## Routes Configuration

### Route Definitions

```php
// routes/web.php

// CLIENTS ROUTES
Route::middleware(['permission:clients.view'])->group(function () {
    Route::get('/clients', [ClientsController::class, 'index'])
        ->name('clients.index');

    Route::get('/clients/create', [ClientsController::class, 'create'])
        ->middleware('permission:clients.create')
        ->name('clients.create');

    Route::post('/clients', [ClientsController::class, 'store'])
        ->middleware('permission:clients.create')
        ->name('clients.store');

    Route::get('/clients/{client}', [ClientsController::class, 'show'])
        ->name('clients.show');

    Route::get('/clients/{client}/edit', [ClientsController::class, 'edit'])
        ->middleware('permission:clients.edit')
        ->name('clients.edit');

    Route::put('/clients/{client}', [ClientsController::class, 'update'])
        ->middleware('permission:clients.edit')
        ->name('clients.update');

    Route::delete('/clients/{client}', [ClientsController::class, 'destroy'])
        ->middleware('permission:clients.delete')
        ->name('clients.destroy');
});
```

### Route Permission Matrix

| Route | Method | Permission Required |
|-------|--------|---------------------|
| `/clients` | GET | `clients.view` |
| `/clients/create` | GET | `clients.view` + `clients.create` |
| `/clients` | POST | `clients.view` + `clients.create` |
| `/clients/{id}` | GET | `clients.view` |
| `/clients/{id}/edit` | GET | `clients.view` + `clients.edit` |
| `/clients/{id}` | PUT | `clients.view` + `clients.edit` |
| `/clients/{id}` | DELETE | `clients.view` + `clients.delete` |

## Frontend Implementation

### Page Components

#### 1. Index Page: `resources/js/Pages/Clients/Index.jsx`

**Features:**
- Paginated client list (20 per page)
- Search functionality across all fields
- Edit and delete action buttons
- Responsive table layout

**Key Imports:**
```javascript
import React, { useRef, useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ClientsLayout from '@/layouts/clients-layout';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
```

**Props Interface:**
```javascript
// Props received from controller
{
    clients: {
        data: Array<Client>,
        current_page: number,
        last_page: number,
        per_page: number,
        total: number,
        from: number,
        to: number,
        next_page_url: string | null
    },
    filters: {
        search: string
    }
}
```

**Search Implementation:**
```javascript
const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();

    router.get('/clients', {
        search: search || undefined,
    }, {
        preserveScroll: true,
        preserveState: true,
        only: ['clients', 'filters'],
        replace: true,
        onFinish: () => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        },
    });
};
```

**Delete Confirmation:**
```javascript
<button
    onClick={() => {
        if (confirm('Are you sure you want to delete this client?')) {
            router.delete(`/clients/${client.id}`);
        }
    }}
    className="text-red-600 hover:text-red-900"
>
    <TrashIcon className="h-5 w-5" />
</button>
```

**Pagination Component:**
```javascript
{clients.total > 0 && (
    <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-700">
                Showing {clients.from} to {clients.to} of {clients.total} clients
            </p>
            <div className="flex items-center space-x-2">
                {/* Previous/Next buttons with page numbers */}
            </div>
        </div>
    </div>
)}
```

#### 2. Create Page: `resources/js/Pages/Clients/Create.jsx`

**Features:**
- Form with real-time validation
- International phone number with country code selector
- Country flag display
- Error summary banner

**Country Codes Configuration:**
```javascript
const countryCodes = [
    { code: '+966', country: 'Saudi Arabia', flag: 'https://flagcdn.com/w40/sa.png', maxLength: 9 },
    { code: '+971', country: 'UAE', flag: 'https://flagcdn.com/w40/ae.png', maxLength: 9 },
    { code: '+974', country: 'Qatar', flag: 'https://flagcdn.com/w40/qa.png', maxLength: 8 },
    { code: '+965', country: 'Kuwait', flag: 'https://flagcdn.com/w40/kw.png', maxLength: 8 },
    { code: '+968', country: 'Oman', flag: 'https://flagcdn.com/w40/om.png', maxLength: 8 },
    { code: '+20', country: 'Egypt', flag: 'https://flagcdn.com/w40/eg.png', maxLength: 10 },
];
```

**Form State with Inertia.js:**
```javascript
const { data, setData, post, processing, errors } = useForm({
    name: '',
    contact_name: '',
    phone_number: '',
    country_code: '+966', // Default to Saudi Arabia
    reference: '',
    quote_count: 0,
});
```

**Phone Number Handler:**
```javascript
const handleContactNumberChange = (e) => {
    // Strip non-numeric characters
    let val = e.target.value.replace(/[^0-9]/g, '');

    // Get max length for selected country
    const maxLen = countryCodes.find(cc => cc.code === data.country_code)?.maxLength || 9;
    if (val.length > maxLen) val = val.slice(0, maxLen);

    setData('phone_number', val);

    // Real-time validation
    if (val && val.length < 7) {
        setFormErrors(errors => ({...errors, phone_number: 'Phone number is too short'}));
    } else {
        setFormErrors(errors => ({...errors, phone_number: null}));
    }
};
```

**Form Submission:**
```javascript
const handleSubmit = (e) => {
    e.preventDefault();

    // Client-side validation
    const validationErrors = {};
    if (!data.name.trim()) validationErrors.name = 'Name is required';
    if (!data.contact_name.trim()) validationErrors.contact_name = 'Contact name is required';
    if (!data.phone_number.trim()) {
        validationErrors.phone_number = 'Phone number is required';
    } else if (data.phone_number.length < 7) {
        validationErrors.phone_number = 'Phone number is too short';
    }

    if (Object.keys(validationErrors).filter(k => validationErrors[k]).length > 0) {
        setFormErrors(validationErrors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Prepend country code to phone number
    const phoneWithPrefix = data.phone_number.startsWith('+')
        ? data.phone_number
        : `${data.country_code}${data.phone_number}`;

    const finalData = {
        ...data,
        phone_number: phoneWithPrefix
    };

    router.post('/clients', finalData);
};
```

#### 3. Edit Page: `resources/js/Pages/Clients/Edit.jsx`

**Features:**
- Pre-populated form with existing data
- Phone number parsing to extract country code
- Quote count displayed as read-only

**Phone Number Extraction Helper:**
```javascript
function extractPhoneAndCountryCode(fullPhone) {
    if (!fullPhone) return { code: '+966', phone: '' };

    // Check with + prefix
    for (const cc of countryCodes) {
        if (fullPhone.startsWith(cc.code)) {
            return {
                code: cc.code,
                phone: fullPhone.substring(cc.code.length)
            };
        }
    }

    // Check without + prefix
    for (const cc of countryCodes) {
        const codeWithoutPlus = cc.code.substring(1);
        if (fullPhone.startsWith(codeWithoutPlus)) {
            return {
                code: cc.code,
                phone: fullPhone.substring(codeWithoutPlus.length)
            };
        }
    }

    return { code: '+966', phone: fullPhone };
}
```

**Form Initialization:**
```javascript
const extractedPhoneData = extractPhoneAndCountryCode(client.phone_number);

const { data, setData, put, processing, errors } = useForm({
    name: client.name,
    contact_name: client.contact_name,
    phone_number: extractedPhoneData.phone,
    country_code: extractedPhoneData.code,
    reference: client.reference,
    quote_count: client.quote_count || 0
});
```

### Layout: `resources/js/layouts/clients-layout.jsx`

```javascript
import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function ClientsLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head title="Clients" />

            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className='bg-white overflow-hidden shadow-sm sm:rounded-lg p-6'>
                    {children}
                </div>
            </div>
        </div>
    );
}
```

## UI Components and Styling

### Table Design

```html
<table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
            </th>
            <!-- More columns -->
        </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
            <!-- More cells -->
        </tr>
    </tbody>
</table>
```

### Phone Number Input with Flag

```html
<div className="flex items-center mt-1 border rounded-md">
    <!-- Country flag -->
    <span className='bg-[#e6ecf2] rounded-l-md py-2 px-2'>
        <img
            className='w-6 h-4 object-cover'
            src={countryCodes.find(cc => cc.code === data.country_code)?.flag}
            alt="Flag"
        />
    </span>

    <!-- Country code selector -->
    <select
        value={data.country_code}
        onChange={e => setData('country_code', e.target.value)}
        className="border-0 bg-[#e6ecf2] py-2 pl-1 pr-2 text-gray-700 font-semibold"
    >
        {countryCodes.map(cc => (
            <option key={cc.code} value={cc.code}>{cc.code}</option>
        ))}
    </select>

    <!-- Phone number input -->
    <input
        type="text"
        value={data.phone_number}
        onChange={handleContactNumberChange}
        placeholder="Enter phone number"
        className="border-0 rounded-r-md shadow-sm block w-full sm:text-sm"
    />
</div>
```

### Error Display

```html
{Object.values(formErrors).some(error => error) && (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <p className="text-sm text-red-700 font-medium">
            Please correct the errors below:
        </p>
        <ul className="list-disc pl-5 mt-1">
            {Object.entries(formErrors).map(([field, message]) => (
                message && (
                    <li className='text-red-700 text-sm font-medium' key={field}>
                        {message}
                    </li>
                )
            ))}
        </ul>
    </div>
)}
```

### Button Styles

```html
<!-- Primary Button -->
<button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
    Create Client
</button>

<!-- Secondary Button (Back) -->
<Link className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
    Back
</Link>
```

## Data Flow

### Create Client Flow

```
1. User navigates to /clients/create
2. ClientsController::create() renders Create form
3. User fills form with validation
4. Form submission triggers handleSubmit()
5. Client-side validation runs
6. Phone number prefixed with country code
7. POST request to /clients
8. Server validation via $request->validate()
9. Client::create() saves to database
10. ClientObserver::created() logs activity
11. Redirect to /clients with success message
```

### Update Client Flow

```
1. User clicks Edit on client row
2. ClientsController::edit() passes client data
3. Phone number parsed to extract country code
4. User modifies form fields
5. Form submission triggers handleSubmit()
6. PUT request to /clients/{id}
7. Server validation runs
8. Client::update() saves changes
9. ClientObserver::updated() logs changes
10. Redirect to /clients with success message
```

### Delete Client Flow

```
1. User clicks Delete icon
2. Confirmation dialog appears
3. On confirm, DELETE request sent
4. ClientsController::destroy() calls soft delete
5. ClientObserver::deleted() logs deletion
6. Page refreshes with success message
```

## Search Implementation

### Backend Search Query

```php
if ($request->filled('search')) {
    $query->where(function ($q) use ($request) {
        $q->where('name', 'like', '%' . $request->search . '%')
            ->orWhere('reference', 'like', '%' . $request->search . '%')
            ->orWhere('contact_name', 'like', '%' . $request->search . '%')
            ->orWhere('phone_number', 'like', '%' . $request->search . '%');
    });
}
```

### Frontend Search with Inertia

```javascript
router.get('/clients', {
    search: search || undefined,
}, {
    preserveScroll: true,    // Keep scroll position
    preserveState: true,     // Keep component state
    only: ['clients', 'filters'],  // Only reload these props
    replace: true,           // Replace history entry
});
```

## Implementation Guide

### Step 1: Create Migration

```bash
php artisan make:migration create_clients_table
```

```php
Schema::create('clients', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('reference');
    $table->string('contact_name');
    $table->string('phone_number');
    $table->integer('quote_count')->default(0);
    $table->timestamps();
    $table->softDeletes();
});
```

### Step 2: Create Model

```bash
php artisan make:model Client
```

Add traits and fillable fields as shown in Model section.

### Step 3: Create Controller

```bash
php artisan make:controller ClientsController
```

Implement CRUD methods with validation and Inertia responses.

### Step 4: Create Observer

```bash
php artisan make:observer ClientObserver --model=Client
```

Implement activity logging for all events.

### Step 5: Register Observer

In `EventServiceProvider.php`:

```php
Client::observe(ClientObserver::class);
```

### Step 6: Define Routes

Add routes to `routes/web.php` with permission middleware.

### Step 7: Create Frontend Pages

Create the following files:
- `resources/js/Pages/Clients/Index.jsx`
- `resources/js/Pages/Clients/Create.jsx`
- `resources/js/Pages/Clients/Edit.jsx`
- `resources/js/layouts/clients-layout.jsx`

### Step 8: Add Permissions

Ensure these permissions exist in the seeder:
- `clients.view`
- `clients.create`
- `clients.edit`
- `clients.delete`

## Testing Scenarios

### Manual Testing Checklist

- [ ] Can list all clients with pagination
- [ ] Search works across all searchable fields
- [ ] Can create new client with all fields
- [ ] Phone number validates minimum length (7 digits)
- [ ] Country code selector shows correct flags
- [ ] Phone number stored with country code prefix
- [ ] Can edit existing client
- [ ] Phone number parsed correctly on edit
- [ ] Can delete client (soft delete)
- [ ] Activity logs created for all operations
- [ ] Permission checks work correctly
- [ ] Validation errors display properly
- [ ] Pagination preserves search filters
