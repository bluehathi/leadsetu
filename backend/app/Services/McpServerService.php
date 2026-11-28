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
                'description' => 'List Growth Studio Content Planner items (ideas, drafts, scheduled, published) with channel/brand/platform filters, search, and pagination.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'social_account_id' => ['type' => 'integer', 'description' => 'Filter by SocialAccount ID from list_social_accounts'],
                        'brand_id' => ['type' => 'integer', 'description' => 'Filter by SocialBrand ID from list_social_brands'],
                        'platform' => ['type' => 'string', 'description' => 'Filter by platform: youtube, instagram, facebook'],
                        'status' => ['type' => 'string', 'description' => 'Filter by stage: idea, draft, scheduled, published'],
                        'search' => ['type' => 'string', 'description' => 'Search by title or target keyword'],
                        'page' => ['type' => 'integer', 'description' => 'Page number (1-indexed, default 1)'],
                        'limit' => ['type' => 'integer', 'description' => 'Max rows per page (1-100, default 25)'],
                    ],
                ],
            ],
            [
                'name' => 'list_drive_files',
                'description' => 'List Google Drive folders and media files (reads DB cache by default, or pass refresh=true to sync live from Google Drive; respects folder lock if enabled).',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'folder_id' => ['type' => 'string', 'description' => 'Optional Google Drive folder ID'],
                        'search' => ['type' => 'string', 'description' => 'Optional filename search'],
                        'refresh' => ['type' => 'boolean', 'description' => 'Set true to fetch live files from Google Drive API and refresh cache'],
                    ],
                ],
            ],
            [
                'name' => 'get_best_posting_times',
                'description' => 'Analyze historical post performance by day-of-week and hour-of-day to recommend the best posting times for a Brand, Channel, or Platform.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'brand_id' => ['type' => 'integer', 'description' => 'Optional SocialBrand ID from list_social_brands'],
                        'account_id' => ['type' => 'integer', 'description' => 'Optional SocialAccount ID from list_social_accounts'],
                        'platform' => ['type' => 'string', 'description' => 'Optional filter: youtube, instagram, facebook'],
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
                            'contains_ai_content' => ['type' => 'boolean', 'description' => 'Mark true if content is AI-generated/altered (applies YouTube Altered Content & Instagram AI Info label)'],
                            'tags' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'List of tags'],
                            'hashtags' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'List of hashtags'],
                            'status' => ['type' => 'string', 'description' => 'idea, draft, or scheduled (default: draft)'],
                            'scheduled_at' => ['type' => 'string', 'description' => 'Optional schedule datetime in workspace timezone (e.g. 2026-11-28 19:00:00 or ISO 8601 with offset)'],
                            'drive_folder_id' => ['type' => 'string', 'description' => 'Optional Google Drive folder ID to link with this content'],
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
                            'contains_ai_content' => ['type' => 'boolean', 'description' => 'Mark true if content is AI-generated/altered'],
                            'tags' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'hashtags' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'status' => ['type' => 'string', 'description' => 'idea, draft, scheduled, or published'],
                            'scheduled_at' => ['type' => 'string', 'description' => 'Schedule datetime in workspace timezone (e.g. 2026-11-28 19:00:00 or ISO 8601 with offset)'],
                            'youtube_video_id' => ['type' => 'string', 'description' => 'Optional live YouTube video ID to link with this planner item'],
                            'instagram_media_id' => ['type' => 'string', 'description' => 'Optional live Instagram media ID to link with this planner item'],
                            'published_url' => ['type' => 'string', 'description' => 'Optional live post/video URL'],
                            'push_to_youtube' => ['type' => 'boolean', 'description' => 'If true and youtube_video_id is linked, also push updated title/description/tags live to YouTube'],
                            'drive_folder_id' => ['type' => 'string', 'description' => 'Optional Google Drive folder ID to link with this content (pass empty string to clear)'],
                            'drive_file_id' => ['type' => 'string'],
                            'drive_thumbnail_file_id' => ['type' => 'string'],
                        ],
                        'required' => ['content_id'],
                    ],
                ],
                [
                    'name' => 'delete_content_plan',
                    'description' => 'Delete an unpublished Content Planner entry (idea, draft, or scheduled). Deleting published/live YouTube videos is not allowed via MCP.',
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
                [
                    'name' => 'update_first_comment',
                    'description' => 'Post or update the first comment on an already-published YouTube, Instagram, or Facebook Content Planner item.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'content_id' => ['type' => 'integer', 'description' => 'Published SocialContent ID from list_content_planner'],
                            'first_comment' => ['type' => 'string', 'description' => 'Comment text to post or update'],
                            'pin_first_comment' => ['type' => 'boolean', 'description' => 'Optional pin intent flag'],
                            'youtube_video_id' => ['type' => 'string', 'description' => 'Optional live YouTube video ID to link if not already linked'],
                        ],
                        'required' => ['content_id', 'first_comment'],
                    ],
                ],
                [
                    'name' => 'update_live_youtube_video',
                    'description' => 'Update a live YouTube video’s title, description, tags, hashtags, Drive thumbnail, or privacy status directly on YouTube (and sync the planner item). Can also link a youtube_video_id if not yet linked.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'content_id' => ['type' => 'integer', 'description' => 'SocialContent ID from list_content_planner'],
                            'youtube_video_id' => ['type' => 'string', 'description' => 'Optional live YouTube video ID (e.g. from YouTube URL) to link if not already set'],
                            'title' => ['type' => 'string', 'description' => 'New YouTube video title (max 100 chars)'],
                            'description' => ['type' => 'string', 'description' => 'New YouTube video description'],
                            'tags' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Updated YouTube tags'],
                            'hashtags' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Updated hashtags appended to description'],
                            'drive_thumbnail_file_id' => ['type' => 'string', 'description' => 'Optional Google Drive image file ID to push as live YouTube thumbnail'],
                            'contains_ai_content' => ['type' => 'boolean', 'description' => 'Toggle YouTube Altered/Synthetic media label live on YouTube'],
                            'privacy_status' => ['type' => 'string', 'enum' => ['public', 'unlisted', 'private'], 'description' => 'Optional new privacy status'],
                        ],
                        'required' => ['content_id'],
                    ],
                ],
                [
                    'name' => 'update_live_facebook_post',
                    'description' => 'Update the caption/message on an already-published Facebook Page post.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'content_id' => ['type' => 'integer', 'description' => 'Published Facebook SocialContent ID'],
                            'title' => ['type' => 'string', 'description' => 'Updated headline/first line'],
                            'description' => ['type' => 'string', 'description' => 'Updated Facebook post caption/message'],
                            'hashtags' => ['type' => 'array', 'items' => ['type' => 'string']],
                        ],
                        'required' => ['content_id'],
                    ],
                ],
                [
                    'name' => 'sync_youtube_to_planner',
                    'description' => 'Sync existing live YouTube channel videos into Content Planner, automatically linking matching unlinked items by title and importing missing videos with their real youtube_video_id.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'social_account_id' => ['type' => 'integer', 'description' => 'YouTube SocialAccount ID from list_social_accounts'],
                            'limit' => ['type' => 'integer', 'description' => 'Number of recent videos to sync (1-500, default 200)'],
                        ],
                        'required' => ['social_account_id'],
                    ],
                ],
                [
                    'name' => 'update_channel_strategy',
                    'description' => 'Configure per-platform growth strategy (goal, cadence, best_times, title_or_hook_rule, default_tags, default_hashtags, description_footer, default_first_comment) for a YouTube, Instagram, or Facebook channel.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'social_account_id' => ['type' => 'integer', 'description' => 'SocialAccount ID from list_social_accounts'],
                            'goal' => ['type' => 'string'],
                            'cadence' => ['type' => 'string'],
                            'best_times' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'content_focus' => ['type' => 'string'],
                            'title_or_hook_rule' => ['type' => 'string'],
                            'default_tags' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'default_hashtags' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'description_footer' => ['type' => 'string'],
                            'default_first_comment' => ['type' => 'string'],
                            'pin_first_comment' => ['type' => 'boolean'],
                        ],
                        'required' => ['social_account_id'],
                    ],
                ],
                [
                    'name' => 'publish_content_now',
                    'description' => 'Immediately publish (or retry publishing) a draft, scheduled, or failed Content Planner item to YouTube, Instagram, or Facebook.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'content_id' => ['type' => 'integer', 'description' => 'SocialContent ID from list_content_planner'],
                            'privacy_status' => [
                                'type' => 'string',
                                'enum' => ['public', 'unlisted', 'private'],
                                'description' => 'YouTube privacy status (default: public). Ignored for Instagram/Facebook.',
                            ],
                        ],
                        'required' => ['content_id'],
                    ],
                ],
                [
                    'name' => 'create_drive_folder',
                    'description' => 'Create a new folder in connected Google Drive (respects folder lock if enabled).',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string', 'description' => 'New folder name'],
                            'parent_folder_id' => ['type' => 'string', 'description' => 'Optional parent Google Drive folder ID (defaults to default/root folder)'],
                        ],
                        'required' => ['name'],
                    ],
                ],
                [
                    'name' => 'rename_drive_file',
                    'description' => 'Rename a file or folder in connected Google Drive.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'file_id' => ['type' => 'string', 'description' => 'Google Drive file or folder ID from list_drive_files'],
                            'name' => ['type' => 'string', 'description' => 'New name for the file or folder'],
                        ],
                        'required' => ['file_id', 'name'],
                    ],
                ],
                [
                    'name' => 'move_drive_file',
                    'description' => 'Move a file or folder to another folder in connected Google Drive.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'file_id' => ['type' => 'string', 'description' => 'Google Drive file or folder ID to move'],
                            'target_folder_id' => ['type' => 'string', 'description' => 'Destination Google Drive folder ID'],
                        ],
                        'required' => ['file_id', 'target_folder_id'],
                    ],
                ],
                [
                    'name' => 'delete_drive_file',
                    'description' => 'Move a Google Drive file or folder to Trash (default) or permanently delete it.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'file_id' => ['type' => 'string', 'description' => 'Google Drive file or folder ID to trash/delete'],
                            'permanent' => ['type' => 'boolean', 'description' => 'Set true to permanently delete instead of moving to Trash (default: false)'],
                        ],
                        'required' => ['file_id'],
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

        $writeTools = [
            'create_content_plan',
            'update_content_plan',
            'delete_content_plan',
            'create_social_brand',
            'share_content_to_brand',
            'update_first_comment',
            'update_live_youtube_video',
            'update_live_facebook_post',
            'sync_youtube_to_planner',
            'update_channel_strategy',
            'publish_content_now',
            'create_drive_folder',
            'rename_drive_file',
            'move_drive_file',
            'delete_drive_file',
        ];
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
            'get_best_posting_times' => $this->growthService->getBestPostingTimes(
                isset($args['brand_id']) ? (int) $args['brand_id'] : null,
                isset($args['account_id']) ? (int) $args['account_id'] : null,
                isset($args['platform']) ? (string) $args['platform'] : null,
            ),
            'create_content_plan' => $this->createContentPlan($args),
            'update_content_plan' => $this->updateContentPlan($args),
            'delete_content_plan' => $this->deleteContentPlan($args),
            'create_social_brand' => $this->createSocialBrand($args),
            'share_content_to_brand' => $this->shareContentToBrand($args),
            'update_first_comment' => $this->updateFirstComment($args),
            'update_live_youtube_video' => $this->updateLiveYouTubeVideo($args),
            'update_live_facebook_post' => $this->updateLiveFacebookPost($args),
            'sync_youtube_to_planner' => $this->syncYouTubeToPlanner($args),
            'update_channel_strategy' => $this->updateChannelStrategy($args),
            'publish_content_now' => $this->publishContentNow($args),
            'create_drive_folder' => $this->createDriveFolder($args),
            'rename_drive_file' => $this->renameDriveFile($args),
            'move_drive_file' => $this->moveDriveFile($args),
            'delete_drive_file' => $this->deleteDriveFile($args),
            default => throw new InvalidArgumentException("Unknown MCP tool: {$name}"),
        };

        return [
            [
                'type' => 'text',
                'text' => json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            ],
        ];
    }

    protected function workspaceTimezone(): string
    {
        return Workspace::find(WorkspaceContext::id())?->resolvedTimezone() ?? 'Asia/Kolkata';
    }

    protected function getWorkspaceSummary(): array
    {
        $workspace = Workspace::find(WorkspaceContext::id());

        return [
            'workspace' => [
                'id' => $workspace?->id,
                'name' => $workspace?->name,
                'description' => $workspace?->description,
                'timezone' => $workspace?->resolvedTimezone() ?? 'Asia/Kolkata',
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
            'id', 'platform', 'account_name', 'handle', 'external_id', 'niche', 'followers_count', 'views_count', 'posts_count', 'engagement_rate', 'status', 'growth_strategy', 'last_synced_at', 'analytics_synced_at',
        ])->map(function (SocialAccount $acc) {
            $arr = $acc->toArray();
            $arr['growth_strategy'] = $acc->resolvedGrowthStrategy();
            return $arr;
        })->all();
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

        if (! empty($args['social_account_id'])) {
            $q->where('social_account_id', (int) $args['social_account_id']);
        }
        if (! empty($args['brand_id'])) {
            $accountIds = SocialAccount::where('social_brand_id', (int) $args['brand_id'])->pluck('id');
            $q->whereIn('social_account_id', $accountIds);
        }
        if (! empty($args['platform'])) {
            $q->where('platform', $args['platform']);
        }
        if (! empty($args['status'])) {
            $q->where('status', $args['status']);
        }
        if (! empty($args['search'])) {
            $term = trim((string) $args['search']);
            $q->where(function ($sub) use ($term) {
                $sub->where('title', 'like', "%{$term}%")
                    ->orWhere('target_keyword', 'like', "%{$term}%");
            });
        }

        $tz = $this->workspaceTimezone();
        $page = max(1, (int) ($args['page'] ?? 1));
        $total = (clone $q)->count();
        $totalPages = max(1, (int) ceil($total / $limit));
        $items = $q->latest()
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get([
                'id', 'social_account_id', 'platform', 'content_type', 'title', 'target_keyword', 'hook', 'first_comment', 'pin_first_comment', 'first_comment_id', 'contains_ai_content', 'status', 'seo_score', 'scheduled_at', 'published_at', 'drive_folder_id', 'drive_folder_name', 'drive_file_name', 'drive_thumbnail_file_id', 'youtube_video_id', 'instagram_media_id', 'published_url',
            ])
            ->map(function (SocialContent $item) use ($tz) {
                $arr = $item->toArray();
                $arr['scheduled_at_local'] = $item->scheduled_at
                    ? $item->scheduled_at->copy()->timezone($tz)->format('Y-m-d h:i A T')
                    : null;
                return $arr;
            })
            ->toArray();

        return [
            'timezone' => $tz,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $page < $totalPages,
            'items' => $items,
        ];
    }

    protected function listDriveFiles(array $args): array
    {
        $conn = GoogleDriveConnection::query()->first();
        if (! $conn) {
            return ['connected' => false, 'items' => []];
        }
        if (! $conn->lock_to_default_folder || ! $conn->default_folder_id) {
            return [
                'connected' => true,
                'locked_to_default_folder' => false,
                'error' => 'Google Drive is disabled until a default folder is selected and locked in Growth Studio.',
                'items' => [],
            ];
        }

        $folderId = $args['folder_id'] ?? null;
        $search = $args['search'] ?? null;
        $refresh = (bool) ($args['refresh'] ?? false);

        if ($refresh) {
            $live = $this->driveService->listFiles($conn, $folderId, $search, true);

            return [
                'connected' => true,
                'locked_to_default_folder' => (bool) $conn->lock_to_default_folder,
                'source' => $live['source'] ?? 'live',
                'synced_at' => $live['synced_at'] ?? null,
                'items' => $live['items'] ?? [],
            ];
        }

        // Read from DB metadata cache (strictly enforcing locked default folder tree).
        $resolvedFolderId = $folderId ?: ($conn->default_folder_id ?: 'root');
        if ($conn->lock_to_default_folder) {
            if (! $conn->default_folder_id) {
                throw new InvalidArgumentException('Drive access is locked, but no default Google Drive folder is configured.');
            }
            if (! $folderId || $folderId === 'root') {
                $resolvedFolderId = $conn->default_folder_id;
            } elseif (! $this->driveService->isFolderWithinTree($conn->workspace_id, $conn->default_folder_id, $folderId)) {
                throw new InvalidArgumentException('Access is locked to the default Google Drive folder.');
            }
        }

        $q = GoogleDriveFile::query();
        if ($search) {
            $q->where('name', 'like', "%{$search}%");
            if ($conn->lock_to_default_folder && $conn->default_folder_id) {
                $allowedParents = $this->driveService->getDescendantFolderIds($conn->workspace_id, $conn->default_folder_id);
                $q->whereIn('parent_folder_id', $allowedParents);
            }
        } else {
            $q->where('parent_folder_id', $resolvedFolderId);
        }

        return [
            'connected' => true,
            'locked_to_default_folder' => (bool) $conn->lock_to_default_folder,
            'source' => 'cache',
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
            'contains_ai_content' => (bool) ($args['contains_ai_content'] ?? false),
            'tags' => is_array($args['tags'] ?? null) ? array_values($args['tags']) : [],
            'hashtags' => is_array($args['hashtags'] ?? null) ? array_values($args['hashtags']) : [],
            'status' => $status,
            'scheduled_at' => Workspace::parseInTimezone($args['scheduled_at'] ?? null, $this->workspaceTimezone()),
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
        foreach (['title', 'target_keyword', 'hook', 'description', 'first_comment', 'youtube_video_id', 'instagram_media_id', 'published_url'] as $field) {
            if (array_key_exists($field, $args)) {
                $updates[$field] = $args[$field];
            }
        }
        if (array_key_exists('scheduled_at', $args)) {
            $updates['scheduled_at'] = Workspace::parseInTimezone($args['scheduled_at'], $this->workspaceTimezone());
        }
        if (array_key_exists('pin_first_comment', $args)) {
            $updates['pin_first_comment'] = (bool) $args['pin_first_comment'];
        }
        if (array_key_exists('contains_ai_content', $args)) {
            $updates['contains_ai_content'] = (bool) $args['contains_ai_content'];
        }
        if (isset($args['content_type']) && in_array($args['content_type'], SocialContent::TYPES, true)) {
            $updates['content_type'] = $args['content_type'];
        }
        if (isset($args['status']) && in_array($args['status'], SocialContent::STATUSES, true)) {
            $updates['status'] = $args['status'];
        }
        if (isset($args['tags']) && is_array($args['tags'])) {
            $updates['tags'] = array_values($args['tags']);
        }
        if (isset($args['hashtags']) && is_array($args['hashtags'])) {
            $updates['hashtags'] = array_values($args['hashtags']);
        }
        if (array_key_exists('contains_ai_content', $args)) {
            $updates['contains_ai_content'] = (bool) $args['contains_ai_content'];
        }

        $updates = array_merge($updates, $this->resolveDriveAttachments($args));
        $merged = array_merge($content->toArray(), $updates);
        $scored = $this->growthService->scoreContent($merged);

        $content->update(array_merge($updates, $scored));
        $this->audit->log('social_content_updated', $content, "MCP updated {$content->platform} content: {$content->title}");

        if (! empty($args['push_to_youtube'])) {
            $content = $this->driveService->updateLiveYouTubeVideo($content->fresh());
        }

        return $content->fresh()->load('account:id,platform,account_name,handle')->toArray();
    }

    protected function deleteContentPlan(array $args): array
    {
        if (! empty($args['delete_from_youtube'])) {
            throw new InvalidArgumentException('Not allowed: MCP is not allowed to delete YouTube videos.');
        }

        $content = SocialContent::findOrFail((int) ($args['content_id'] ?? 0));
        if ($content->platform === 'youtube' && (! empty($content->youtube_video_id) || $content->status === 'published')) {
            throw new InvalidArgumentException('Not allowed: MCP cannot delete published/live YouTube videos. Only unpublished planner entries (idea, draft, scheduled) can be deleted.');
        }

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
            $data = $this->growthService->adaptContentForAccount($source, $target);

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

    protected function updateFirstComment(array $args): array
    {
        $content = SocialContent::findOrFail((int) ($args['content_id'] ?? 0));
        $text = trim((string) ($args['first_comment'] ?? ''));
        if ($text === '') {
            throw new InvalidArgumentException('first_comment is required.');
        }

        $updatePayload = [
            'first_comment' => $text,
            'pin_first_comment' => array_key_exists('pin_first_comment', $args)
                ? (bool) $args['pin_first_comment']
                : $content->pin_first_comment,
        ];
        if (! empty($args['youtube_video_id'])) {
            $updatePayload['youtube_video_id'] = trim((string) $args['youtube_video_id']);
        }

        $content->update($updatePayload);

        $updated = $this->driveService->postOrUpdateFirstComment($content->fresh());
        $this->audit->log('social_first_comment_updated', $updated, "MCP updated first comment on '{$updated->title}'");

        return $updated->toArray();
    }

    protected function updateLiveYouTubeVideo(array $args): array
    {
        $content = SocialContent::with('account')->findOrFail((int) ($args['content_id'] ?? 0));

        $updates = [];
        foreach (['title', 'description', 'youtube_video_id'] as $field) {
            if (array_key_exists($field, $args) && $args[$field] !== null) {
                $updates[$field] = $args[$field];
            }
        }
        if (isset($args['tags']) && is_array($args['tags'])) {
            $updates['tags'] = array_values($args['tags']);
        }
        if (isset($args['hashtags']) && is_array($args['hashtags'])) {
            $updates['hashtags'] = array_values($args['hashtags']);
        }
        if (array_key_exists('contains_ai_content', $args)) {
            $updates['contains_ai_content'] = (bool) $args['contains_ai_content'];
        }
        if (! empty($args['drive_thumbnail_file_id'])) {
            $updates = array_merge($updates, $this->resolveDriveAttachments([
                'drive_thumbnail_file_id' => $args['drive_thumbnail_file_id'],
            ]));
        }
        if (! empty($updates)) {
            $merged = array_merge($content->toArray(), $updates);
            $scored = $this->growthService->scoreContent($merged);
            $content->update(array_merge($updates, $scored));
        }

        $privacy = isset($args['privacy_status']) ? (string) $args['privacy_status'] : null;
        if ($privacy !== null && ! in_array($privacy, ['public', 'unlisted', 'private'], true)) {
            throw new InvalidArgumentException("privacy_status must be 'public', 'unlisted', or 'private'.");
        }

        $updated = $this->driveService->updateLiveYouTubeVideo($content->fresh(), $privacy);
        $this->audit->log('youtube_video_updated', $updated, "MCP updated live YouTube video '{$updated->title}' ({$updated->youtube_video_id})");

        return $updated->toArray();
    }

    protected function updateLiveFacebookPost(array $args): array
    {
        $content = SocialContent::with('account')->findOrFail((int) ($args['content_id'] ?? 0));

        $updates = [];
        foreach (['title', 'description'] as $field) {
            if (array_key_exists($field, $args) && $args[$field] !== null) {
                $updates[$field] = $args[$field];
            }
        }
        if (isset($args['hashtags']) && is_array($args['hashtags'])) {
            $updates['hashtags'] = array_values($args['hashtags']);
        }
        if (array_key_exists('contains_ai_content', $args)) {
            $updates['contains_ai_content'] = (bool) $args['contains_ai_content'];
        }
        if (! empty($updates)) {
            $merged = array_merge($content->toArray(), $updates);
            $scored = $this->growthService->scoreContent($merged);
            $content->update(array_merge($updates, $scored));
        }

        $updated = $this->driveService->updateLiveFacebookPost($content->fresh());
        $this->audit->log('facebook_post_updated', $updated, "MCP updated live Facebook post '{$updated->title}'");

        return $updated->toArray();
    }

    protected function syncYouTubeToPlanner(array $args): array
    {
        $account = SocialAccount::findOrFail((int) ($args['social_account_id'] ?? 0));
        $limit = max(1, min(500, (int) ($args['limit'] ?? 200)));

        $result = $this->driveService->syncYouTubeVideosToPlanner($account, $limit);
        $this->audit->log('youtube_videos_synced_to_planner', $account, "MCP synced YouTube videos to Content Planner ({$result['linked']} linked, {$result['imported']} imported)");

        return $result;
    }

    protected function updateChannelStrategy(array $args): array
    {
        $account = SocialAccount::findOrFail((int) ($args['social_account_id'] ?? 0));
        $strategy = $account->resolvedGrowthStrategy();

        foreach (['goal', 'cadence', 'content_focus', 'title_or_hook_rule', 'description_footer', 'default_first_comment'] as $strField) {
            if (array_key_exists($strField, $args)) {
                $strategy[$strField] = (string) ($args[$strField] ?? '');
            }
        }
        foreach (['best_times', 'default_tags', 'default_hashtags'] as $arrField) {
            if (isset($args[$arrField]) && is_array($args[$arrField])) {
                $strategy[$arrField] = array_values(array_filter(array_map('strval', $args[$arrField])));
            }
        }
        if (array_key_exists('pin_first_comment', $args)) {
            $strategy['pin_first_comment'] = (bool) $args['pin_first_comment'];
        }

        $account->update(['growth_strategy' => $strategy]);
        $this->audit->log('social_channel_strategy_updated', $account, "MCP updated {$account->platform} growth strategy for {$account->account_name}");

        return [
            'id' => $account->id,
            'platform' => $account->platform,
            'account_name' => $account->account_name,
            'growth_strategy' => $account->fresh()->resolvedGrowthStrategy(),
        ];
    }

    protected function publishContentNow(array $args): array
    {
        $content = SocialContent::with('account')->findOrFail((int) ($args['content_id'] ?? 0));
        $privacy = (string) ($args['privacy_status'] ?? 'public');
        if (! in_array($privacy, ['public', 'unlisted', 'private'], true)) {
            throw new InvalidArgumentException("privacy_status must be 'public', 'unlisted', or 'private'.");
        }

        $updated = $this->driveService->publishContent($content, $privacy);
        $this->audit->log('social_content_published_now', $updated, "MCP published '{$updated->title}' to {$updated->platform}");

        return $updated->toArray();
    }

    protected function requireDriveConnection(): GoogleDriveConnection
    {
        $conn = GoogleDriveConnection::query()->first();
        if (! $conn) {
            throw new InvalidArgumentException('Google Drive is not connected in this workspace.');
        }

        return $conn;
    }

    protected function createDriveFolder(array $args): array
    {
        $conn = $this->requireDriveConnection();
        $folder = $this->driveService->createFolder(
            $conn,
            (string) ($args['name'] ?? ''),
            isset($args['parent_folder_id']) ? (string) $args['parent_folder_id'] : null
        );

        $this->audit->log('google_drive_folder_created', $conn, "MCP created Google Drive folder '{$folder['name']}' ({$folder['drive_file_id']})");

        return $folder;
    }

    protected function renameDriveFile(array $args): array
    {
        $conn = $this->requireDriveConnection();
        $fileId = trim((string) ($args['file_id'] ?? ''));
        if ($fileId === '') {
            throw new InvalidArgumentException('file_id is required.');
        }

        $updated = $this->driveService->renameFile($conn, $fileId, (string) ($args['name'] ?? ''));
        $this->audit->log('google_drive_file_renamed', $conn, "MCP renamed Google Drive item {$fileId} to '{$updated['name']}'");

        return $updated;
    }

    protected function moveDriveFile(array $args): array
    {
        $conn = $this->requireDriveConnection();
        $fileId = trim((string) ($args['file_id'] ?? ''));
        $targetFolderId = trim((string) ($args['target_folder_id'] ?? ''));
        if ($fileId === '' || $targetFolderId === '') {
            throw new InvalidArgumentException('file_id and target_folder_id are required.');
        }

        $updated = $this->driveService->moveFile($conn, $fileId, $targetFolderId);
        $this->audit->log('google_drive_file_moved', $conn, "MCP moved Google Drive item {$fileId} to folder {$targetFolderId}");

        return $updated;
    }

    protected function deleteDriveFile(array $args): array
    {
        $conn = $this->requireDriveConnection();
        $fileId = trim((string) ($args['file_id'] ?? ''));
        if ($fileId === '') {
            throw new InvalidArgumentException('file_id is required.');
        }

        $permanent = (bool) ($args['permanent'] ?? false);
        $result = $this->driveService->deleteFile($conn, $fileId, $permanent);
        $this->audit->log('google_drive_file_deleted', $conn, "MCP ".($permanent ? 'permanently deleted' : 'trashed')." Google Drive item {$fileId}");

        return $result;
    }

    protected function resolveDriveAttachments(array $args): array
    {
        $extra = [];
        $hasDriveInput = array_key_exists('drive_folder_id', $args)
            || ! empty($args['drive_file_id'])
            || ! empty($args['drive_thumbnail_file_id']);

        $allowedParents = null;
        if ($hasDriveInput) {
            $conn = $this->requireDriveConnection();
            $this->driveService->assertDriveLocked($conn);
            $allowedParents = $this->driveService->getDescendantFolderIds($conn->workspace_id, $conn->default_folder_id);
        }

        if (array_key_exists('drive_folder_id', $args)) {
            $folderId = trim((string) ($args['drive_folder_id'] ?? ''));
            if ($folderId === '') {
                $extra['drive_folder_id'] = null;
                $extra['drive_folder_name'] = null;
            } else {
                if ($conn && $conn->lock_to_default_folder && ! $this->driveService->isFolderWithinTree($conn->workspace_id, $conn->default_folder_id, $folderId)) {
                    throw new InvalidArgumentException('Access is locked to the default Google Drive folder.');
                }
                $folder = GoogleDriveFile::where('drive_file_id', $folderId)->where('is_folder', true)->first();
                $extra['drive_folder_id'] = $folderId;
                $extra['drive_folder_name'] = $folder?->name ?? ($conn?->default_folder_id === $folderId ? $conn?->default_folder_name : null);
            }
        }

        if (! empty($args['drive_file_id'])) {
            $file = GoogleDriveFile::where('drive_file_id', $args['drive_file_id'])->first();
            if (! $file || ! $file->is_video) {
                throw new InvalidArgumentException('drive_file_id must refer to a cached Google Drive video file.');
            }
            if ($allowedParents !== null && ! in_array($file->parent_folder_id, $allowedParents, true)) {
                throw new InvalidArgumentException('Access is locked to the default Google Drive folder.');
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
            if ($allowedParents !== null && ! in_array($thumb->parent_folder_id, $allowedParents, true)) {
                throw new InvalidArgumentException('Access is locked to the default Google Drive folder.');
            }
            $extra['drive_thumbnail_file_id'] = $thumb->drive_file_id;
        }

        return $extra;
    }
}
