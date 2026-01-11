<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of activity logs.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::query()
            ->with('causer')
            ->latest();

        // Filter by user (causer)
        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->user_id)
                  ->where('causer_type', User::class);
        }

        // Filter by event
        if ($request->filled('event')) {
            $query->where('event', $request->event);
        }

        // Filter by subject type
        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }

        // Filter by module
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search in description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('description', 'like', "%{$search}%");
        }

        $logs = $query->paginate(25)->withQueryString();

        // Transform logs for frontend
        $logs->getCollection()->transform(function ($log) {
            return [
                'id' => $log->id,
                'log_name' => $log->log_name,
                'event' => $log->event,
                'description' => $log->description,
                'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
                'subject_type_full' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'causer_id' => $log->causer_id,
                'causer_name' => $log->causer instanceof User ? $log->causer->name : 'System',
                'causer_email' => $log->causer instanceof User ? $log->causer->email : null,
                'causer_role' => $log->causer instanceof User ? ($log->causer->role?->name ?? 'N/A') : null,
                'module' => $log->module,
                'properties' => $log->properties ?? [],
                'changes' => $log->changes ?? [],
                'has_changes' => !empty($log->changes),
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'url' => $log->url,
                'method' => $log->method,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                'created_at_human' => $log->created_at->diffForHumans(),
            ];
        });

        // Get filter options
        $users = User::select('id', 'name', 'email')->orderBy('name')->get();
        $events = ActivityLog::distinct()->pluck('event')->filter()->values();
        $subjectTypes = ActivityLog::distinct()
            ->pluck('subject_type')
            ->filter()
            ->map(fn($type) => ['value' => $type, 'label' => class_basename($type)])
            ->values();
        $modules = ActivityLog::distinct()->pluck('module')->filter()->values();

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'users' => $users,
            'events' => $events,
            'subjectTypes' => $subjectTypes,
            'modules' => $modules,
            'filters' => $request->only(['user_id', 'event', 'subject_type', 'module', 'date_from', 'date_to', 'search']),
        ]);
    }

    /**
     * Display the specified activity log.
     */
    public function show(ActivityLog $activityLog)
    {
        $activityLog->load('causer', 'subject');

        return response()->json([
            'id' => $activityLog->id,
            'log_name' => $activityLog->log_name,
            'event' => $activityLog->event,
            'description' => $activityLog->description,
            'subject_type' => $activityLog->subject_type ? class_basename($activityLog->subject_type) : null,
            'subject_type_full' => $activityLog->subject_type,
            'subject_id' => $activityLog->subject_id,
            'subject_data' => $activityLog->subject ? $activityLog->subject->toArray() : null,
            'causer_id' => $activityLog->causer_id,
            'causer_name' => $activityLog->causer instanceof User ? $activityLog->causer->name : 'System',
            'causer_email' => $activityLog->causer instanceof User ? $activityLog->causer->email : null,
            'causer_role' => $activityLog->causer instanceof User ? ($activityLog->causer->role?->name ?? 'N/A') : null,
            'module' => $activityLog->module,
            'properties' => $activityLog->properties ?? [],
            'changes' => $activityLog->changes ?? [],
            'ip_address' => $activityLog->ip_address,
            'user_agent' => $activityLog->user_agent,
            'url' => $activityLog->url,
            'method' => $activityLog->method,
            'created_at' => $activityLog->created_at->format('Y-m-d H:i:s'),
            'created_at_human' => $activityLog->created_at->diffForHumans(),
        ]);
    }

    /**
     * Export activity logs to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = ActivityLog::query()
            ->with('causer')
            ->latest();

        // Apply same filters as index
        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->user_id)
                  ->where('causer_type', User::class);
        }
        if ($request->filled('event')) {
            $query->where('event', $request->event);
        }
        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('description', 'like', "%{$search}%");
        }

        $logs = $query->get();
        $filename = 'activity-logs-' . date('Y-m-d-His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');

            // Header row
            fputcsv($file, [
                'ID',
                'User',
                'User Email',
                'Event',
                'Subject Type',
                'Subject ID',
                'Description',
                'IP Address',
                'Date/Time',
            ]);

            // Data rows
            foreach ($logs as $log) {
                $causerName = $log->causer instanceof User ? $log->causer->name : 'System';
                $causerEmail = $log->causer instanceof User ? $log->causer->email : '-';

                fputcsv($file, [
                    $log->id,
                    $causerName,
                    $causerEmail,
                    $log->event,
                    $log->subject_type ? class_basename($log->subject_type) : '-',
                    $log->subject_id ?? '-',
                    $log->description ?? '-',
                    $log->ip_address ?? '-',
                    $log->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
