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

        // Map columns: support both 'company' and 'websiteUrl', 'mobile' as phone
        $contactName = $row['name'] ?? null;
        $companyName = $row['name'] ?? null;
        $companyWebsite = $row['websiteurl'] ?? null; // Excel columns are lowercased by WithHeadingRow
        $email = $row['email'] ?? null;
        $phone = $row['mobile'] ?? ($row['phone'] ?? null);
        $notes = $row['notes'] ?? null;
        $title = $row['title'] ?? null;

        // Validate: name required only
        if (empty($contactName)) {
            Log::warning('Skipped row: missing name', $row);
            return;
        }

        // Always create a new company (no duplicate check)
        $company = null;
        if (!empty($companyName)) {
            $company = new Company();
            $company->name = $companyName;
            $company->workspace_id = $workspaceId;
            $company->website = $companyWebsite;
            $company->save();
        }

        // Always create a new contact (no duplicate check)
        $contact = new Contact();
        $contact->workspace_id = $workspaceId;
        $contact->name = $contactName;
        $contact->email = $email;
        $contact->phone = $phone;
        $contact->title = $title;
        $contact->notes = $notes;
        if ($company) {
            $contact->company_id = $company->id;
        }
        $contact->save();
    }
}
