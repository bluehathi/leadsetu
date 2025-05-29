<?php

namespace App\Imports;

use App\Models\Contact;
use App\Models\Company;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Row;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ContactCompanyImport implements OnEachRow, WithHeadingRow
{
    public function onRow(Row $row)
    {
        $row = $row->toArray();
        $workspaceId = Auth::user()->workspace_id;

        // Validate: name required, at least one of email/phone
        if (empty($row['name']) || (empty($row['email']) && empty($row['phone']))) {
            // Optionally log or collect errors
            Log::warning('Skipped row: missing name or both email/phone', $row);
            return;
        }

        // Find or create company
        $company = null;
        if (!empty($row['company'])) {
            $company = Company::firstOrCreate([
                'name' => $row['company'],
                'workspace_id' => $workspaceId,
            ]);
        }

        // Find or create contact (by email or phone)
        $contact = Contact::where('workspace_id', $workspaceId)
            ->where(function($q) use ($row) {
                if (!empty($row['email'])) $q->orWhere('email', $row['email']);
                if (!empty($row['phone'])) $q->orWhere('phone', $row['phone']);
            })
            ->first();

        if (!$contact) {
            $contact = new Contact();
            $contact->workspace_id = $workspaceId;
        }

        $contact->name = $row['name'];
        $contact->email = $row['email'] ?? null;
        $contact->phone = $row['phone'] ?? null;
        $contact->title = $row['title'] ?? null;
        $contact->notes = $row['notes'] ?? null;
        if ($company) {
            $contact->company_id = $company->id;
        }
        $contact->save();
    }
}
