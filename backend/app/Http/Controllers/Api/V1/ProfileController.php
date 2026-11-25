<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\ActivityLogService;
use App\Services\RegistrationService;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;

/** The signed-in user managing their own account. Acts on the caller only. */
class ProfileController extends Controller
{
    public function update(Request $request, RegistrationService $registration, ActivityLogService $audit): UserResource
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->fill($data);
        $emailChanged = $user->isDirty('email');
        if ($emailChanged) {
            $user->email_verified_at = null;
        }
        $user->save();

        if ($emailChanged) {
            $registration->sendVerification($user);
        }
        $audit->log('profile_updated', $user, 'Profile updated', ['fields' => array_keys($data)]);

        return new UserResource($user->load('workspace', 'roles'));
    }

    public function password(Request $request, SessionService $sessions, ActivityLogService $audit): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', 'different:current_password', Password::defaults()],
        ]);

        $user = $request->user();
        // Checked against the authenticated user directly (works for session and token auth alike).
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => [__('validation.current_password')]]);
        }

        $user->forceFill(['password' => $data['password']])->save();
        $sessions->revokeOthers($user, $request->hasSession() ? $request->session()->getId() : null);
        $audit->log('password_changed', $user, 'Password changed');

        return response()->json(['message' => 'Password updated.']);
    }
}
