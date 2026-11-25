<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Http\Requests\Lead\UpdateLeadStatusRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use App\Services\ActivityLogService;
use App\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class LeadController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected LeadService $leads, protected ActivityLogService $audit)
    {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(Lead::class, 'lead');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return LeadResource::collection($this->leads->paginate(
            $request->only(['search', 'status', 'source', 'priority', 'qualification', 'mine', 'sort']),
            (int) $request->integer('per_page', 15),
        ));
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = $this->leads->createLead($request->validated());
        $this->audit->log('lead_created', $lead, 'Lead created', ['name' => $lead->name]);

        return (new LeadResource($lead->load(['company', 'contact'])))->response()->setStatusCode(201);
    }

    public function show(Lead $lead): LeadResource
    {
        return new LeadResource($lead->load(['company', 'contact']));
    }

    public function update(UpdateLeadRequest $request, Lead $lead): LeadResource
    {
        $lead = $this->leads->updateLead($lead, $request->validated());
        $this->audit->log('lead_updated', $lead, 'Lead updated', ['fields' => array_keys($request->validated())]);

        return new LeadResource($lead->load(['company', 'contact']));
    }

    /** Used by the board view when a card moves between columns. */
    public function updateStatus(UpdateLeadStatusRequest $request, Lead $lead): LeadResource
    {
        $old = $lead->status;
        $lead = $this->leads->updateStatus($lead, $request->validated('status'));
        $this->audit->log('lead_status_changed', $lead, "Lead status {$old} -> {$lead->status}");

        return new LeadResource($lead);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $this->leads->deleteLead($lead);
        $this->audit->log('lead_deleted', $lead, 'Lead deleted', ['name' => $lead->name]);

        return response()->json(null, 204);
    }
}
