<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        \App\Models\ProspectList::class      => \App\Policies\ProspectListPolicy::class,
        \App\Models\Contact::class           => \App\Policies\ContactPolicy::class,
        \App\Models\Company::class           => \App\Policies\CompanyPolicy::class,
        \App\Models\Lead::class              => \App\Policies\LeadPolicy::class,
        \App\Models\EmailCampaign::class     => \App\Policies\EmailCampaignPolicy::class,
        \App\Models\Workspace::class         => \App\Policies\WorkspacePolicy::class,
        \App\Models\ActivityLog::class       => \App\Policies\ActivityLogPolicy::class,
        \App\Models\MailConfiguration::class => \App\Policies\MailConfigurationPolicy::class,
        // Add more as needed
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot()
    {
        $this->registerPolicies();
        // You can define additional gates here if needed
    }
}
