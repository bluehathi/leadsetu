<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\SaveItemRequest;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class ItemController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    private const SORTABLE = ['name', 'price_minor', 'created_at'];

    public function __construct(protected ActivityLogService $audit)
    {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(Item::class, 'item');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $sort = $request->input('sort', 'name');
        $column = ltrim($sort, '-');

        $items = Item::query()->with('taxRate')
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', '%' . $request->input('search') . '%')
                ->orWhere('sku', 'like', '%' . $request->input('search') . '%')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->input('type')))
            ->when($request->boolean('active_only'), fn ($q) => $q->where('active', true))
            ->orderBy(in_array($column, self::SORTABLE, true) ? $column : 'name', str_starts_with($sort, '-') ? 'desc' : 'asc')
            ->paginate(min(max((int) $request->integer('per_page', 15), 1), 100));

        return ItemResource::collection($items);
    }

    public function store(SaveItemRequest $request): JsonResponse
    {
        $item = Item::create($request->validated() + ['unit' => 'nos']);
        $this->audit->log('item_created', $item, 'Item created', ['name' => $item->name]);

        return (new ItemResource($item->load('taxRate')))->response()->setStatusCode(201);
    }

    public function show(Item $item): ItemResource
    {
        return new ItemResource($item->load('taxRate'));
    }

    public function update(SaveItemRequest $request, Item $item): ItemResource
    {
        $item->update($request->validated());
        $this->audit->log('item_updated', $item, 'Item updated', ['fields' => array_keys($request->validated())]);

        return new ItemResource($item->load('taxRate'));
    }

    /** Documents keep their own copy of the description and price, so deleting an item never changes them. */
    public function destroy(Item $item): JsonResponse
    {
        $item->delete();
        $this->audit->log('item_deleted', $item, 'Item deleted', ['name' => $item->name]);

        return response()->json(null, 204);
    }
}
