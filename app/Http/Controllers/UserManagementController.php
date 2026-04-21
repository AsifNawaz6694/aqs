<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Profile;
use App\Models\ActivityLog;
use App\Mail\PasswordSetupMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        try {
            $query = User::with(['role', 'profile']);

            // Search across all visible columns
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('status', 'like', "%{$search}%")
                      ->orWhereHas('profile', function ($pq) use ($search) {
                          $pq->where('company_name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('role', function ($rq) use ($search) {
                          $rq->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Role filter (supports comma-separated multi-select)
            if ($request->filled('role_id')) {
                $roleIds = array_filter(explode(',', $request->role_id));
                $query->whereIn('role_id', $roleIds);
            }

            // Status filter (supports comma-separated multi-select)
            if ($request->filled('status')) {
                $statuses = array_filter(explode(',', $request->status));
                $query->where(function ($q) use ($statuses) {
                    foreach ($statuses as $status) {
                        $q->orWhere(function ($sub) use ($status) {
                            switch ($status) {
                                case 'active':
                                    $sub->where('password_set', true)->where('status', 'active');
                                    break;
                                case 'pending':
                                    $sub->where('password_set', false);
                                    break;
                                case 'inactive':
                                    $sub->where('status', 'inactive');
                                    break;
                                case 'suspended':
                                    $sub->where('status', 'suspended');
                                    break;
                            }
                        });
                    }
                });
            }

            // Date range filter
            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Paginate results
            $users = $query->orderBy('created_at', 'desc')
                ->paginate(20)
                ->withQueryString();

            // Get roles for filter dropdown
            $roles = Role::select('id', 'name', 'slug')->get();

            return Inertia::render('Users/Index', [
                'users' => $users,
                'roles' => $roles,
                'filters' => $request->only([
                    'search', 'role_id', 'status', 'date_from', 'date_to'
                ]),
                'success' => session('success'),
                'error' => session('error'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading users list: ' . $e->getMessage());
            return back()->with('error', 'Failed to load users. Please try again.');
        }
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $roles = Role::select('id', 'name', 'slug', 'description')->get();

        return Inertia::render('Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role_id' => ['required', 'exists:roles,id'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'mobile' => ['nullable', 'string', 'max:20'],
        ]);

        try {
            DB::beginTransaction();

            // Generate password setup token
            $token = Str::random(64);

            // Create user with temporary password
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make(Str::random(32)),
                'role_id' => $validated['role_id'],
                'password_setup_token' => $token,
                'password_setup_token_expires_at' => now()->addHours(48),
                'password_set' => false,
                'status' => 'active',
            ]);

            // Create associated profile
            Profile::create([
                'user_id' => $user->id,
                'company_name' => $validated['company_name'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
                'department' => $validated['department'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'mobile' => $validated['mobile'] ?? null,
            ]);

            // Log activity
            ActivityLog::log(
                'created',
                "Created new user: {$user->name} ({$user->email})",
                $user,
                auth()->user(),
                ['user_id' => $user->id, 'email' => $user->email, 'role_id' => $user->role_id],
                ['new' => array_merge($validated, ['status' => 'active'])],
                'users'
            );

            // Send password setup email
            Mail::to($user->email)->send(new PasswordSetupMail($user));

            DB::commit();

            return redirect()->route('users.index')
                ->with('success', 'User created successfully. A password setup email has been sent.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating user: ' . $e->getMessage());
            return back()->withInput()->with('error', 'Failed to create user. Please try again.');
        }
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        $user->load(['role', 'profile']);

        return Inertia::render('Users/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        $user->load(['role', 'profile']);
        $roles = Role::select('id', 'name', 'slug', 'description')->get();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255',
                        Rule::unique('users')->ignore($user->id)],
            'role_id' => ['required', 'exists:roles,id'],
            'status' => ['required', 'in:active,inactive,suspended'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'mobile' => ['nullable', 'string', 'max:20'],
        ]);

        try {
            DB::beginTransaction();

            $oldData = $user->toArray();

            // Update user
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role_id' => $validated['role_id'],
                'status' => $validated['status'],
            ]);

            // Update or create profile
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'company_name' => $validated['company_name'] ?? null,
                    'job_title' => $validated['job_title'] ?? null,
                    'department' => $validated['department'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                    'mobile' => $validated['mobile'] ?? null,
                ]
            );

            // Log activity
            ActivityLog::log(
                'updated',
                "Updated user: {$user->name} ({$user->email})",
                $user,
                auth()->user(),
                ['user_id' => $user->id],
                ['old' => $oldData, 'new' => $validated],
                'users'
            );

            DB::commit();

            return redirect()->route('users.index')
                ->with('success', 'User updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating user: ' . $e->getMessage());
            return back()->withInput()->with('error', 'Failed to update user. Please try again.');
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return redirect()->back()
                ->with('error', 'You cannot delete your own account.');
        }

        try {
            DB::beginTransaction();

            $userName = $user->name;
            $userData = $user->toArray();

            // Log activity before deletion
            ActivityLog::log(
                'deleted',
                "Deleted user: {$userName} ({$user->email})",
                $user,
                auth()->user(),
                ['user_id' => $user->id, 'email' => $user->email],
                ['old' => $userData],
                'users'
            );

            // Soft delete
            $user->delete();

            DB::commit();

            return redirect()->route('users.index')
                ->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting user: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete user. Please try again.');
        }
    }

    /**
     * Resend setup email to user.
     */
    public function resendSetupEmail(User $user)
    {
        // Check if user already set password
        if ($user->password_set) {
            return redirect()->back()
                ->with('error', 'User has already set their password.');
        }

        try {
            // Generate new token
            $token = Str::random(64);
            $user->update([
                'password_setup_token' => $token,
                'password_setup_token_expires_at' => now()->addHours(48),
            ]);

            // Log activity
            ActivityLog::log(
                'resent_setup_email',
                "Resent password setup email to: {$user->name} ({$user->email})",
                $user,
                auth()->user(),
                ['user_id' => $user->id, 'email' => $user->email],
                [],
                'users'
            );

            // Send email
            Mail::to($user->email)->send(new PasswordSetupMail($user));

            return redirect()->back()
                ->with('success', 'Password setup email has been resent.');
        } catch (\Exception $e) {
            Log::error('Error resending setup email: ' . $e->getMessage());
            return back()->with('error', 'Failed to resend setup email. Please try again.');
        }
    }

    /**
     * Export users to CSV.
     */
    public function export(Request $request)
    {
        try {
            $query = User::with(['role', 'profile']);

            // Apply same filters as index
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->filled('role_id')) {
                $query->where('role_id', $request->role_id);
            }

            if ($request->filled('status')) {
                if ($request->status === 'active') {
                    $query->where('password_set', true);
                } elseif ($request->status === 'pending') {
                    $query->where('password_set', false);
                }
            }

            $users = $query->orderBy('created_at', 'desc')->get();

            $filename = 'users_' . now()->format('Y-m-d_His') . '.csv';

            // Log export activity
            ActivityLog::log(
                'exported',
                "Exported {$users->count()} users to CSV",
                null,
                auth()->user(),
                ['count' => $users->count(), 'filename' => $filename],
                [],
                'users'
            );

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function () use ($users) {
                $file = fopen('php://output', 'w');

                // CSV header
                fputcsv($file, [
                    'ID',
                    'Name',
                    'Email',
                    'Role',
                    'Company',
                    'Status',
                    'Created At',
                ]);

                // CSV data
                foreach ($users as $user) {
                    $status = $user->password_set ? 'Active' : 'Pending Setup';

                    fputcsv($file, [
                        $user->id,
                        $user->name,
                        $user->email,
                        $user->role->name ?? 'No Role',
                        $user->profile->company_name ?? '-',
                        $status,
                        $user->created_at->format('Y-m-d H:i:s'),
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Error exporting users: ' . $e->getMessage());
            return back()->with('error', 'Failed to export users. Please try again.');
        }
    }
}
