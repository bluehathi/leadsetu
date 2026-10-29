<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Lead;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LeadService
{
    private const SORTABLE = ['name', 'created_at', 'score', 'deal_value', 'expected_close', 'status'];
    private const EXACT_FILTERS = ['status', 'source', 'priority', 'qualification'];

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Lead::query()->with(['company', 'contact']);

        if (filled($filters['search'] ?? null)) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)
                ->orWhere('email', 'like', $term)
                ->orWhere('company', 'like', $term));
        }

        foreach (self::EXACT_FILTERS as $column) {
            if (filled($filters[$column] ?? null)) {
                $query->where($column, $filters[$column]);
            }
        }

        if (filter_var($filters['mine'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->where('user_id', Auth::id());
        }

        $sort = $filters['sort'] ?? '-created_at';
        $column = ltrim($sort, '-');
        $query->orderBy(in_array($column, self::SORTABLE, true) ? $column : 'created_at', str_starts_with($sort, '-') ? 'desc' : 'asc');

        return $query->paginate(min(max($perPage, 1), 100));
    }

    /** workspace_id comes from the BelongsToWorkspace trait; the creator is the signed-in user. */
    public function createLead(array $data): Lead
    {
        return DB::transaction(function () use ($data) {
            $lead = new Lead($this->withDefaults($data));
            $lead->user_id = Auth::id();
            $lead->save();
            $lead->calculateScoreAndQualification();

            return $lead;
        });
    }

    public function updateLead(Lead $lead, array $data): Lead
    {
        return DB::transaction(function () use ($lead, $data) {
            $lead->update($data);
            $lead->calculateScoreAndQualification();

            return $lead;
        });
    }

    public function updateStatus(Lead $lead, string $status): Lead
    {
        $lead->status = $status;
        $lead->calculateScoreAndQualification();

        return $lead;
    }

    public function deleteLead(Lead $lead): void
    {
        $lead->delete();
    }

    /** The leads table has NOT NULL text columns; fill sensible defaults for blanks. */
    private function withDefaults(array $data): array
    {
        $company = $data['company'] ?? null;
        if (blank($company) && ! empty($data['company_id'])) {
            $company = Company::find($data['company_id'])?->name;
        }

        $defaults = ['status' => 'new', 'source' => 'other', 'notes' => '', 'company' => $company ?? ''];
        foreach ($defaults as $key => $value) {
            if (blank($data[$key] ?? null)) {
                $data[$key] = $value;
            }
        }

        return $data;
    }
}
