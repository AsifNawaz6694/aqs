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
                'event' => $log->event,
                'description' => $log->description,
                'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
                'subject_id' => $log->subject_id,
                'causer_name' => $log->causer instanceof User ? $log->causer->name : 'System',
                'causer_email' => $log->causer instanceof User ? $log->causer->email : null,
                'ip_address' => $log->ip_address,
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

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'users' => $users,
            'events' => $events,
            'subjectTypes' => $subjectTypes,
            'filters' => $request->only(['user_id', 'event', 'subject_type', 'date_from', 'date_to', 'search']),
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
