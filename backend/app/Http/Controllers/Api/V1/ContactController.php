<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Contact\ImportContactsRequest;
use App\Http\Requests\Contact\SendContactEmailRequest;
use App\Http\Requests\Contact\StoreContactRequest;
use App\Http\Requests\Contact\UpdateContactRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\EmailLogResource;
use App\Models\Contact;
use App\Services\ActivityLogService;
use App\Services\ContactImportService;
use App\Services\ContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class ContactController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected ContactService $contacts, protected ActivityLogService $audit)
    {
    }

    /** index/show/store/update/destroy -> ContactPolicy viewAny/view/create/update/delete. */
    public static function middleware(): array
    {
        return static::resourcePolicy(Contact::class, 'contact');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $contacts = $this->contacts->paginate(
            $request->only(['search', 'company_id', 'sort']),
            (int) $request->integer('per_page', 15),
        );

        return ContactResource::collection($contacts);
    }

    public function store(StoreContactRequest $request): JsonResponse
    {
        $contact = $this->contacts->createContact($request->validated());

        return (new ContactResource($contact->load('company')))->response()->setStatusCode(201);
    }

    public function show(Contact $contact): ContactResource
    {
        return new ContactResource($contact->load('company'));
    }

    public function update(UpdateContactRequest $request, Contact $contact): ContactResource
    {
        return new ContactResource(
            $this->contacts->updateContact($contact, $request->validated())->load('company')
        );
    }

    public function destroy(Contact $contact): JsonResponse
    {
        $this->contacts->deleteContact($contact);

        return response()->json(null, 204);
    }

    /** CSV/XLSX upload; returns how many rows were created, skipped as duplicates, or rejected. */
    public function import(ImportContactsRequest $request, ContactImportService $importer): JsonResponse
    {
        $result = $importer->import($request->file('file'));
        $this->audit->log('contacts_imported', null, 'Contacts imported', ['created' => $result['created'], 'skipped' => $result['skipped'], 'errors' => count($result['errors'])]);

        return response()->json(['data' => $result]);
    }

    public function sendEmail(SendContactEmailRequest $request, Contact $contact): JsonResponse
    {
        $log = $this->contacts->sendEmail($contact, $request->validated());
        $this->audit->log('contact_emailed', $contact, 'Email sent to contact', ['subject' => $request->validated('subject')]);

        return (new EmailLogResource($log))->response()->setStatusCode(201);
    }
}
