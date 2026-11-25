<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\EmailCampaign\ScheduleEmailCampaignRequest;
use App\Http\Requests\EmailCampaign\StoreEmailCampaignRequest;
use App\Http\Requests\EmailCampaign\UpdateEmailCampaignRequest;
use App\Http\Resources\EmailCampaignResource;
use App\Http\Resources\EmailLogResource;
use App\Models\EmailCampaign;
use App\Services\ActivityLogService;
use App\Services\EmailCampaignService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class EmailCampaignController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected EmailCampaignService $campaigns, protected ActivityLogService $audit)
    {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(EmailCampaign::class, 'email_campaign');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $page = $this->campaigns->paginate($request->only(['search', 'status']), (int) $request->integer('per_page', 15));

        return EmailCampaignResource::collection($page);
    }

    public function store(StoreEmailCampaignRequest $request): JsonResponse
    {
        $campaign = $this->campaigns->createEmailCampaign($request->validated());
        $this->audit->log('email_campaign_created', $campaign, 'Email campaign created', ['name' => $campaign->name]);

        return (new EmailCampaignResource($campaign->load('prospectLists')))->response()->setStatusCode(201);
    }

    public function show(EmailCampaign $emailCampaign): EmailCampaignResource
    {
        return EmailCampaignResource::withStats($emailCampaign->load('prospectLists'), $this->campaigns->stats($emailCampaign));
    }

    public function update(UpdateEmailCampaignRequest $request, EmailCampaign $emailCampaign): EmailCampaignResource
    {
        $campaign = $this->campaigns->updateEmailCampaign($emailCampaign, $request->validated());
        $this->audit->log('email_campaign_updated', $campaign, 'Email campaign updated', ['fields' => array_keys($request->validated())]);

        return new EmailCampaignResource($campaign->load('prospectLists'));
    }

    public function destroy(EmailCampaign $emailCampaign): JsonResponse
    {
        $this->campaigns->deleteEmailCampaign($emailCampaign);
        $this->audit->log('email_campaign_deleted', $emailCampaign, 'Email campaign deleted', ['name' => $emailCampaign->name]);

        return response()->json(null, 204);
    }

    public function send(EmailCampaign $emailCampaign): EmailCampaignResource
    {
        $this->authorize('send', $emailCampaign);
        $campaign = $this->campaigns->send($emailCampaign);
        $this->audit->log('email_campaign_queued', $campaign, 'Email campaign queued for sending');

        return new EmailCampaignResource($campaign->load('prospectLists'));
    }

    public function schedule(ScheduleEmailCampaignRequest $request, EmailCampaign $emailCampaign): EmailCampaignResource
    {
        $campaign = $this->campaigns->schedule($emailCampaign, Carbon::parse($request->validated('scheduled_at')));
        $this->audit->log('email_campaign_scheduled', $campaign, 'Email campaign scheduled', ['at' => $campaign->scheduled_at]);

        return new EmailCampaignResource($campaign->load('prospectLists'));
    }

    public function cancel(EmailCampaign $emailCampaign): EmailCampaignResource
    {
        $this->authorize('send', $emailCampaign);
        $campaign = $this->campaigns->cancelSchedule($emailCampaign);
        $this->audit->log('email_campaign_unscheduled', $campaign, 'Email campaign schedule cancelled');

        return new EmailCampaignResource($campaign->load('prospectLists'));
    }

    public function deliveries(Request $request, EmailCampaign $emailCampaign): AnonymousResourceCollection
    {
        $this->authorize('view', $emailCampaign);

        return EmailLogResource::collection(
            $this->campaigns->deliveries($emailCampaign, $request->only('status'), (int) $request->integer('per_page', 25))
        );
    }
}
