<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Organization;
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
        // Conversion rate: leads with status 'converted' / total leads
        $convertedLeads = Lead::where('status', 'converted')->count();
        $conversionRate = $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 2) : 0;
        // Active deals: leads with status 'active'
        $activeDeals = Lead::where('status', 'active')->count();
        // Value of active deals (if you have a value field, otherwise just count)
        $activeDealsValue = Lead::where('status', 'active')->sum('value'); // If 'value' column exists
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
                ->where('status', 'converted')
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
