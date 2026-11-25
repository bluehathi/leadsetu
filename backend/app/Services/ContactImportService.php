<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Contact;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Facades\Excel;

class ContactImportService
{
    public const MAX_ROWS = 2000;

    /** Header aliases (headings are lower-cased with underscores by the reader). */
    private const ALIASES = [
        'name' => ['name', 'full_name', 'contact', 'contact_name'],
        'email' => ['email', 'e_mail', 'email_address'],
        'phone' => ['phone', 'mobile', 'telephone', 'phone_number'],
        'title' => ['title', 'job_title', 'position'],
        'notes' => ['notes', 'note'],
        'company' => ['company', 'company_name', 'organization', 'organisation'],
        'website' => ['website', 'websiteurl', 'website_url', 'url'],
    ];

    /**
     * Imports contacts (and the companies they mention) into the current workspace.
     * Valid rows are saved, invalid ones are reported. Existing companies are reused by name and
     * contacts whose email already exists are skipped, so re-uploading a file does not duplicate data.
     *
     * @return array{created:int, skipped:int, errors:list<array{row:int,message:string}>}
     */
    public function import(UploadedFile $file): array
    {
        $sheet = Excel::toArray(new class implements WithHeadingRow {}, $file)[0] ?? [];

        if (count($sheet) > self::MAX_ROWS) {
            return ['created' => 0, 'skipped' => 0, 'errors' => [['row' => 0, 'message' => 'The file has more than ' . self::MAX_ROWS . ' rows. Split it and try again.']]];
        }

        $result = ['created' => 0, 'skipped' => 0, 'errors' => []];
        $knownEmails = Contact::query()->whereNotNull('email')->pluck('email')->map(fn ($e) => mb_strtolower($e))->flip();
        $companies = Company::query()->get()->keyBy(fn ($c) => mb_strtolower($c->name));

        foreach ($sheet as $index => $raw) {
            $line = $index + 2; // header is line 1
            $row = $this->normalise($raw);

            if (collect($row)->filter()->isEmpty()) {
                continue; // blank line
            }

            $validator = Validator::make($row, [
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'title' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:5000',
                'company' => 'nullable|string|max:255',
                'website' => 'nullable|string|max:255',
            ]);
            if ($validator->fails()) {
                $result['errors'][] = ['row' => $line, 'message' => $validator->errors()->first()];
                continue;
            }

            $email = $row['email'] ? mb_strtolower($row['email']) : null;
            if ($email && $knownEmails->has($email)) {
                $result['skipped']++;
                continue;
            }

            DB::transaction(function () use ($row, $email, &$companies, &$knownEmails, &$result) {
                // Every contact belongs to a company; individuals without one get a company named after themselves.
                $companyName = $row['company'] ?: $row['name'];
                $key = mb_strtolower($companyName);
                $company = $companies[$key] ??= Company::create(['name' => $companyName, 'website' => $row['website']]);

                // workspace_id is assigned by BelongsToWorkspace.
                Contact::create([
                    'name' => $row['name'], 'email' => $row['email'], 'phone' => $row['phone'],
                    'title' => $row['title'], 'notes' => $row['notes'], 'company_id' => $company->id,
                ]);
                if ($email) {
                    $knownEmails[$email] = 0;
                }
                $result['created']++;
            });
        }

        return $result;
    }

    /** @return array<string, ?string> */
    private function normalise(array $raw): array
    {
        $row = [];
        foreach (self::ALIASES as $field => $aliases) {
            $value = null;
            foreach ($aliases as $alias) {
                if (isset($raw[$alias]) && trim((string) $raw[$alias]) !== '') {
                    $value = trim((string) $raw[$alias]);
                    break;
                }
            }
            $row[$field] = $value;
        }

        return $row;
    }
}
