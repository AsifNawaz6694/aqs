<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

        $user = $request->user();

        // Update user basic info
        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Update profile
        $profileData = collect($validated)->except(['name', 'email'])->toArray();
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        return Redirect::route('profile.edit')->with('status', 'Profile updated successfully.');
    }

    /**
     * Update user's avatar.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

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

        return Redirect::route('profile.edit')->with('status', 'Avatar updated successfully.');
    }

    /**
     * Remove user's avatar.
     */
    public function deleteAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->profile?->avatar_path) {
            Storage::disk('public')->delete($user->profile->avatar_path);
            $user->profile->update(['avatar_path' => null]);
        }

        return Redirect::route('profile.edit')->with('status', 'Avatar removed successfully.');
    }

    /**
     * Update user's signature.
     */
    public function updateSignature(Request $request): RedirectResponse
    {
        $request->validate([
            'signature' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:1024'],
        ]);

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

        return Redirect::route('profile.edit')->with('status', 'Signature updated successfully.');
    }

    /**
     * Remove user's signature.
     */
    public function deleteSignature(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->profile?->signature_path) {
            Storage::disk('public')->delete($user->profile->signature_path);
            $user->profile->update(['signature_path' => null]);
        }

        return Redirect::route('profile.edit')->with('status', 'Signature removed successfully.');
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

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return Redirect::route('profile.edit')->with('status', 'Password updated successfully.');
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

        return Redirect::to('/');
    }
}
