<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('login');
        }

        // Super admin has all permissions
        if ($user->role && $user->role->slug === 'super-admin') {
            return $next($request);
        }

        // Check if user has any of the required permissions
        foreach ($permissions as $permission) {
            if ($user->hasPermission($permission)) {
                return $next($request);
            }
        }

        Log::warning('Permission denied', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'required_permissions' => $permissions,
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'ip' => $request->ip(),
        ]);

        if ($request->expectsJson()) {
            return response()->json(['message' => 'You do not have permission to perform this action.'], 403);
        }

        abort(403, 'You do not have permission to perform this action.');
    }
}
