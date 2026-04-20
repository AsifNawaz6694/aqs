<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateQuotationPdf;
use App\Jobs\SendQuotationEmail;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\EkuepApiService;
use App\Services\FileParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class QuotationController extends Controller
{
    /**
     * Display a listing of quotations.
     */
    public function index(Request $request)
    {
        $query = Quotation::with(['client:id,name,company_name,contact_person', 'user:id,name'])
            ->latest();

        // Filter by status (supports comma-separated multi-select)
        if ($request->filled('status')) {
            $statuses = array_filter(explode(',', $request->status));
            $query->whereIn('status', $statuses);
        }

        // Filter by client (supports comma-separated multi-select)
        if ($request->filled('client_id')) {
            $clientIds = array_filter(explode(',', $request->client_id));
            $query->whereIn('client_id', $clientIds);
        }

        // Filter by user (supports comma-separated multi-select)
        if ($request->filled('user_id')) {
            $userIds = array_filter(explode(',', $request->user_id));
            $query->whereIn('user_id', $userIds);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('quotation_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('quotation_date', '<=', $request->date_to);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('quotation_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($q) use ($search) {
                        $q->where('company_name', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%")
                            ->orWhere('contact_person', 'like', "%{$search}%");
                    });
            });
        }

        $quotations = $query->paginate(20)->withQueryString();

        // Get filter options
        $clients = Client::select('id', 'name', 'company_name')->orderBy('name')->get();
        $users = User::select('id', 'name')->orderBy('name')->get();
        $statuses = Quotation::getStatuses();

        return Inertia::render('Quotations/Index', [
            'quotations' => $quotations,
            'clients' => $clients,
            'users' => $users,
            'statuses' => $statuses,
            'statusColors' => Quotation::getStatusColors(),
            'filters' => $request->only(['status', 'client_id', 'user_id', 'date_from', 'date_to', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new quotation.
     */
    public function create(Request $request)
    {
        $clients = Client::select('id', 'name', 'company_name', 'contact_person', 'email', 'phone')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $products = Product::select('id', 'sku', 'name', 'description', 'price', 'unit', 'category')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        // Get default settings
        $defaults = [
            'validity_days' => SystemSetting::getValue('quotation_validity_days', 30),
            'vat_rate' => SystemSetting::getValue('default_vat_rate', 15),
            'currency' => SystemSetting::getValue('default_currency', 'SAR'),
            'terms_and_conditions' => SystemSetting::getValue('default_terms_and_conditions', ''),
            'payment_terms' => SystemSetting::getValue('default_payment_terms', ''),
            'delivery_terms' => SystemSetting::getValue('default_delivery_terms', ''),
            'warranty_terms' => SystemSetting::getValue('default_warranty_terms', ''),
        ];

        // Pre-select client if provided
        $selectedClient = null;
        if ($request->filled('client_id')) {
            $selectedClient = Client::find($request->client_id);
        }

        return Inertia::render('Quotations/Create', [
            'clients' => $clients,
            'products' => $products,
            'defaultTerms' => $defaults['terms_and_conditions'],
            'vatRate' => (float) $defaults['vat_rate'],
            'currencies' => ['SAR', 'USD', 'EUR', 'AED'],
            'selectedClient' => $selectedClient,
        ]);
    }

    /**
     * Store a newly created quotation.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'reference' => 'nullable|string|max:100',
            'customer_reference' => 'required|string|max:100',
            'quotation_date' => 'required|date',
            'valid_until' => 'required|date|after:quotation_date',
            'expected_delivery_date' => 'nullable|date',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'transport_charges' => 'nullable|numeric|min:0',
            'transport_free' => 'boolean',
            'transport_notes' => 'nullable|string',
            'default_vat_rate' => 'required|numeric|min:0|max:100',
            'vat_inclusive' => 'boolean',
            'currency' => 'required|string|max:3',
            'country' => 'nullable|string|max:100',
            'phone_code' => 'nullable|string|max:10',
            'phone_number' => 'nullable|string|max:20',
            'terms_and_conditions' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'delivery_terms' => 'nullable|string',
            'warranty_terms' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|integer', // Local product ID (null for EKUEP/custom)
            'items.*.external_id' => 'nullable|string|max:100', // EKUEP product ID
            'items.*.source' => 'nullable|string|in:ekuep,local,custom',
            'items.*.item_code' => 'nullable|string|max:100',
            'items.*.name' => 'required|string|max:255',
            'items.*.original_name' => 'nullable|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.image_url' => 'nullable|string|max:500',
            'items.*.slug' => 'nullable|string|max:255',
            'items.*.product_specifications' => 'nullable|array',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.requested_quantity' => 'nullable|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.vat_rate' => 'required|numeric|min:0|max:100',
            'items.*.is_custom_item' => 'boolean',
            'items.*.is_transport_item' => 'boolean',
            'items.*.is_free' => 'boolean',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Get client for contact snapshot
            $client = Client::findOrFail($validated['client_id']);

            // Create quotation
            $quotation = Quotation::create([
                'quotation_number' => Quotation::generateQuotationNumber(),
                'client_id' => $validated['client_id'],
                'user_id' => auth()->id(),
                'title' => $validated['title'] ?? null,
                'description' => $validated['description'] ?? null,
                'reference' => $validated['reference'] ?? null,
                'customer_reference' => $validated['customer_reference'],
                'country' => $validated['country'] ?? 'Saudi Arabia',
                'quotation_date' => $validated['quotation_date'],
                'valid_until' => $validated['valid_until'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status' => Quotation::STATUS_DRAFT,
                'discount_percentage' => $validated['discount_percentage'] ?? 0,
                'transport_charges' => $validated['transport_charges'] ?? 0,
                'transport_free' => $validated['transport_free'] ?? false,
                'transport_notes' => $validated['transport_notes'] ?? null,
                'default_vat_rate' => $validated['default_vat_rate'],
                'vat_inclusive' => $validated['vat_inclusive'] ?? false,
                'currency' => $validated['currency'],
                'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'delivery_terms' => $validated['delivery_terms'] ?? null,
                'warranty_terms' => $validated['warranty_terms'] ?? null,
                'internal_notes' => $validated['internal_notes'] ?? null,
                'client_contact_name' => $client->contact_person ?? $client->name,
                'client_contact_email' => $client->contact_email ?? $client->email,
                'client_contact_phone' => $client->contact_phone ?? $client->phone,
            ]);

            // Create items
            foreach ($validated['items'] as $index => $itemData) {
                // Ensure product_id is either a valid ID or null (not 0 or empty string)
                $productId = !empty($itemData['product_id']) && $itemData['product_id'] > 0
                    ? $itemData['product_id']
                    : null;

                // Determine source: ekuep (external), local (product_id set), or custom
                $source = $itemData['source'] ?? QuotationItem::SOURCE_CUSTOM;
                if (!$source || $source === 'custom') {
                    if ($productId) {
                        $source = QuotationItem::SOURCE_LOCAL;
                    } elseif (!empty($itemData['external_id'])) {
                        $source = QuotationItem::SOURCE_EKUEP;
                    } else {
                        $source = QuotationItem::SOURCE_CUSTOM;
                    }
                }

                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'product_id' => $productId,
                    'external_id' => $itemData['external_id'] ?? null,
                    'source' => $source,
                    'item_code' => $itemData['item_code'] ?? null,
                    'name' => $itemData['name'],
                    'original_name' => $itemData['original_name'] ?? null,
                    'description' => $itemData['description'] ?? null,
                    'image_url' => $itemData['image_url'] ?? null,
                    'slug' => $itemData['slug'] ?? null,
                    'product_specifications' => $itemData['product_specifications'] ?? null,
                    'unit' => $itemData['unit'],
                    'unit_price' => $itemData['unit_price'],
                    'quantity' => $itemData['quantity'],
                    'requested_quantity' => $itemData['requested_quantity'] ?? null,
                    'discount_percentage' => $itemData['discount_percentage'] ?? 0,
                    'vat_rate' => $itemData['vat_rate'],
                    'vat_inclusive' => $validated['vat_inclusive'] ?? false,
                    'is_custom_item' => $itemData['is_custom_item'] ?? ($source === QuotationItem::SOURCE_CUSTOM),
                    'is_transport_item' => $itemData['is_transport_item'] ?? false,
                    'is_free' => $itemData['is_free'] ?? false,
                    'sort_order' => $index,
                    'notes' => $itemData['notes'] ?? null,
                ]);
            }

            // Record history
            $quotation->statusHistory()->create([
                'user_id' => auth()->id(),
                'from_status' => null,
                'to_status' => Quotation::STATUS_DRAFT,
                'action' => 'created',
                'notes' => 'Quotation created',
            ]);

            // Log activity
            ActivityLog::log(
                'created',
                "Created quotation {$quotation->quotation_number}",
                $quotation,
                auth()->user(),
                [],
                [],
                'quotations'
            );

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Quotation created successfully.',
                    'quotation' => $quotation,
                    'redirect' => route('quotations.show', $quotation),
                ]);
            }

            return redirect()->route('quotations.show', $quotation)
                ->with('success', 'Quotation created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating quotation: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'client_id' => $validated['client_id'] ?? null,
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to create quotation: ' . $e->getMessage(),
                    'error' => $e->getMessage(),
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to create quotation: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified quotation.
     */
    public function show(Quotation $quotation)
    {
        $quotation->load([
            'client',
            'user:id,name,email',
            'assignedTo:id,name,email',
            'approvedBy:id,name',
            'items.product:id,sku,name',
            'statusHistory.user:id,name',
            'parent',
            'versions',
        ]);

        return Inertia::render('Quotations/Show', [
            'quotation' => $quotation,
            'statuses' => Quotation::getStatuses(),
            'statusColors' => Quotation::getStatusColors(),
        ]);
    }

    /**
     * Show the form for editing the quotation.
     */
    public function edit(Quotation $quotation)
    {
        if (!$quotation->isEditable()) {
            return back()->withErrors(['error' => 'This quotation cannot be edited. Create a new version instead.']);
        }

        $quotation->load(['client', 'items']);

        $clients = Client::select('id', 'name', 'company_name', 'contact_person', 'email', 'phone')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        // Transform quotation items to frontend format
        $transformedItems = $quotation->items->map(function ($item) {
            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'sku' => $item->item_code ?? '',
                'external_reference' => $item->item_code ?? '',
                'name' => $item->name,
                'original_name' => $item->original_name ?? '',
                'description' => $item->description ?? '',
                'quantity' => (float) $item->quantity,
                'requested_quantity' => (float) ($item->requested_quantity ?? $item->quantity),
                'unit' => $item->unit,
                'unit_price' => (float) $item->unit_price,
                'discount_type' => 'percentage',
                'discount_value' => (float) ($item->discount_percentage ?? 0),
                'vat_rate' => (float) $item->vat_rate,
                'is_custom' => (bool) $item->is_custom_item,
                'is_free' => (bool) $item->is_free,
                'image_url' => $item->image_url,
                'product_specifications' => $item->product_specifications,
            ];
        });

        // Transform quotation data for frontend
        $quotationData = [
            'id' => $quotation->id,
            'quotation_number' => $quotation->quotation_number,
            'client_id' => $quotation->client_id,
            'quotation_date' => $quotation->quotation_date->format('Y-m-d'),
            'valid_until' => $quotation->valid_until?->format('Y-m-d'),
            'expected_delivery_date' => $quotation->expected_delivery_date?->format('Y-m-d'),
            'reference' => $quotation->reference,
            'customer_reference' => $quotation->customer_reference,
            'currency' => $quotation->currency,
            'country' => $quotation->country ?? 'Saudi Arabia',
            'discount_type' => 'percentage',
            'discount_value' => (float) ($quotation->discount_percentage ?? 0),
            'transport_charges' => (float) ($quotation->transport_charges ?? 0),
            'transport_free' => (bool) $quotation->transport_free,
            'transport_notes' => $quotation->transport_notes,
            'internal_notes' => $quotation->internal_notes,
            'terms_and_conditions' => $quotation->terms_and_conditions,
            'total_amperes' => $quotation->total_amperes,
            'items' => $transformedItems,
        ];

        return Inertia::render('Quotations/Edit', [
            'quotation' => $quotationData,
            'clients' => $clients,
            'vatRate' => (float) SystemSetting::getValue('default_vat_rate', 15),
            'defaultTerms' => SystemSetting::getValue('default_terms_and_conditions', ''),
            'currencies' => ['SAR', 'AED', 'USD', 'EUR'],
        ]);
    }

    /**
     * Update the specified quotation.
     */
    public function update(Request $request, Quotation $quotation)
    {
        if (!$quotation->isEditable()) {
            return back()->withErrors(['error' => 'This quotation cannot be edited.']);
        }

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'reference' => 'nullable|string|max:100',
            'customer_reference' => 'required|string|max:100',
            'quotation_date' => 'required|date',
            'valid_until' => 'required|date|after:quotation_date',
            'expected_delivery_date' => 'nullable|date',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'transport_charges' => 'nullable|numeric|min:0',
            'transport_free' => 'boolean',
            'transport_notes' => 'nullable|string',
            'default_vat_rate' => 'required|numeric|min:0|max:100',
            'vat_inclusive' => 'boolean',
            'currency' => 'required|string|max:3',
            'country' => 'nullable|string|max:100',
            'phone_code' => 'nullable|string|max:10',
            'phone_number' => 'nullable|string|max:20',
            'terms_and_conditions' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'delivery_terms' => 'nullable|string',
            'warranty_terms' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:quotation_items,id',
            'items.*.product_id' => 'nullable|integer', // Local product ID (null for EKUEP/custom)
            'items.*.external_id' => 'nullable|string|max:100', // EKUEP product ID
            'items.*.source' => 'nullable|string|in:ekuep,local,custom',
            'items.*.item_code' => 'nullable|string|max:100',
            'items.*.name' => 'required|string|max:255',
            'items.*.original_name' => 'nullable|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.image_url' => 'nullable|string|max:500',
            'items.*.slug' => 'nullable|string|max:255',
            'items.*.product_specifications' => 'nullable|array',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.requested_quantity' => 'nullable|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.vat_rate' => 'required|numeric|min:0|max:100',
            'items.*.is_custom_item' => 'boolean',
            'items.*.is_transport_item' => 'boolean',
            'items.*.is_free' => 'boolean',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Get client for contact snapshot
            $client = Client::findOrFail($validated['client_id']);

            // Update quotation
            $quotation->update([
                'client_id' => $validated['client_id'],
                'title' => $validated['title'] ?? null,
                'description' => $validated['description'] ?? null,
                'reference' => $validated['reference'] ?? null,
                'customer_reference' => $validated['customer_reference'],
                'country' => $validated['country'] ?? 'Saudi Arabia',
                'quotation_date' => $validated['quotation_date'],
                'valid_until' => $validated['valid_until'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'discount_percentage' => $validated['discount_percentage'] ?? 0,
                'transport_charges' => $validated['transport_charges'] ?? 0,
                'transport_free' => $validated['transport_free'] ?? false,
                'transport_notes' => $validated['transport_notes'] ?? null,
                'default_vat_rate' => $validated['default_vat_rate'],
                'vat_inclusive' => $validated['vat_inclusive'] ?? false,
                'currency' => $validated['currency'],
                'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'delivery_terms' => $validated['delivery_terms'] ?? null,
                'warranty_terms' => $validated['warranty_terms'] ?? null,
                'internal_notes' => $validated['internal_notes'] ?? null,
                'client_contact_name' => $client->contact_person ?? $client->name,
                'client_contact_email' => $client->contact_email ?? $client->email,
                'client_contact_phone' => $client->contact_phone ?? $client->phone,
            ]);

            // Get existing item IDs
            $existingItemIds = $quotation->items->pluck('id')->toArray();
            $updatedItemIds = [];

            // Update or create items
            foreach ($validated['items'] as $index => $itemData) {
                // Ensure product_id is either a valid ID or null (not 0 or empty string)
                $productId = !empty($itemData['product_id']) && $itemData['product_id'] > 0
                    ? $itemData['product_id']
                    : null;

                // Determine source: ekuep (external), local (product_id set), or custom
                $source = $itemData['source'] ?? QuotationItem::SOURCE_CUSTOM;
                if (!$source || $source === 'custom') {
                    if ($productId) {
                        $source = QuotationItem::SOURCE_LOCAL;
                    } elseif (!empty($itemData['external_id'])) {
                        $source = QuotationItem::SOURCE_EKUEP;
                    } else {
                        $source = QuotationItem::SOURCE_CUSTOM;
                    }
                }

                $itemPayload = [
                    'quotation_id' => $quotation->id,
                    'product_id' => $productId,
                    'external_id' => $itemData['external_id'] ?? null,
                    'source' => $source,
                    'item_code' => $itemData['item_code'] ?? null,
                    'name' => $itemData['name'],
                    'original_name' => $itemData['original_name'] ?? null,
                    'description' => $itemData['description'] ?? null,
                    'image_url' => $itemData['image_url'] ?? null,
                    'slug' => $itemData['slug'] ?? null,
                    'product_specifications' => $itemData['product_specifications'] ?? null,
                    'unit' => $itemData['unit'],
                    'unit_price' => $itemData['unit_price'],
                    'quantity' => $itemData['quantity'],
                    'requested_quantity' => $itemData['requested_quantity'] ?? null,
                    'discount_percentage' => $itemData['discount_percentage'] ?? 0,
                    'vat_rate' => $itemData['vat_rate'],
                    'vat_inclusive' => $validated['vat_inclusive'] ?? false,
                    'is_custom_item' => $itemData['is_custom_item'] ?? ($source === QuotationItem::SOURCE_CUSTOM),
                    'is_transport_item' => $itemData['is_transport_item'] ?? false,
                    'is_free' => $itemData['is_free'] ?? false,
                    'sort_order' => $index,
                    'notes' => $itemData['notes'] ?? null,
                ];

                if (!empty($itemData['id'])) {
                    $item = QuotationItem::find($itemData['id']);
                    if ($item && $item->quotation_id === $quotation->id) {
                        $item->update($itemPayload);
                        $updatedItemIds[] = $item->id;
                    }
                } else {
                    $item = QuotationItem::create($itemPayload);
                    $updatedItemIds[] = $item->id;
                }
            }

            // Delete removed items
            $itemsToDelete = array_diff($existingItemIds, $updatedItemIds);
            if (!empty($itemsToDelete)) {
                QuotationItem::whereIn('id', $itemsToDelete)->delete();
            }

            // Recalculate totals
            $quotation->refresh();
            $quotation->calculateTotals();

            // Record history
            $quotation->statusHistory()->create([
                'user_id' => auth()->id(),
                'from_status' => $quotation->status,
                'to_status' => $quotation->status,
                'action' => 'updated',
                'notes' => 'Quotation updated',
            ]);

            // Log activity
            ActivityLog::log(
                'updated',
                "Updated quotation {$quotation->quotation_number}",
                $quotation,
                auth()->user(),
                [],
                [],
                'quotations'
            );

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Quotation updated successfully.',
                    'quotation' => $quotation->fresh(),
                    'redirect' => route('quotations.show', $quotation),
                ]);
            }

            return redirect()->route('quotations.show', $quotation)
                ->with('success', 'Quotation updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating quotation: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'quotation_id' => $quotation->id,
                'quotation_number' => $quotation->quotation_number,
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to update quotation: ' . $e->getMessage(),
                    'error' => $e->getMessage(),
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to update quotation: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified quotation.
     */
    public function destroy(Quotation $quotation)
    {
        if (!in_array($quotation->status, [Quotation::STATUS_DRAFT, Quotation::STATUS_CANCELLED])) {
            return back()->withErrors(['error' => 'Only draft or cancelled quotations can be deleted.']);
        }

        $quotationNumber = $quotation->quotation_number;
        $quotation->delete();

        ActivityLog::log(
            'deleted',
            "Deleted quotation {$quotationNumber}",
            null,
            auth()->user(),
            ['quotation_number' => $quotationNumber],
            [],
            'quotations'
        );

        return redirect()->route('quotations.index')
            ->with('success', 'Quotation deleted successfully.');
    }

    /**
     * Submit quotation for review.
     */
    public function submitForReview(Quotation $quotation)
    {
        if ($quotation->status !== Quotation::STATUS_DRAFT) {
            return back()->withErrors(['error' => 'Only draft quotations can be submitted for review.']);
        }

        $quotation->changeStatus(Quotation::STATUS_PENDING_REVIEW, auth()->id(), 'Submitted for review');

        ActivityLog::log(
            'status_changed',
            "Submitted quotation {$quotation->quotation_number} for review",
            $quotation,
            auth()->user(),
            [],
            [],
            'quotations'
        );

        return back()->with('success', 'Quotation submitted for review.');
    }

    /**
     * Approve quotation.
     */
    public function approve(Quotation $quotation)
    {
        if (!$quotation->canBeApproved()) {
            return back()->withErrors(['error' => 'This quotation cannot be approved.']);
        }

        $quotation->changeStatus(Quotation::STATUS_APPROVED, auth()->id(), 'Quotation approved');

        ActivityLog::log(
            'approved',
            "Approved quotation {$quotation->quotation_number}",
            $quotation,
            auth()->user(),
            [],
            [],
            'quotations'
        );

        return back()->with('success', 'Quotation approved.');
    }

    /**
     * Reject quotation.
     */
    public function reject(Request $request, Quotation $quotation)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        if ($quotation->status !== Quotation::STATUS_PENDING_REVIEW) {
            return back()->withErrors(['error' => 'Only pending review quotations can be rejected.']);
        }

        $quotation->rejection_reason = $request->reason;
        $quotation->save();
        $quotation->changeStatus(Quotation::STATUS_DRAFT, auth()->id(), $request->reason);

        ActivityLog::log(
            'rejected',
            "Rejected quotation {$quotation->quotation_number}",
            $quotation,
            auth()->user(),
            ['reason' => $request->reason],
            [],
            'quotations'
        );

        return back()->with('success', 'Quotation rejected and returned to draft.');
    }

    /**
     * Send quotation to client.
     */
    public function send(Request $request, Quotation $quotation)
    {
        $request->validate([
            'email' => 'required|email',
            'subject' => 'nullable|string|max:255',
            'message' => 'nullable|string',
        ]);

        if (!$quotation->canBeSent()) {
            return back()->withErrors(['error' => 'This quotation cannot be sent.']);
        }

        // Dispatch background job
        SendQuotationEmail::dispatch(
            $quotation,
            $request->email,
            $request->subject,
            $request->message,
            auth()->user()
        );

        return back()->with('success', 'Quotation is being sent. You will be notified once it\'s delivered.');
    }

    /**
     * Mark quotation as accepted by client.
     */
    public function markAccepted(Quotation $quotation)
    {
        if ($quotation->status !== Quotation::STATUS_SENT) {
            return back()->withErrors(['error' => 'Only sent quotations can be marked as accepted.']);
        }

        $quotation->changeStatus(Quotation::STATUS_ACCEPTED, auth()->id(), 'Client accepted the quotation');

        ActivityLog::log(
            'accepted',
            "Quotation {$quotation->quotation_number} accepted by client",
            $quotation,
            auth()->user(),
            [],
            [],
            'quotations'
        );

        return back()->with('success', 'Quotation marked as accepted.');
    }

    /**
     * Mark quotation as rejected by client.
     */
    public function markRejected(Request $request, Quotation $quotation)
    {
        $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        if ($quotation->status !== Quotation::STATUS_SENT) {
            return back()->withErrors(['error' => 'Only sent quotations can be marked as rejected.']);
        }

        $quotation->rejection_reason = $request->reason;
        $quotation->save();
        $quotation->changeStatus(Quotation::STATUS_REJECTED, auth()->id(), $request->reason ?? 'Client rejected the quotation');

        ActivityLog::log(
            'rejected',
            "Quotation {$quotation->quotation_number} rejected by client",
            $quotation,
            auth()->user(),
            ['reason' => $request->reason],
            [],
            'quotations'
        );

        return back()->with('success', 'Quotation marked as rejected.');
    }

    /**
     * Change quotation status via API (AJAX).
     */
    public function changeStatusApi(Request $request, Quotation $quotation)
    {
        $request->validate([
            'status' => 'required|string|in:draft,pending_review,approved,sent,accepted,rejected,expired,cancelled',
            'notes' => 'nullable|string|max:1000',
        ]);

        $newStatus = $request->status;
        $currentStatus = $quotation->status;
        $notes = $request->notes;

        // Define valid transitions
        $validTransitions = [
            'draft' => ['pending_review', 'cancelled'],
            'pending_review' => ['approved', 'draft', 'cancelled'],
            'approved' => ['sent', 'draft', 'cancelled'],
            'sent' => ['accepted', 'rejected', 'expired', 'cancelled'],
            'cancelled' => ['draft'],
        ];

        if (!isset($validTransitions[$currentStatus]) || !in_array($newStatus, $validTransitions[$currentStatus])) {
            return response()->json([
                'message' => "Cannot change status from {$currentStatus} to {$newStatus}.",
            ], 422);
        }

        try {
            // Apply the status change
            $quotation->changeStatus($newStatus, auth()->id(), $notes);

            // Handle specific status transitions
            if ($newStatus === Quotation::STATUS_APPROVED) {
                $quotation->approved_at = now();
                $quotation->approved_by = auth()->id();
            } elseif ($newStatus === Quotation::STATUS_SENT) {
                $quotation->sent_at = now();
            } elseif ($newStatus === Quotation::STATUS_ACCEPTED) {
                $quotation->accepted_at = now();
            } elseif ($newStatus === Quotation::STATUS_REJECTED) {
                $quotation->rejected_at = now();
                $quotation->rejection_reason = $notes;
            }
            $quotation->save();

            ActivityLog::log(
                'status_changed',
                "Quotation {$quotation->quotation_number} status changed from {$currentStatus} to {$newStatus}",
                $quotation,
                auth()->user(),
                ['from' => $currentStatus, 'to' => $newStatus, 'notes' => $notes],
                [],
                'quotations'
            );

            return response()->json([
                'message' => 'Status updated successfully.',
                'quotation' => $quotation->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error changing quotation status: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'quotation_id' => $quotation->id,
                'from_status' => $currentStatus,
                'to_status' => $newStatus,
            ]);
            return response()->json([
                'message' => 'Failed to update status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new version of quotation.
     */
    public function createVersion(Quotation $quotation)
    {
        $newQuotation = $quotation->createNewVersion();
        $newQuotation->user_id = auth()->id();
        $newQuotation->save();

        // Record history
        $newQuotation->statusHistory()->create([
            'user_id' => auth()->id(),
            'from_status' => null,
            'to_status' => Quotation::STATUS_DRAFT,
            'action' => 'version_created',
            'notes' => "Created from version {$quotation->version}",
            'metadata' => ['parent_id' => $quotation->id],
        ]);

        ActivityLog::log(
            'created',
            "Created new version of quotation {$quotation->quotation_number}",
            $newQuotation,
            auth()->user(),
            ['original_id' => $quotation->id],
            [],
            'quotations'
        );

        return redirect()->route('quotations.edit', $newQuotation)
            ->with('success', "New version created: {$newQuotation->quotation_number}");
    }

    /**
     * Generate PDF for quotation.
     */
    public function generatePdf(Quotation $quotation)
    {
        // Dispatch background job
        GenerateQuotationPdf::dispatch($quotation, auth()->user());

        return back()->with('success', 'PDF is being generated. You will be notified once it\'s ready.');
    }

    /**
     * Download PDF for quotation (generates on-the-fly using mPDF).
     */
    public function downloadPdf(Quotation $quotation)
    {
        $quotation->load([
            'client',
            'user:id,name,email',
            'items',
        ]);

        // Get company settings
        $companySettings = [
            'name' => SystemSetting::getValue('company_name', 'Ekuep.com'),
            'address' => SystemSetting::getValue('company_address', 'Wosol For Communication & Information Technology'),
            'phone' => SystemSetting::getValue('company_phone', '920035110'),
            'email' => SystemSetting::getValue('company_email', 'ekuep@ekuep.com'),
            'vat_number' => SystemSetting::getValue('company_vat_number', '300774863200003'),
            'logo_url' => SystemSetting::getValue('company_logo_url', ''),
        ];

        try {
            // Render the blade view to HTML
            $html = view('pdf.quotation', [
                'quotation' => $quotation,
                'company' => $companySettings,
            ])->render();

            // Create mPDF instance with Arabic support
            $mpdf = new \Mpdf\Mpdf([
                'mode' => 'utf-8',
                'format' => 'A4',
                'margin_left' => 10,
                'margin_right' => 10,
                'margin_top' => 10,
                'margin_bottom' => 10,
                'default_font' => 'dejavusans',
                'tempDir' => storage_path('app/mpdf'),
            ]);

            // Enable auto language detection for Arabic
            $mpdf->autoScriptToLang = true;
            $mpdf->autoLangToFont = true;

            // Write HTML to PDF
            $mpdf->WriteHTML($html);

            // Update quotation pdf info
            $filename = "quotations/{$quotation->quotation_number}.pdf";
            Storage::put($filename, $mpdf->Output('', 'S'));
            $quotation->pdf_path = $filename;
            $quotation->pdf_generated_at = now();
            $quotation->save();

            // Return PDF download
            return response($mpdf->Output('', 'S'), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="Quotation-' . $quotation->quotation_number . '.pdf"',
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating PDF on-the-fly: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'quotation_id' => $quotation->id,
                'quotation_number' => $quotation->quotation_number,
            ]);
            return back()->withErrors(['error' => 'Failed to generate PDF: ' . $e->getMessage()]);
        }
    }

    /**
     * Export quotations to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        try {
        $query = Quotation::with(['client:id,company_name', 'user:id,name'])->latest();

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('quotation_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('quotation_date', '<=', $request->date_to);
        }

        $quotations = $query->get();
        $filename = 'quotations-' . date('Y-m-d-His') . '.csv';

        Log::info('Quotations exported', [
            'user_id' => auth()->id(),
            'count' => $quotations->count(),
            'filename' => $filename,
        ]);

        ActivityLog::log(
            'exported',
            "Exported {$quotations->count()} quotations to CSV",
            null,
            auth()->user(),
            ['count' => $quotations->count(), 'filename' => $filename],
            [],
            'quotations'
        );

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($quotations) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'Quotation Number',
                'Title',
                'Client',
                'Created By',
                'Status',
                'Date',
                'Valid Until',
                'Subtotal',
                'Discount',
                'VAT',
                'Grand Total',
                'Currency',
            ]);

            foreach ($quotations as $quotation) {
                fputcsv($file, [
                    $quotation->quotation_number,
                    $quotation->title ?? '-',
                    $quotation->client?->company_name ?? '-',
                    $quotation->user?->name ?? '-',
                    ucfirst(str_replace('_', ' ', $quotation->status)),
                    $quotation->quotation_date->format('Y-m-d'),
                    $quotation->valid_until->format('Y-m-d'),
                    number_format($quotation->subtotal, 2),
                    number_format($quotation->total_discount, 2),
                    number_format($quotation->total_vat, 2),
                    number_format($quotation->grand_total, 2),
                    $quotation->currency,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Error exporting quotations: ' . $e->getMessage(), ['user_id' => auth()->id()]);
            return back()->with('error', 'Failed to export quotations. Please try again.');
        }
    }

    /**
     * Search products for autocomplete from EKUEP API.
     */
    public function searchProducts(Request $request)
    {
        $search = $request->get('search', '');

        if (empty(trim($search))) {
            return response()->json(['products' => []]);
        }

        // Fetch products from EKUEP API
        $ekuepService = new EkuepApiService();
        $products = $ekuepService->searchProducts($search, 20);

        return response()->json(['products' => $products]);
    }

    /**
     * Parse uploaded file and return extracted data.
     */
    public function parseFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // Max 10MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = ['xlsx', 'xls', 'csv', 'docx'];

        if (!in_array($extension, $allowedExtensions)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid file format. Supported formats: ' . implode(', ', $allowedExtensions),
            ], 422);
        }

        try {
            $parser = new FileParserService();
            $parsedData = $parser->parse($file);

            // Validate minimum requirements
            if (!$parser->validateMinimumColumns($parsedData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File must contain at least 2 columns.',
                ], 422);
            }

            if (!$parser->validateMinimumRows($parsedData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File must contain at least 1 data row.',
                ], 422);
            }

            Log::info('File parsed for quotation', [
                'user_id' => auth()->id(),
                'filename' => $file->getClientOriginalName(),
                'rows' => $parsedData['total_rows'] ?? 0,
            ]);

            return response()->json([
                'success' => true,
                'data' => $parsedData,
            ]);
        } catch (\Exception $e) {
            Log::error('Error parsing file for quotation: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'filename' => $file->getClientOriginalName(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse file: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search products by references from parsed file using EKUEP API.
     */
    public function searchProductsByReferences(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'references' => 'required|array|min:1',
            'references.*.reference' => 'required|string',
            'references.*.quantity' => 'nullable|numeric|min:0',
            'references.*.name' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Extract all references for batch lookup
        $referenceCodes = array_map(
            fn($item) => trim($item['reference']),
            $request->references
        );

        // Search EKUEP API for all references
        $ekuepService = new EkuepApiService();
        $foundProducts = $ekuepService->searchByReferences($referenceCodes);

        $results = [];

        foreach ($request->references as $item) {
            $reference = trim($item['reference']);
            $quantity = $item['quantity'] ?? 1;
            $originalName = $item['name'] ?? null;

            // Get product from API results
            $product = $foundProducts[$reference] ?? null;

            $results[] = [
                'reference' => $reference,
                'original_name' => $originalName,
                'requested_quantity' => $quantity,
                'product' => $product,
                'found' => $product !== null,
            ];
        }

        $foundCount = collect($results)->where('found', true)->count();
        $notFoundCount = collect($results)->where('found', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $results,
                'summary' => [
                    'total' => count($results),
                    'found' => $foundCount,
                    'not_found' => $notFoundCount,
                ],
            ],
        ]);
    }

    /**
     * Quick create quotation from file upload (combines parsing and creation).
     */
    public function createFromFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240',
            'reference_column' => 'required|integer|min:0',
            'quantity_column' => 'required|integer|min:0',
            'name_column' => 'nullable|integer|min:0',
            'client_id' => 'required|exists:clients,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $parser = new FileParserService();
            $parsedData = $parser->parse($request->file('file'));

            // Extract product data from parsed file
            $productData = $parser->extractProductData(
                $parsedData,
                $request->reference_column,
                $request->quantity_column,
                $request->name_column
            );

            // Get references for EKUEP API lookup
            $referenceCodes = array_column($productData, 'reference');

            // Search EKUEP API for all references
            $ekuepService = new EkuepApiService();
            $foundProducts = $ekuepService->searchByReferences($referenceCodes);

            // Match products with requested data
            $items = [];
            foreach ($productData as $item) {
                $product = $foundProducts[$item['reference']] ?? null;

                if ($product) {
                    $items[] = [
                        'product' => $product,
                        'quantity' => $item['quantity'],
                        'original_name' => $item['name'],
                        'requested_quantity' => $item['quantity'],
                    ];
                }
            }

            if (empty($items)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No matching products found for the references in the file.',
                ], 422);
            }

            // Create quotation
            DB::beginTransaction();

            $client = Client::findOrFail($request->client_id);
            $validityDays = (int) SystemSetting::getValue('quotation_validity_days', 30);
            $vatRate = (float) SystemSetting::getValue('default_vat_rate', 15);

            $quotation = Quotation::create([
                'quotation_number' => Quotation::generateQuotationNumber(),
                'client_id' => $client->id,
                'user_id' => auth()->id(),
                'quotation_date' => now()->format('Y-m-d'),
                'valid_until' => now()->addDays($validityDays)->format('Y-m-d'),
                'status' => Quotation::STATUS_DRAFT,
                'default_vat_rate' => $vatRate,
                'currency' => SystemSetting::getValue('default_currency', 'SAR'),
                'client_contact_name' => $client->contact_person ?? $client->name,
                'client_contact_email' => $client->contact_email ?? $client->email,
                'client_contact_phone' => $client->contact_phone ?? $client->phone,
            ]);

            // Create items from EKUEP API product data
            foreach ($items as $itemData) {
                QuotationItem::createFromApiProduct(
                    $itemData['product'],
                    $quotation,
                    $itemData['quantity'],
                    [
                        'original_name' => $itemData['original_name'],
                        'requested_quantity' => $itemData['requested_quantity'],
                    ]
                );
            }

            // Record history
            $quotation->statusHistory()->create([
                'user_id' => auth()->id(),
                'from_status' => null,
                'to_status' => Quotation::STATUS_DRAFT,
                'action' => 'created_from_file',
                'notes' => 'Quotation created from file: ' . $request->file('file')->getClientOriginalName(),
            ]);

            ActivityLog::log(
                'created',
                "Created quotation {$quotation->quotation_number} from file upload",
                $quotation,
                auth()->user(),
                ['source_file' => $request->file('file')->getClientOriginalName()],
                [],
                'quotations'
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'quotation_id' => $quotation->id,
                    'quotation_number' => $quotation->quotation_number,
                    'items_count' => count($items),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quotation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available currencies with their countries.
     */
    public function getCurrencies()
    {
        return response()->json([
            'currencies' => [
                ['code' => 'SAR', 'name' => 'Saudi Riyal', 'country' => 'KSA', 'symbol' => 'SAR'],
                ['code' => 'AED', 'name' => 'UAE Dirham', 'country' => 'UAE', 'symbol' => 'AED'],
                ['code' => 'USD', 'name' => 'US Dollar', 'country' => 'USA', 'symbol' => '$'],
                ['code' => 'EUR', 'name' => 'Euro', 'country' => 'EU', 'symbol' => '€'],
            ],
        ]);
    }
}
