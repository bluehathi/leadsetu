<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Contact;
use App\Models\GoogleDriveConnection;
use App\Models\GoogleDriveFile;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\SocialAccount;
use App\Models\SocialBrand;
use App\Models\SocialContent;
use App\Models\SocialVideoAnalytic;
use App\Models\Workspace;
use App\Support\WorkspaceContext;
use InvalidArgumentException;

class McpServerService
{
    public function __construct(
        protected SocialOAuthSyncService $socialSync,
        protected GoogleDriveService $driveService,
        protected SocialGrowthService $growthService,
        protected ActivityLogService $audit,
    ) {
    }

    /**
     * MCP tool definitions exposed to authenticated AI agents based on token scopes.
     */
    public function tools(array $scopes = ['readonly']): array
    {
        $tools = [
            [
                'name' => 'get_workspace_summary',
                'description' => 'Get read-only summary counts for the LeadSetu workspace (leads, contacts, companies, invoices, social channels, planned content, and cached Drive files).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => (object) [],
                ],
            ],
            [
                'name' => 'list_leads',
                'description' => 'List CRM leads in the workspace (read-only).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'status' => ['type' => 'string', 'description' => 'Filter by status (new, contacted, qualified, unqualified, lost, won)'],
                        'search' => ['type' => 'string', 'description' => 'Search by name, email, or company'],
                        'limit' => ['type' => 'integer', 'description' => 'Max rows to return (1-100, default 25)'],
                    ],
                ],
            ],
            [
                'name' => 'list_contacts',
                'description' => 'List CRM contacts in the workspace (read-only).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'search' => ['type' => 'string', 'description' => 'Search by name or email'],
                        'limit' => ['type' => 'integer', 'description' => 'Max rows to return (1-100, default 25)'],
                    ],
                ],
            ],
            [
                'name' => 'list_companies',
                'description' => 'List companies/customers in the workspace (read-only).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'search' => ['type' => 'string', 'description' => 'Search by company name'],
                        'limit' => ['type' => 'integer', 'description' => 'Max rows to return (1-100, default 25)'],
                    ],
                ],
            ],
            [
                'name' => 'list_invoices',
                'description' => 'List billing invoices in the workspace (read-only).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'status' => ['type' => 'string', 'description' => 'Filter by invoice status'],
                        'limit' => ['type' => 'integer', 'description' => 'Max rows to return (1-100, default 25)'],
                    ],
                ],
            ],
            [
                'name' => 'list_social_brands',
                'description' => 'List Social Brands that group YouTube, Instagram, and Facebook channels together (e.g. Krishna Motivation).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => (object) [],
                ],
            ],
            [
                'name' => 'get_brand_analytics',
                'description' => 'Get combined DB-cached analytics for a Social Brand across its YouTube, Instagram, and Facebook channels.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'brand_id' => ['type' => 'integer', 'description' => 'SocialBrand ID from list_social_brands'],
                    ],
                    'required' => ['brand_id'],
                ],
            ],
            [
                'name' => 'list_social_accounts',
                'description' => 'List connected YouTube and Instagram accounts with summary metrics (read-only).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'platform' => ['type' => 'string', 'description' => 'Optional filter: youtube or instagram'],
                    ],
                ],
            ],
            [
                'name' => 'get_channel_analytics',
                'description' => 'Get cached DB channel analytics (subscribers, views, 28-day watch time, traffic sources, recent uploads) for a social account.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'account_id' => ['type' => 'integer', 'description' => 'SocialAccount ID from list_social_accounts'],
                    ],
                    'required' => ['account_id'],
                ],
            ],
            [
                'name' => 'get_video_analytics',
                'description' => 'Get cached DB per-video analytics (views, likes, comments, SEO score, tags, 28-day trends) for a YouTube video.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'account_id' => ['type' => 'integer', 'description' => 'SocialAccount ID'],
                        'video_id' => ['type' => 'string', 'description' => 'YouTube video ID'],
                    ],
                    'required' => ['account_id', 'video_id'],
                ],
            ],
            [
                'name' => 'list_content_planner',
                'description' => 'List Growth Studio Content Planner items (ideas, drafts, scheduled, published) with SEO scores and Drive attachments.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'status' => ['type' => 'string', 'description' => 'Filter by stage: idea, draft, scheduled, published'],
                        'limit' => ['type' => 'integer', 'description' => 'Max rows to return (1-100, default 25)'],
                    ],
                ],
            ],
            [
                'name' => 'list_drive_files',
                'description' => 'List cached Google Drive folder and file metadata (read-only; respects folder lock if enabled).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'folder_id' => ['type' => 'string', 'description' => 'Optional Google Drive folder ID'],
                        'search' => ['type' => 'string', 'description' => 'Optional filename search'],
                    ],
                ],
            ],
        ];

        if (in_array('content:write', $scopes, true)) {
            $tools = array_merge($tools, [
                [
                    'name' => 'create_content_plan',
                    'description' => 'Create a new Content Planner item (idea, draft, or scheduled) with automatic SEO scoring and optional Google Drive video/thumbnail attachment.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'social_account_id' => ['type' => 'integer', 'description' => 'Target SocialAccount ID'],
                            'title' => ['type' => 'string', 'description' => 'Video or post title'],
                            'content_type' => ['type' => 'string', 'description' => 'video, short, reel, carousel, or post (default: video)'],
                            'target_keyword' => ['type' => 'string', 'description' => 'Primary SEO target keyword'],
                            'hook' => ['type' => 'string', 'description' => 'Opening hook (first 3-15 sec)'],
                            'description' => ['type' => 'string', 'description' => 'Video description or caption'],
                            'first_comment' => ['type' => 'string', 'description' => 'Optional first comment to post automatically on publish'],
                            'pin_first_comment' => ['type' => 'boolean', 'description' => 'Whether to mark the first comment as pinned (default true)'],
                            'tags' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'List of tags'],
                            'hashtags' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'List of hashtags'],
                            'status' => ['type' => 'string', 'description' => 'idea, draft, or scheduled (default: draft)'],
                            'scheduled_at' => ['type' => 'string', 'description' => 'Optional ISO 8601 schedule datetime'],
                            'drive_file_id' => ['type' => 'string', 'description' => 'Optional Google Drive video file ID from list_drive_files'],
                            'drive_thumbnail_file_id' => ['type' => 'string', 'description' => 'Optional Google Drive thumbnail image file ID'],
                        ],
                        'required' => ['social_account_id', 'title'],
                    ],
                ],
                [
                    'name' => 'update_content_plan',
                    'description' => 'Update an existing Content Planner item (title, description, tags, status, schedule, or Google Drive attachments) and re-compute SEO score.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'content_id' => ['type' => 'integer', 'description' => 'SocialContent ID from list_content_planner'],
                            'title' => ['type' => 'string'],
                            'content_type' => ['type' => 'string'],
                            'target_keyword' => ['type' => 'string'],
                            'hook' => ['type' => 'string'],
                            'description' => ['type' => 'string'],
                            'first_comment' => ['type' => 'string'],
                            'pin_first_comment' => ['type' => 'boolean'],
                            'tags' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'hashtags' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'status' => ['type' => 'string', 'description' => 'idea, draft, or scheduled'],
                            'scheduled_at' => ['type' => 'string'],
                            'drive_file_id' => ['type' => 'string'],
                            'drive_thumbnail_file_id' => ['type' => 'string'],
                        ],
                        'required' => ['content_id'],
                    ],
                ],
                [
                    'name' => 'delete_content_plan',
                    'description' => 'Delete a Content Planner item by ID.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'content_id' => ['type' => 'integer', 'description' => 'SocialContent ID'],
                        ],
                        'required' => ['content_id'],
                    ],
                ],
                [
                    'name' => 'create_social_brand',
                    'description' => 'Create a Social Brand grouping YouTube, Instagram, and Facebook channels together.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string', 'description' => 'Brand name (e.g. Krishna Motivation)'],
                            'niche' => ['type' => 'string', 'description' => 'Optional brand niche'],
                            'description' => ['type' => 'string'],
                            'account_ids' => ['type' => 'array', 'items' => ['type' => 'integer'], 'description' => 'Optional SocialAccount IDs to link to this brand'],
                        ],
                        'required' => ['name'],
                    ],
                ],
                [
                    'name' => 'share_content_to_brand',
                    'description' => 'Cross-post/clone an existing Content Planner item to all other channels in a Social Brand (YouTube, Instagram, Facebook).',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'content_id' => ['type' => 'integer', 'description' => 'Source SocialContent ID from list_content_planner'],
                            'brand_id' => ['type' => 'integer', 'description' => 'Target SocialBrand ID from list_social_brands'],
                        ],
                        'required' => ['content_id', 'brand_id'],
                    ],
                ],
            ]);
        }

        return $tools;
    }

    public function callTool(string $name, array $args, array $scopes = ['readonly']): array
    {
        $limit = max(1, min(100, (int) ($args['limit'] ?? 25)));
        $canWriteContent = in_array('content:write', $scopes, true);

        $writeTools = ['create_content_plan', 'update_content_plan', 'delete_content_plan', 'create_social_brand', 'share_content_to_brand'];
        if (in_array($name, $writeTools, true) && ! $canWriteContent) {
            throw new InvalidArgumentException("Tool '{$name}' requires the 'content:write' scope. Enable Content Planner write access for this MCP token in LeadSetu Workspace.");
        }

        $result = match ($name) {
            'get_workspace_summary' => $this->getWorkspaceSummary(),
            'list_leads' => $this->listLeads($args, $limit),
            'list_contacts' => $this->listContacts($args, $limit),
            'list_companies' => $this->listCompanies($args, $limit),
            'list_invoices' => $this->listInvoices($args, $limit),
            'list_social_brands' => $this->listSocialBrands(),
            'get_brand_analytics' => $this->getBrandAnalytics($args),
            'list_social_accounts' => $this->listSocialAccounts($args),
            'get_channel_analytics' => $this->getChannelAnalytics($args),
            'get_video_analytics' => $this->getVideoAnalytics($args),
            'list_content_planner' => $this->listContentPlanner($args, $limit),
            'list_drive_files' => $this->listDriveFiles($args),
            'create_content_plan' => $this->createContentPlan($args),
            'update_content_plan' => $this->updateContentPlan($args),
            'delete_content_plan' => $this->deleteContentPlan($args),
            'create_social_brand' => $this->createSocialBrand($args),
            'share_content_to_brand' => $this->shareContentToBrand($args),
            default => throw new InvalidArgumentException("Unknown MCP tool: {$name}"),
        };

        return [
            [
                'type' => 'text',
                'text' => json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            ],
        ];
    }

    protected function getWorkspaceSummary(): array
    {
        $workspace = Workspace::find(WorkspaceContext::id());

        return [
            'workspace' => [
                'id' => $workspace?->id,
                'name' => $workspace?->name,
                'description' => $workspace?->description,
            ],
            'counts' => [
                'leads' => Lead::count(),
                'contacts' => Contact::count(),
                'companies' => Company::count(),
                'invoices' => Invoice::count(),
                'social_accounts' => SocialAccount::count(),
                'planned_contents' => SocialContent::count(),
                'cached_drive_files' => GoogleDriveFile::count(),
            ],
        ];
    }

    protected function listLeads(array $args, int $limit): array
    {
        $q = Lead::query();
        if (! empty($args['status'])) {
            $q->where('status', $args['status']);
        }
        if (! empty($args['search'])) {
            $s = $args['search'];
            $q->where(fn ($sub) => $sub->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")->orWhere('company', 'like', "%{$s}%"));
        }

        return $q->latest()->limit($limit)->get([
            'id', 'name', 'email', 'phone', 'company', 'status', 'source', 'priority', 'deal_value', 'expected_close', 'created_at',
        ])->toArray();
    }

    protected function listContacts(array $args, int $limit): array
    {
        $q = Contact::query();
        if (! empty($args['search'])) {
            $s = $args['search'];
            $q->where(fn ($sub) => $sub->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
        }

        return $q->latest()->limit($limit)->get()->toArray();
    }

    protected function listCompanies(array $args, int $limit): array
    {
        $q = Company::query();
        if (! empty($args['search'])) {
            $q->where('name', 'like', "%{$args['search']}%");
        }

        return $q->latest()->limit($limit)->get()->toArray();
    }

    protected function listInvoices(array $args, int $limit): array
    {
        $q = Invoice::query();
        if (! empty($args['status'])) {
            $q->where('status', $args['status']);
        }

        return $q->latest()->limit($limit)->get()->toArray();
    }

    protected function listSocialBrands(): array
    {
        return SocialBrand::query()
            ->with('accounts:id,social_brand_id,platform,account_name,handle,followers_count,views_count,engagement_rate,status')
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    protected function getBrandAnalytics(array $args): array
    {
        $brand = SocialBrand::findOrFail((int) ($args['brand_id'] ?? 0));
        $accounts = $brand->accounts()->get();

        $channels = [];
        $totalFollowers = 0;
        $totalViews = 0;
        foreach ($accounts as $acc) {
            $cache = is_array($acc->analytics_cache) ? $acc->analytics_cache : [];
            $summary = $cache['summary'] ?? [];
            $followers = (int) ($summary['followers_count'] ?? $acc->followers_count);
            $views = (int) ($summary['views_count'] ?? $acc->views_count);
            $totalFollowers += $followers;
            $totalViews += $views;

            $channels[] = [
                'account_id' => $acc->id,
                'platform' => $acc->platform,
                'account_name' => $acc->account_name,
                'handle' => $acc->handle,
                'followers_count' => $followers,
                'views_count' => $views,
                'engagement_rate' => $summary['engagement_rate'] ?? $acc->engagement_rate,
                'synced_at' => $acc->analytics_synced_at?->toIso8601String(),
                'top_items' => $cache['top_items'] ?? [],
            ];
        }

        return [
            'brand' => ['id' => $brand->id, 'name' => $brand->name, 'niche' => $brand->niche],
            'totals' => [
                'channels_count' => count($channels),
                'followers_count' => $totalFollowers,
                'views_count' => $totalViews,
            ],
            'channels' => $channels,
        ];
    }

    protected function listSocialAccounts(array $args): array
    {
        $q = SocialAccount::query();
        if (! empty($args['platform'])) {
            $q->where('platform', $args['platform']);
        }

        return $q->latest()->get([
            'id', 'platform', 'account_name', 'handle', 'external_id', 'niche', 'followers_count', 'views_count', 'posts_count', 'engagement_rate', 'status', 'last_synced_at', 'analytics_synced_at',
        ])->toArray();
    }

    protected function getChannelAnalytics(array $args): array
    {
        $accountId = (int) ($args['account_id'] ?? 0);
        $account = SocialAccount::findOrFail($accountId);

        if (is_array($account->analytics_cache)) {
            return array_merge($account->analytics_cache, [
                'account_id' => $account->id,
                'account_name' => $account->account_name,
                'handle' => $account->handle,
                'source' => 'cache',
                'synced_at' => $account->analytics_synced_at?->toIso8601String(),
            ]);
        }

        return [
            'account_id' => $account->id,
            'account_name' => $account->account_name,
            'source' => 'cache',
            'message' => 'No cached analytics yet. Open Channel Analytics or run social:sync first.',
        ];
    }

    protected function getVideoAnalytics(array $args): array
    {
        $accountId = (int) ($args['account_id'] ?? 0);
        $videoId = (string) ($args['video_id'] ?? '');
        $account = SocialAccount::findOrFail($accountId);

        $cached = SocialVideoAnalytic::where('social_account_id', $account->id)
            ->where('external_video_id', $videoId)
            ->first();

        if (! $cached) {
            return [
                'account_id' => $account->id,
                'video_id' => $videoId,
                'message' => 'No cached video analytics found yet. Open the video analytics page in LeadSetu once to cache it.',
            ];
        }

        return array_merge($cached->payload ?? [], [
            'source' => 'cache',
            'synced_at' => $cached->synced_at?->toIso8601String(),
        ]);
    }

    protected function listContentPlanner(array $args, int $limit): array
    {
        $q = SocialContent::query()->with('account:id,platform,account_name,handle');
        if (! empty($args['status'])) {
            $q->where('status', $args['status']);
        }

        return $q->latest()->limit($limit)->get([
            'id', 'social_account_id', 'platform', 'content_type', 'title', 'target_keyword', 'hook', 'first_comment', 'pin_first_comment', 'first_comment_id', 'status', 'seo_score', 'scheduled_at', 'published_at', 'drive_file_name', 'youtube_video_id', 'instagram_media_id', 'published_url',
        ])->toArray();
    }

    protected function listDriveFiles(array $args): array
    {
        $conn = GoogleDriveConnection::query()->first();
        if (! $conn) {
            return ['connected' => false, 'items' => []];
        }

        // Read strictly from DB metadata cache (never hits Google Drive API or copies files).
        $folderId = $args['folder_id'] ?? ($conn->default_folder_id ?: 'root');
        $search = $args['search'] ?? null;

        if ($conn->lock_to_default_folder && $conn->default_folder_id) {
            $folderId = $conn->default_folder_id;
        }

        $q = GoogleDriveFile::query();
        if ($search) {
            $q->where('name', 'like', "%{$search}%");
            if ($conn->lock_to_default_folder && $conn->default_folder_id) {
                $q->where('parent_folder_id', $conn->default_folder_id);
            }
        } else {
            $q->where('parent_folder_id', $folderId);
        }

        return [
            'connected' => true,
            'locked_to_default_folder' => (bool) $conn->lock_to_default_folder,
            'items' => $q->orderByDesc('is_folder')->orderByDesc('modified_time')->limit(60)->get([
                'drive_file_id', 'parent_folder_id', 'name', 'mime_type', 'is_folder', 'is_video', 'is_image', 'size', 'web_view_url', 'modified_time', 'synced_at',
            ])->toArray(),
        ];
    }

    protected function createContentPlan(array $args): array
    {
        $account = SocialAccount::findOrFail((int) ($args['social_account_id'] ?? 0));
        $title = trim((string) ($args['title'] ?? ''));
        if ($title === '') {
            throw new InvalidArgumentException('title is required.');
        }

        $status = in_array($args['status'] ?? 'draft', ['idea', 'draft', 'scheduled'], true)
            ? $args['status']
            : 'draft';
        $contentType = in_array($args['content_type'] ?? 'video', SocialContent::TYPES, true)
            ? $args['content_type']
            : 'video';

        $data = [
            'social_account_id' => $account->id,
            'platform' => $account->platform,
            'content_type' => $contentType,
            'title' => $title,
            'target_keyword' => $args['target_keyword'] ?? null,
            'hook' => $args['hook'] ?? null,
            'description' => $args['description'] ?? null,
            'first_comment' => $args['first_comment'] ?? null,
            'pin_first_comment' => array_key_exists('pin_first_comment', $args) ? (bool) $args['pin_first_comment'] : true,
            'tags' => is_array($args['tags'] ?? null) ? array_values($args['tags']) : [],
            'hashtags' => is_array($args['hashtags'] ?? null) ? array_values($args['hashtags']) : [],
            'status' => $status,
            'scheduled_at' => $args['scheduled_at'] ?? null,
        ];

        $data = array_merge($data, $this->resolveDriveAttachments($args));
        $scored = $this->growthService->scoreContent($data);

        $content = SocialContent::create(array_merge($data, $scored));
        $this->audit->log('social_content_created', $content, "MCP created {$content->platform} content: {$content->title}");

        return $content->load('account:id,platform,account_name,handle')->toArray();
    }

    protected function updateContentPlan(array $args): array
    {
        $content = SocialContent::findOrFail((int) ($args['content_id'] ?? 0));

        $updates = [];
        foreach (['title', 'target_keyword', 'hook', 'description', 'first_comment', 'scheduled_at'] as $field) {
            if (array_key_exists($field, $args)) {
                $updates[$field] = $args[$field];
            }
        }
        if (array_key_exists('pin_first_comment', $args)) {
            $updates['pin_first_comment'] = (bool) $args['pin_first_comment'];
        }
        if (isset($args['content_type']) && in_array($args['content_type'], SocialContent::TYPES, true)) {
            $updates['content_type'] = $args['content_type'];
        }
        if (isset($args['status']) && in_array($args['status'], ['idea', 'draft', 'scheduled'], true)) {
            $updates['status'] = $args['status'];
        }
        if (isset($args['tags']) && is_array($args['tags'])) {
            $updates['tags'] = array_values($args['tags']);
        }
        if (isset($args['hashtags']) && is_array($args['hashtags'])) {
            $updates['hashtags'] = array_values($args['hashtags']);
        }

        $updates = array_merge($updates, $this->resolveDriveAttachments($args));
        $merged = array_merge($content->toArray(), $updates);
        $scored = $this->growthService->scoreContent($merged);

        $content->update(array_merge($updates, $scored));
        $this->audit->log('social_content_updated', $content, "MCP updated {$content->platform} content: {$content->title}");

        return $content->fresh()->load('account:id,platform,account_name,handle')->toArray();
    }

    protected function deleteContentPlan(array $args): array
    {
        $content = SocialContent::findOrFail((int) ($args['content_id'] ?? 0));
        $title = $content->title;
        $id = $content->id;
        $content->delete();
        $this->audit->log('social_content_deleted', $content, "MCP deleted social content: {$title}");

        return ['deleted' => true, 'id' => $id, 'title' => $title];
    }

    protected function createSocialBrand(array $args): array
    {
        $name = trim((string) ($args['name'] ?? ''));
        if ($name === '') {
            throw new InvalidArgumentException('name is required.');
        }

        $brand = SocialBrand::create([
            'name' => $name,
            'niche' => $args['niche'] ?? null,
            'description' => $args['description'] ?? null,
        ]);

        if (! empty($args['account_ids']) && is_array($args['account_ids'])) {
            SocialAccount::whereIn('id', $args['account_ids'])
                ->update(['social_brand_id' => $brand->id]);
        }

        $this->audit->log('social_brand_created', $brand, "MCP created social brand {$brand->name}");

        return $brand->load('accounts:id,social_brand_id,platform,account_name,handle')->toArray();
    }

    protected function shareContentToBrand(array $args): array
    {
        $source = SocialContent::findOrFail((int) ($args['content_id'] ?? 0));
        $brand = SocialBrand::findOrFail((int) ($args['brand_id'] ?? 0));

        $targets = $brand->accounts()
            ->where('id', '!=', $source->social_account_id)
            ->get();

        $created = [];
        foreach ($targets as $target) {
            $type = match ($target->platform) {
                'youtube' => in_array($source->content_type, ['reel', 'short'], true) ? 'short' : 'video',
                'instagram' => in_array($source->content_type, ['short', 'video', 'reel'], true) ? 'reel' : (in_array($source->content_type, ['carousel', 'post'], true) ? $source->content_type : 'post'),
                default => in_array($source->content_type, ['reel', 'post', 'video'], true) ? $source->content_type : 'post',
            };

            $data = [
                'social_account_id' => $target->id,
                'platform' => $target->platform,
                'content_type' => $type,
                'title' => $source->title,
                'description' => $source->description,
                'first_comment' => $source->first_comment,
                'pin_first_comment' => (bool) $source->pin_first_comment,
                'hook' => $source->hook,
                'script' => $source->script,
                'tags' => $source->tags ?? [],
                'hashtags' => $source->hashtags ?? [],
                'thumbnail_url' => $source->thumbnail_url,
                'drive_file_id' => $source->drive_file_id,
                'drive_file_name' => $source->drive_file_name,
                'drive_file_url' => $source->drive_file_url,
                'drive_mime_type' => $source->drive_mime_type,
                'drive_thumbnail_file_id' => $source->drive_thumbnail_file_id,
                'target_keyword' => $source->target_keyword,
                'status' => $source->status === 'published' ? 'draft' : $source->status,
                'scheduled_at' => $source->scheduled_at,
            ];

            $scored = $this->growthService->scoreContent($data);
            $clone = SocialContent::create(array_merge($data, $scored));
            $created[] = $clone->load('account:id,platform,account_name,handle')->toArray();
        }

        $this->audit->log('social_content_shared', $source, "MCP shared '{$source->title}' to brand {$brand->name}");

        return [
            'brand' => $brand->name,
            'created_count' => count($created),
            'created' => $created,
        ];
    }

    protected function resolveDriveAttachments(array $args): array
    {
        $extra = [];
        if (! empty($args['drive_file_id'])) {
            $file = GoogleDriveFile::where('drive_file_id', $args['drive_file_id'])->first();
            if (! $file || ! $file->is_video) {
                throw new InvalidArgumentException('drive_file_id must refer to a cached Google Drive video file.');
            }
            $extra['drive_file_id'] = $file->drive_file_id;
            $extra['drive_file_name'] = $file->name;
            $extra['drive_file_url'] = $file->web_view_url;
            $extra['drive_mime_type'] = $file->mime_type;
        }
        if (! empty($args['drive_thumbnail_file_id'])) {
            $thumb = GoogleDriveFile::where('drive_file_id', $args['drive_thumbnail_file_id'])->first();
            if (! $thumb || ! $thumb->is_image) {
                throw new InvalidArgumentException('drive_thumbnail_file_id must refer to a cached Google Drive image file.');
            }
            $extra['drive_thumbnail_file_id'] = $thumb->drive_file_id;
        }

        return $extra;
    }
}
