<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\ActivityLog;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $usersQuery = User::with('workspace', 'roles')
            ->where('workspace_id', Auth::user()->workspace_id);
        if ($search) {
            $usersQuery->where(function($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%")
                  ->orWhereHas('roles', function($qr) use ($search) {
                      $qr->where('name', 'like', "%$search%") ;
                  });
            });
        }
        $users = $usersQuery->get();
        return Inertia::render('Users/Index', [
            'users' => $users,
            'user' => Auth::user(),
            'search' => $search,
        ]);
    }

    public function create()
    {
        $roles = Role::all();
        return Inertia::render('Users/Create', [
            'roles' => $roles,
             'user' => Auth::user()
        ]);
    }

    protected function logActivity($action, $subject = null, $description = null, $properties = [])
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user() ? Auth::user()->workspace_id : null,
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject->id ?? null,
            'description' => $description,
            'properties' => $properties,
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'workspace_id' => Auth::user()->workspace_id ?? null,
        ]);
        if (!empty($data['roles'])) {
            $user->syncRoles($data['roles']);
        }
        $this->logActivity('user_created', $user, 'User created', ['data' => $data]);
        return redirect()->route('users.index')->with('success', 'User created.');
    }

    public function edit(User $user)
    {
        $roles = Role::all();
        $user->load('roles');
        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'loginuser' => Auth::user()
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'workspace_id' => Auth::user()->workspace_id ?? null,
        ]);
        if (!empty($data['password'])) {
            $user->update(['password' => bcrypt($data['password'])]);
        }
        $user->syncRoles($data['roles'] ?? []);
        $this->logActivity('user_updated', $user, 'User updated', ['data' => $data]);
        return redirect()->route('users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        $user->delete();
        $this->logActivity('user_deleted', $user, 'User deleted');
        return redirect()->route('users.index')->with('success', 'User deleted.');
    }

    // User profile view
    public function profile()
    {
        $user = Auth::user();
        return Inertia::render('Profile/Index', [
            'user' => $user,
        ]);
    }

    // Update user profile info
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);
        $user->update($data);
        $this->logActivity('profile_updated', $user, 'Profile updated', ['data' => $data]);
        return back()->with('success', 'Profile updated successfully.');
    }

    // Change user password
    public function changePassword(Request $request)
    {
        $user = Auth::user();
        $data = $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:6|confirmed',
        ]);
        if (!Hash::check($data['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'Current password is incorrect.']);
        }
        $user->update(['password' => Hash::make($data['password'])]);
        $this->logActivity('password_changed', $user, 'Password changed');
        return back()->with('success', 'Password changed successfully.');
    }

    public function activityLogs(Request $request)
    {
        $query = ActivityLog::with('user');

        // Filters
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        if ($request->filled('entity')) {
            $query->where('subject_type', $request->entity);
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $logs = $query->latest()->paginate(20)->appends($request->all());

        // For filter dropdowns
        $users = User::select('id', 'name')->orderBy('name')->get();
        $actions = ActivityLog::select('action')->distinct()->pluck('action');
        $entities = ActivityLog::select('subject_type')->distinct()->pluck('subject_type');

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'filters' => [
                'user_id' => $request->user_id,
                'action' => $request->action,
                'entity' => $request->entity,
                'date' => $request->date,
            ],
            'users' => $users,
            'actions' => $actions,
            'entities' => $entities,
            'user' => Auth::user(),
        ]);
    }

    // Get current user's settings
    public function getSettings(Request $request)
    {
        $user = Auth::user();
        $settings = $user->settings ?? [];

        // Set default if not present
        if (!isset($settings['leads_table_columns'])) {
            $settings['leads_table_columns'] = [
                'title', 'positions', 'tags', 'company', 'status', 'score', 'qualification', 'added_on'
            ];
            $user->settings = $settings;
            $user->save();
        }

        return response()->json([
            'settings' => $settings,
            
        ]);
    }

    // Update current user's settings (merge with existing)
    public function setSettings(Request $request)
    {
        $user = Auth::user();
        $data = $request->validate([
            'settings' => 'required|array',
        ]);
        $user->settings = array_merge($user->settings ?? [], $data['settings']);
        $user->save();
        return response()->json([
            'success' => true,
            'settings' => $user->settings,
        ]);
    }

    public function workspaceSettings()
    {
        $user = Auth::user();
        $workspace = $user->workspace;
        $isOwner = $workspace && $workspace->owners()->where('user_id', $user->id)->exists();
        if (!$isOwner || !$user->can('workspace_owner')) {
            abort(403, 'You are not allowed to manage this workspace.');
        }
        return Inertia::render('Workspaces/Settings', [
            'workspace' => $workspace,
        ]);
    }

    public function updateWorkspaceSettings(Request $request)
    {
        $user = Auth::user();
        $workspace = $user->workspace;
        $isOwner = $workspace && $workspace->owners()->where('user_id', $user->id)->exists();
        if (!$isOwner || !$user->can('workspace_owner')) {
            abort(403, 'You are not allowed to manage this workspace.');
        }
        $data = $request->validate([
            'name' => 'required|string|max:180',
            'description' => 'nullable|string',
        ]);
        $workspace->update($data);
        return redirect()->route('workspace.settings')->with('success', 'Workspace updated.');
    }
}
