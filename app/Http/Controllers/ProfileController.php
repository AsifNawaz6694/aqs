<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Profile;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->load('profile');

        // Ensure profile exists
        if (!$user->profile) {
            $user->profile()->create([]);
            $user->load('profile');
        }

        return Inertia::render('Profile/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile' => $user->profile,
            ],
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $request->user()->id],
            'company_name' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'mobile' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
        ]);

        try {
            $user = $request->user();
            $oldData = ['name' => $user->name, 'email' => $user->email];

            // Update user basic info
            $user->fill([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            $emailChanged = $user->isDirty('email');
            if ($emailChanged) {
                $user->email_verified_at = null;
            }

            $user->save();

            // Update profile
            $profileData = collect($validated)->except(['name', 'email'])->toArray();
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );

            Log::info('Profile updated', ['user_id' => $user->id, 'email_changed' => $emailChanged]);

            ActivityLog::log(
                'updated',
                "Updated profile information",
                $user,
                $user,
                ['email_changed' => $emailChanged],
                ['old' => $oldData, 'new' => ['name' => $validated['name'], 'email' => $validated['email']]],
                'profile'
            );

            return Redirect::route('profile.edit')->with('status', 'Profile updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating profile: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return back()->with('error', 'Failed to update profile. Please try again.');
        }
    }

    /**
     * Update user's avatar.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        try {
            $user = $request->user();

            // Delete old avatar if exists
            if ($user->profile?->avatar_path) {
                Storage::disk('public')->delete($user->profile->avatar_path);
            }

            // Store new avatar
            $path = $request->file('avatar')->store('avatars', 'public');

            // Update profile
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                ['avatar_path' => $path]
            );

            Log::info('Avatar updated', ['user_id' => $user->id]);

            ActivityLog::log(
                'updated',
                "Updated profile avatar",
                $user,
                $user,
                [],
                [],
                'profile'
            );

            return Redirect::route('profile.edit')->with('status', 'Avatar updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating avatar: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return back()->with('error', 'Failed to update avatar. Please try again.');
        }
    }

    /**
     * Remove user's avatar.
     */
    public function deleteAvatar(Request $request): RedirectResponse
    {
        try {
            $user = $request->user();

            if ($user->profile?->avatar_path) {
                Storage::disk('public')->delete($user->profile->avatar_path);
                $user->profile->update(['avatar_path' => null]);
            }

            Log::info('Avatar removed', ['user_id' => $user->id]);

            ActivityLog::log(
                'deleted',
                "Removed profile avatar",
                $user,
                $user,
                [],
                [],
                'profile'
            );

            return Redirect::route('profile.edit')->with('status', 'Avatar removed successfully.');
        } catch (\Exception $e) {
            Log::error('Error removing avatar: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return back()->with('error', 'Failed to remove avatar. Please try again.');
        }
    }

    /**
     * Update user's signature.
     */
    public function updateSignature(Request $request): RedirectResponse
    {
        $request->validate([
            'signature' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:1024'],
        ]);

        try {
            $user = $request->user();

            // Delete old signature if exists
            if ($user->profile?->signature_path) {
                Storage::disk('public')->delete($user->profile->signature_path);
            }

            // Store new signature
            $path = $request->file('signature')->store('signatures', 'public');

            // Update profile
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                ['signature_path' => $path]
            );

            Log::info('Signature updated', ['user_id' => $user->id]);

            ActivityLog::log(
                'updated',
                "Updated profile signature",
                $user,
                $user,
                [],
                [],
                'profile'
            );

            return Redirect::route('profile.edit')->with('status', 'Signature updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating signature: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return back()->with('error', 'Failed to update signature. Please try again.');
        }
    }

    /**
     * Remove user's signature.
     */
    public function deleteSignature(Request $request): RedirectResponse
    {
        try {
            $user = $request->user();

            if ($user->profile?->signature_path) {
                Storage::disk('public')->delete($user->profile->signature_path);
                $user->profile->update(['signature_path' => null]);
            }

            Log::info('Signature removed', ['user_id' => $user->id]);

            ActivityLog::log(
                'deleted',
                "Removed profile signature",
                $user,
                $user,
                [],
                [],
                'profile'
            );

            return Redirect::route('profile.edit')->with('status', 'Signature removed successfully.');
        } catch (\Exception $e) {
            Log::error('Error removing signature: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return back()->with('error', 'Failed to remove signature. Please try again.');
        }
    }

    /**
     * Update user's password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        try {
            $user = $request->user();

            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            Log::info('Password changed', ['user_id' => $user->id]);

            ActivityLog::log(
                'updated',
                "Changed account password",
                $user,
                $user,
                [],
                [],
                'profile'
            );

            return Redirect::route('profile.edit')->with('status', 'Password updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating password: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return back()->with('error', 'Failed to update password. Please try again.');
        }
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();
        $userId = $user->id;
        $userEmail = $user->email;

        try {
            Log::warning('Account deletion initiated', ['user_id' => $userId, 'email' => $userEmail]);

            ActivityLog::log(
                'deleted',
                "User account deleted: {$user->name} ({$userEmail})",
                null,
                $user,
                ['user_id' => $userId, 'email' => $userEmail],
                [],
                'profile'
            );

            // Delete avatar and signature files
            if ($user->profile) {
                if ($user->profile->avatar_path) {
                    Storage::disk('public')->delete($user->profile->avatar_path);
                }
                if ($user->profile->signature_path) {
                    Storage::disk('public')->delete($user->profile->signature_path);
                }
            }

            Auth::logout();

            $user->delete();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            Log::info('Account deleted successfully', ['user_id' => $userId, 'email' => $userEmail]);

            return Redirect::to('/');
        } catch (\Exception $e) {
            Log::error('Error deleting account: ' . $e->getMessage(), ['user_id' => $userId]);
            return back()->with('error', 'Failed to delete account. Please try again.');
        }
    }
}
