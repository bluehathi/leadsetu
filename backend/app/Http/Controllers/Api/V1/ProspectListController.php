<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProspectList\ManageContactsInListRequest;
use App\Http\Requests\ProspectList\StoreProspectListRequest;
use App\Http\Requests\ProspectList\UpdateProspectListRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\ProspectListResource;
use App\Models\ProspectList;
use App\Services\ActivityLogService;
use App\Services\ProspectListService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class ProspectListController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected ProspectListService $lists, protected ActivityLogService $audit)
    {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(ProspectList::class, 'prospect_list');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return ProspectListResource::collection(
            $this->lists->paginate($request->only('search'), (int) $request->integer('per_page', 15))
        );
    }

    public function store(StoreProspectListRequest $request): JsonResponse
    {
        $list = $this->lists->createProspectList($request->validated());
        $this->audit->log('prospect_list_created', $list, 'Prospect list created', ['name' => $list->name]);

        return (new ProspectListResource($list->loadCount('contacts')))->response()->setStatusCode(201);
    }

    public function show(ProspectList $prospectList): ProspectListResource
    {
        return new ProspectListResource($prospectList->loadCount('contacts'));
    }

    public function update(UpdateProspectListRequest $request, ProspectList $prospectList): ProspectListResource
    {
        $list = $this->lists->updateProspectList($prospectList, $request->validated());
        $this->audit->log('prospect_list_updated', $list, 'Prospect list updated', ['fields' => array_keys($request->validated())]);

        return new ProspectListResource($list->loadCount('contacts'));
    }

    public function destroy(ProspectList $prospectList): JsonResponse
    {
        $this->lists->deleteProspectList($prospectList);
        $this->audit->log('prospect_list_deleted', $prospectList, 'Prospect list deleted', ['name' => $prospectList->name]);

        return response()->json(null, 204);
    }

    public function contacts(Request $request, ProspectList $prospectList): AnonymousResourceCollection
    {
        $this->authorize('view', $prospectList);

        return ContactResource::collection(
            $this->lists->members($prospectList, $request->only('search'), (int) $request->integer('per_page', 15))
        );
    }

    public function addContacts(ManageContactsInListRequest $request, ProspectList $prospectList): ProspectListResource
    {
        $this->lists->addContacts($prospectList, $request->validated('contact_ids'));
        $this->audit->log('prospect_list_contacts_added', $prospectList, 'Contacts added to list', ['contact_ids' => $request->validated('contact_ids')]);

        return new ProspectListResource($prospectList->loadCount('contacts'));
    }

    public function removeContacts(ManageContactsInListRequest $request, ProspectList $prospectList): ProspectListResource
    {
        $this->lists->removeContacts($prospectList, $request->validated('contact_ids'));
        $this->audit->log('prospect_list_contacts_removed', $prospectList, 'Contacts removed from list', ['contact_ids' => $request->validated('contact_ids')]);

        return new ProspectListResource($prospectList->loadCount('contacts'));
    }
}
