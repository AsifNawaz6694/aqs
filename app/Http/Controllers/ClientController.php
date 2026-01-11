<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ClientController extends Controller
{
    /**
     * Display a listing of clients.
     */
    public function index(Request $request)
    {
        try {
            $query = Client::query();

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%")
                      ->orWhere('contact_first_name', 'like', "%{$search}%")
                      ->orWhere('contact_last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Filter by type
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filter by city
            if ($request->filled('city')) {
                $query->where('city', $request->city);
            }

            // Filter by country
            if ($request->filled('country')) {
                $query->where('country', $request->country);
            }

            // Sort
            $sortField = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');
            $allowedSorts = ['company_name', 'contact_first_name', 'email', 'city', 'country', 'created_at'];

            if (in_array($sortField, $allowedSorts)) {
                $query->orderBy($sortField, $sortDirection);
            }

            $clients = $query->paginate(15)->withQueryString();

            // Get filter options
            $cities = Client::distinct()->pluck('city')->filter()->values();
            $countries = Client::distinct()->pluck('country')->filter()->values();

            return Inertia::render('Clients/Index', [
                'clients' => $clients,
                'cities' => $cities,
                'countries' => $countries,
                'filters' => $request->only(['search', 'type', 'status', 'city', 'country', 'sort', 'direction']),
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading clients list: ' . $e->getMessage());
            return back()->with('error', 'Failed to load clients. Please try again.');
        }
    }

    /**
     * Show the form for creating a new client.
     */
    public function create()
    {
        return Inertia::render('Clients/Create');
    }

    /**
     * Store a newly created client.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:individual,company',
            'company_name' => 'nullable|required_if:type,company|string|max:255',
            'contact_first_name' => 'required|string|max:100',
            'contact_last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:clients,email',
            'phone' => 'nullable|string|max:50',
            'phone_country_code' => 'nullable|string|max:10',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            DB::beginTransaction();

            $client = Client::create($validated);

            // Log activity
            ActivityLog::log(
                'created',
                "Created new client: {$client->display_name}",
                $client,
                auth()->user(),
                ['client_id' => $client->id, 'email' => $client->email],
                ['new' => $validated],
                'clients'
            );

            DB::commit();

            return redirect()->route('clients.index')->with('success', 'Client created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating client: ' . $e->getMessage());
            return back()->withInput()->with('error', 'Failed to create client. Please try again.');
        }
    }

    /**
     * Display the specified client.
     */
    public function show(Client $client)
    {
        return Inertia::render('Clients/Show', [
            'client' => $client,
        ]);
    }

    /**
     * Show the form for editing the specified client.
     */
    public function edit(Client $client)
    {
        return Inertia::render('Clients/Edit', [
            'client' => $client,
        ]);
    }

    /**
     * Update the specified client.
     */
    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'type' => 'required|in:individual,company',
            'company_name' => 'nullable|required_if:type,company|string|max:255',
            'contact_first_name' => 'required|string|max:100',
            'contact_last_name' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:255', Rule::unique('clients')->ignore($client->id)],
            'phone' => 'nullable|string|max:50',
            'phone_country_code' => 'nullable|string|max:10',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            DB::beginTransaction();

            $oldData = $client->toArray();
            $client->update($validated);

            // Log activity
            ActivityLog::log(
                'updated',
                "Updated client: {$client->display_name}",
                $client,
                auth()->user(),
                ['client_id' => $client->id],
                ['old' => $oldData, 'new' => $validated],
                'clients'
            );

            DB::commit();

            return redirect()->route('clients.index')->with('success', 'Client updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating client: ' . $e->getMessage());
            return back()->withInput()->with('error', 'Failed to update client. Please try again.');
        }
    }

    /**
     * Remove the specified client.
     */
    public function destroy(Client $client)
    {
        try {
            DB::beginTransaction();

            $clientName = $client->display_name;
            $clientData = $client->toArray();

            // Log activity before deletion
            ActivityLog::log(
                'deleted',
                "Deleted client: {$clientName}",
                $client,
                auth()->user(),
                ['client_id' => $client->id, 'email' => $client->email],
                ['old' => $clientData],
                'clients'
            );

            $client->delete();

            DB::commit();

            return redirect()->route('clients.index')->with('success', 'Client deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting client: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete client. Please try again.');
        }
    }

    /**
     * Export clients to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        try {
            $query = Client::query();

            // Apply filters
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%")
                      ->orWhere('contact_first_name', 'like', "%{$search}%")
                      ->orWhere('contact_last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('city')) {
                $query->where('city', $request->city);
            }
            if ($request->filled('country')) {
                $query->where('country', $request->country);
            }

            $clients = $query->get();
            $filename = 'clients-' . date('Y-m-d-His') . '.csv';

            // Log export activity
            ActivityLog::log(
                'exported',
                "Exported {$clients->count()} clients to CSV",
                null,
                auth()->user(),
                ['count' => $clients->count(), 'filename' => $filename],
                [],
                'clients'
            );

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function () use ($clients) {
                $file = fopen('php://output', 'w');

                // Header row
                fputcsv($file, [
                    'ID',
                    'Type',
                    'Company Name',
                    'First Name',
                    'Last Name',
                    'Email',
                    'Phone',
                    'Address Line 1',
                    'Address Line 2',
                    'City',
                    'State',
                    'Postal Code',
                    'Country',
                    'Tax ID',
                    'Status',
                    'Created At',
                ]);

                // Data rows
                foreach ($clients as $client) {
                    fputcsv($file, [
                        $client->id,
                        $client->type,
                        $client->company_name,
                        $client->contact_first_name,
                        $client->contact_last_name,
                        $client->email,
                        $client->phone_country_code . $client->phone,
                        $client->address_line_1,
                        $client->address_line_2,
                        $client->city,
                        $client->state,
                        $client->postal_code,
                        $client->country,
                        $client->tax_id,
                        $client->status,
                        $client->created_at->format('Y-m-d H:i:s'),
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Error exporting clients: ' . $e->getMessage());
            return back()->with('error', 'Failed to export clients. Please try again.');
        }
    }
}
