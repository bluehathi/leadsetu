<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProspectList;
use App\Services\ProspectListService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProspectListController extends Controller
{
    protected $prospectListService;

    public function __construct(ProspectListService $prospectListService)
    {
        $this->prospectListService = $prospectListService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('view_prospect_lists');
        return ProspectList::all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('create_prospect_lists');
        $prospectList = $this->prospectListService->createProspectList($request->all());
        return response()->json($prospectList, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ProspectList $prospectList)
    {
        Gate::authorize('view_prospect_lists');
        return $prospectList;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProspectList $prospectList)
    {
        Gate::authorize('edit_prospect_lists');
        $prospectList = $this->prospectListService->updateProspectList($prospectList, $request->all());
        return response()->json($prospectList);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProspectList $prospectList)
    {
        Gate::authorize('delete_prospect_lists');
        $this->prospectListService->deleteProspectList($prospectList);
        return response()->json(null, 204);
    }
}
