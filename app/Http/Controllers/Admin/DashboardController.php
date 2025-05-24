<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Total leads
        $totalLeads = Lead::count();
        // Conversion rate: leads with status 'won' / total leads
        $convertedLeads = Lead::where('status', 'won')->count();
        $conversionRate = $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 2) : 0;
        // Active deals: leads with status 'qualified'
        $activeDeals = Lead::where('status', 'qualified')->count();
        // Value of active deals (deal_value)
        $activeDealsValue = Lead::where('status', 'qualified')->sum('deal_value');
        // Recent activity (last 7 days)
        $recentActivity = ActivityLog::with('user')->latest()->take(10)->get();

        // Leads per month for the last 6 months (for chart)
        $leadsPerMonth = [];
        $conversionPerMonth = [];
        $months = collect(range(0, 5))->map(function ($i) {
            return now()->subMonths($i)->format('Y-m');
        })->reverse();
        foreach ($months as $month) {
            $leadsPerMonth[] = Lead::whereYear('created_at', substr($month, 0, 4))
                ->whereMonth('created_at', substr($month, 5, 2))
                ->count();
            $total = Lead::whereYear('created_at', substr($month, 0, 4))
                ->whereMonth('created_at', substr($month, 5, 2))
                ->count();
            $converted = Lead::whereYear('created_at', substr($month, 0, 4))
                ->whereMonth('created_at', substr($month, 5, 2))
                ->where('status', 'won')
                ->count();
            $conversionPerMonth[] = $total > 0 ? round(($converted / $total) * 100, 2) : 0;
        }

        return Inertia::render('Dashboard/Index', [
            'user' => Auth::user(),
            'stats' => [
                'totalLeads' => $totalLeads,
                'conversionRate' => $conversionRate,
                'activeDeals' => $activeDeals,
                'activeDealsValue' => $activeDealsValue,
            ],
            'charts' => [
                'leadsPerMonth' => $leadsPerMonth,
                'conversionPerMonth' => $conversionPerMonth,
                'months' => $months,
            ],
            'recentActivity' => $recentActivity,
        ]);
    }
}
