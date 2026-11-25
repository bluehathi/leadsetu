<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Company\StoreCompanyRequest;
use App\Http\Requests\Company\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Services\CompanyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class CompanyController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected CompanyService $companies)
    {
    }

    /** index/show/store/update/destroy -> CompanyPolicy viewAny/view/create/update/delete. */
    public static function middleware(): array
    {
        return static::resourcePolicy(Company::class, 'company');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $companies = $this->companies->paginate(
            $request->only(['search', 'sort']),
            (int) $request->integer('per_page', 15),
        );

        return CompanyResource::collection($companies);
    }

    public function store(StoreCompanyRequest $request): JsonResponse
    {
        $company = $this->companies->createCompany($request->validated());

        return (new CompanyResource($company))->response()->setStatusCode(201);
    }

    public function show(Company $company): CompanyResource
    {
        return new CompanyResource($company);
    }

    public function update(UpdateCompanyRequest $request, Company $company): CompanyResource
    {
        return new CompanyResource(
            $this->companies->updateCompany($company, $request->validated())
        );
    }

    public function destroy(Company $company): JsonResponse
    {
        $this->companies->deleteCompany($company);

        return response()->json(null, 204);
    }
}
