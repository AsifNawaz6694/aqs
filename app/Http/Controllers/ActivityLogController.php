<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
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

        // Filter by user (supports comma-separated multi-select)
        if ($request->filled('user_id')) {
            $userIds = array_filter(explode(',', $request->user_id));
            $query->whereIn('causer_id', $userIds)
                  ->where('causer_type', User::class);
        }

        // Filter by event (supports comma-separated multi-select)
        if ($request->filled('event')) {
            $events = array_filter(explode(',', $request->event));
            $query->whereIn('event', $events);
        }

        // Filter by subject type (supports comma-separated multi-select)
        if ($request->filled('subject_type')) {
            $subjectTypes = array_filter(explode(',', $request->subject_type));
            $query->whereIn('subject_type', $subjectTypes);
        }

        // Filter by module (supports comma-separated multi-select)
        if ($request->filled('module')) {
            $modules = array_filter(explode(',', $request->module));
            $query->whereIn('module', $modules);
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

        // Job monitoring data
        $jobStats = $this->getJobStats();

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'users' => $users,
            'events' => $events,
            'subjectTypes' => $subjectTypes,
            'modules' => $modules,
            'filters' => $request->only(['user_id', 'event', 'subject_type', 'module', 'date_from', 'date_to', 'search']),
            'jobStats' => $jobStats,
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
        try {
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

            Log::info('Activity logs exported', [
                'user_id' => auth()->id(),
                'count' => $logs->count(),
                'filename' => $filename,
                'filters' => $request->only(['user_id', 'event', 'subject_type', 'date_from', 'date_to', 'search']),
            ]);

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
        } catch (\Exception $e) {
            Log::error('Error exporting activity logs: ' . $e->getMessage(), ['user_id' => auth()->id()]);
            return back()->with('error', 'Failed to export activity logs. Please try again.');
        }
    }

    /**
     * Get job queue statistics.
     */
    private function getJobStats(): array
    {
        $pendingJobs = DB::table('jobs')->select('id', 'queue', 'payload', 'attempts', 'created_at', 'available_at', 'reserved_at')
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($job) {
                $payload = json_decode($job->payload, true);
                $jobClass = $payload['displayName'] ?? 'Unknown';
                return [
                    'id' => $job->id,
                    'queue' => $job->queue,
                    'job_class' => class_basename($jobClass),
                    'job_class_full' => $jobClass,
                    'attempts' => $job->attempts,
                    'is_reserved' => $job->reserved_at !== null,
                    'created_at' => date('Y-m-d H:i:s', $job->created_at),
                    'available_at' => date('Y-m-d H:i:s', $job->available_at),
                    'reserved_at' => $job->reserved_at ? date('Y-m-d H:i:s', $job->reserved_at) : null,
                ];
            });

        $failedJobs = DB::table('failed_jobs')->select('id', 'uuid', 'connection', 'queue', 'payload', 'exception', 'failed_at')
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($job) {
                $payload = json_decode($job->payload, true);
                $jobClass = $payload['displayName'] ?? 'Unknown';
                $exceptionLines = explode("\n", $job->exception);
                return [
                    'id' => $job->id,
                    'uuid' => $job->uuid,
                    'queue' => $job->queue,
                    'job_class' => class_basename($jobClass),
                    'job_class_full' => $jobClass,
                    'exception_summary' => $exceptionLines[0] ?? 'Unknown error',
                    'exception_full' => $job->exception,
                    'failed_at' => $job->failed_at,
                ];
            });

        return [
            'pending_count' => DB::table('jobs')->count(),
            'reserved_count' => DB::table('jobs')->whereNotNull('reserved_at')->count(),
            'failed_count' => DB::table('failed_jobs')->count(),
            'pending_jobs' => $pendingJobs,
            'failed_jobs' => $failedJobs,
        ];
    }

    /**
     * Retry a failed job.
     */
    public function retryFailedJob(Request $request, $id)
    {
        $job = DB::table('failed_jobs')->where('id', $id)->first();

        if (!$job) {
            return response()->json(['message' => 'Failed job not found.'], 404);
        }

        try {
            Artisan::call('queue:retry', ['id' => [$job->uuid]]);

            return response()->json(['message' => 'Job has been pushed back to the queue.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retry job: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a failed job.
     */
    public function deleteFailedJob(Request $request, $id)
    {
        $deleted = DB::table('failed_jobs')->where('id', $id)->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Failed job not found.'], 404);
        }

        return response()->json(['message' => 'Failed job deleted.']);
    }

    /**
     * Flush all failed jobs.
     */
    public function flushFailedJobs()
    {
        DB::table('failed_jobs')->truncate();

        return response()->json(['message' => 'All failed jobs have been cleared.']);
    }

    /**
     * Retry all failed jobs.
     */
    public function retryAllFailedJobs()
    {
        try {
            Artisan::call('queue:retry', ['id' => ['all']]);

            return response()->json(['message' => 'All failed jobs have been pushed back to the queue.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retry jobs: ' . $e->getMessage()], 500);
        }
    }
}
