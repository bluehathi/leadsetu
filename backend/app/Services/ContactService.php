<?php

namespace App\Services;

use App\Models\Contact;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class ContactService
{
    private const SORTABLE = ['name', 'email', 'created_at'];

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Contact::query()->with('company');

        if (filled($filters['search'] ?? null)) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)
                ->orWhere('email', 'like', $term)
                ->orWhere('phone', 'like', $term));
        }

        if (filled($filters['company_id'] ?? null)) {
            $query->where('company_id', $filters['company_id']);
        }

        $sort = $filters['sort'] ?? '-created_at';
        $column = ltrim($sort, '-');
        $query->orderBy(in_array($column, self::SORTABLE, true) ? $column : 'created_at', str_starts_with($sort, '-') ? 'desc' : 'asc');

        return $query->paginate(min(max($perPage, 1), 100));
    }

    /** workspace_id is assigned by the BelongsToWorkspace trait, never from input. */
    public function createContact(array $data): Contact
    {
        return Contact::create($data);
    }

    public function updateContact(Contact $contact, array $data): Contact
    {
        $contact->update($data);

        return $contact;
    }

    public function deleteContact(Contact $contact): void
    {
        $contact->delete();
    }

    /**
     * Sends one email to a contact through the workspace's SMTP settings and logs it.
     * Unsubscribed contacts are refused so manual mail cannot bypass their opt-out.
     */
    public function sendEmail(Contact $contact, array $data): \App\Models\EmailLog
    {
        if ($contact->unsubscribed_at !== null) {
            throw \Illuminate\Validation\ValidationException::withMessages(['contact' => ['This contact has unsubscribed and cannot be emailed.']]);
        }
        if (blank($contact->email)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['contact' => ['This contact has no email address.']]);
        }
        $smtp = \App\Models\MailConfiguration::query()->where('driver', 'smtp')->first();
        if (! $smtp || blank($smtp->host)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['contact' => ['Configure your SMTP settings before sending email.']]);
        }

        $body = trim(\App\Support\HtmlSanitizer::clean($data['body']));
        if ($body === '') {
            throw \Illuminate\Validation\ValidationException::withMessages(['body' => ['The email body is empty after removing unsafe content.']]);
        }

        try {
            return app(EmailDispatchService::class)->sendAndLog(Auth::user(), $contact, ['subject' => $data['subject'], 'body' => $body], $smtp);
        } catch (\Throwable $e) {
            throw \Illuminate\Validation\ValidationException::withMessages(['contact' => ['The email could not be sent: ' . mb_substr($e->getMessage(), 0, 200)]]);
        }
    }
}
