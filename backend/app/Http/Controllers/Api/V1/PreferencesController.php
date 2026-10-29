<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** The signed-in user's own UI preferences (column choices, filters, ...). Acts on the caller only. */
class PreferencesController extends Controller
{
    private const MAX_BYTES = 8192;

    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->settings ?? (object) []]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => 'required|array|max:50',
            'settings.*' => 'nullable',
        ]);

        foreach (array_keys($data['settings']) as $key) {
            if (! preg_match('/^[a-z][a-z0-9_]{0,63}$/', (string) $key)) {
                throw ValidationException::withMessages(['settings' => ["Invalid setting key: $key"]]);
            }
        }

        $merged = array_merge($request->user()->settings ?? [], $data['settings']);
        if (strlen(json_encode($merged)) > self::MAX_BYTES) {
            throw ValidationException::withMessages(['settings' => ['Settings are too large.']]);
        }

        $request->user()->forceFill(['settings' => $merged])->save();

        return response()->json(['data' => $merged]);
    }
}
