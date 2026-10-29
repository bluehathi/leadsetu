<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\EmailCampaign;
use App\Models\EmailLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

/**
 * Sends one campaign. Must run inside a tenant context (HTTP request or
 * WorkspaceContext::run in a queue job) so contact/list queries stay in one workspace.
 */
class CampaignSender
{
    public function __construct(protected EmailDispatchService $dispatcher)
    {
    }

    /** Deliverable recipients: members of the campaign's lists, deduplicated, with an address and not unsubscribed. */
    public function recipientsQuery(EmailCampaign $campaign): Builder
    {
        $memberIds = DB::table('contact_prospect_list')
            ->whereIn('prospect_list_id', $campaign->prospectLists()->select('prospect_lists.id'))
            ->select('contact_id');

        return Contact::query()->subscribed()->whereIn('id', $memberIds);
    }

    /** @return array{sent:int, failed:int, skipped:int} */
    public function send(EmailCampaign $campaign): array
    {
        $user = $campaign->user;
        $result = ['sent' => 0, 'failed' => 0, 'skipped' => 0];

        // Re-running a campaign (retry, double dispatch) never mails the same contact twice.
        $alreadySent = EmailLog::where('campaign_id', $campaign->id)
            ->whereIn('status', ['sent', 'delivered', 'opened', 'clicked'])
            ->pluck('contact_id')->flip();

        $this->recipientsQuery($campaign)->chunkById(100, function ($contacts) use ($campaign, $user, $alreadySent, &$result) {
            foreach ($contacts as $contact) {
                if ($alreadySent->has($contact->id)) {
                    $result['skipped']++;
                    continue;
                }

                try {
                    $log = $this->dispatcher->sendAndLog($user, $contact, [
                        'subject' => $campaign->subject,
                        'body' => $campaign->body . $this->footer($contact),
                        'campaign_id' => $campaign->id,
                    ]);
                    $log->status === 'failed' ? $result['failed']++ : $result['sent']++;
                } catch (\Throwable $e) {
                    $result['failed']++;
                    Log::warning("Campaign {$campaign->id}: send to contact {$contact->id} failed: " . $e->getMessage());
                }
            }
        });

        return $result;
    }

    private function footer(Contact $contact): string
    {
        $url = URL::signedRoute('contacts.unsubscribe', ['contact' => $contact->id]);

        return '<p style="font-size:12px;color:#666;margin-top:24px"><a href="' . e($url) . '">Unsubscribe</a></p>';
    }
}
