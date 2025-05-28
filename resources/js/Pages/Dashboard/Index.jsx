import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler 
} from 'chart.js';
import { Users, TrendingUp, Briefcase, Activity, CalendarDays, User as UserIcon, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

import StatCard
 from '../../Components/ui/StatCard';
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// const StatCard = ({ title, value, icon: Icon, colorClass, subValue, subLabel, link }) => (
//     <Link href={link || '#'} className={`block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group border-l-4 ${colorClass}`}>
//         <div className="flex items-center justify-between">
//             <div>
//                 <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{title}</p>
//                 <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{value}</p>
//                 {subValue && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subLabel}: {subValue}</p>}
//             </div>
//             <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('border-', 'bg-').replace('-500', '-100 dark:bg-opacity-20 dark:bg-')}`}>
//                  <Icon className={`w-7 h-7 ${colorClass.replace('border-', 'text-')}`} />
//             </div>
//         </div>
//     </Link>
// );


export default function Dashboard({ stats = {}, charts = {}, recentActivity = [] }) {
    const { props } = usePage();
    const user = props.auth?.user; 

    const commonChartOptions = (darkMode) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, 
            },
            tooltip: {
                backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                titleColor: darkMode ? '#e5e7eb' : '#1f2937', 
                bodyColor: darkMode ? '#d1d5db' : '#374151', 
                borderColor: darkMode ? '#4b5563' : '#e5e7eb', 
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 3,
            }
        },
        scales: {
            x: {
                grid: {
                    display: false, 
                    borderColor: darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)', 
                },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280', 
                    font: { size: 10 }
                }
            },
            y: {
                grid: {
                    color: darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)', 
                    borderDash: [2, 3], 
                },
                ticks: {
                    color: darkMode ? '#9ca3af' : '#6b7280', 
                    font: { size: 10 },
                    beginAtZero: true,
                }
            }
        }
    });
    
    const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

    // Ensure chartLabels is always an array
    const chartLabels = (Array.isArray(charts.months) && charts.months.length > 0) 
                        ? charts.months 
                        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']; // Default fallback

    const leadsBarData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Leads',
                data: charts.leadsPerMonth || [],
                backgroundColor: 'rgba(59, 130, 246, 0.6)', 
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(59, 130, 246, 0.8)',
            },
        ],
    };
    const leadsBarOptions = { ...commonChartOptions(isDarkMode) };

    const conversionLineData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Conversion Rate',
                data: charts.conversionPerMonth || [],
                fill: true, 
                borderColor: 'rgba(16, 185, 129, 1)', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4, 
                pointRadius: 4,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
            },
        ],
    };
    const conversionLineOptions = { 
        ...commonChartOptions(isDarkMode), 
        scales: { 
            ...commonChartOptions(isDarkMode).scales, 
            y: { ...commonChartOptions(isDarkMode).scales.y, min: 0, max: 100, ticks: { ...commonChartOptions(isDarkMode).scales.y.ticks, callback: value => value + '%' } } 
        } 
    };

    return (
        <AuthenticatedLayout user={user} title="Dashboard">
            <Head title="Dashboard" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
                        Welcome back, <span className="text-blue-600 dark:text-blue-400">{user?.name ?? 'User'}</span>!
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Here's what's happening with your leads today.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Leads" value={stats.totalLeads ?? 0} icon={Users} colorClass="border-blue-500" link={route('leads.index')} />
                    <StatCard title="Conversion Rate" value={`${stats.conversionRate ?? 0}%`} icon={TrendingUp} colorClass="border-green-500" />
                    <StatCard title="Active Deals" value={stats.activeDeals ?? 0} icon={Briefcase} colorClass="border-purple-500" subValue={typeof stats.activeDealsValue !== 'undefined' ? `$${Number(stats.activeDealsValue).toLocaleString()}` : undefined} subLabel="Value" />
                    <StatCard title="New This Month" value={stats.newThisMonth ?? 0} icon={CalendarDays} colorClass="border-yellow-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                    <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">Leads Overview</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Monthly lead generation trend.</p>
                        <div className="h-72">
                             <Bar data={leadsBarData} options={leadsBarOptions} />
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">Conversion Rate</h2>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Monthly conversion performance.</p>
                        <div className="h-72">
                            <Line data={conversionLineData} options={conversionLineOptions} /> 
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center">
                        <Activity size={20} className="mr-2 text-blue-500"/>
                        Recent Activity
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Latest updates and actions in your CRM.</p>
                    <div className="overflow-x-auto">
                        {recentActivity.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700/60">
                                <thead className="bg-gray-50 dark:bg-gray-700/30">
                                    <tr>
                                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {recentActivity.slice(0, 5).map((log) => ( 
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 font-medium flex items-center">
                                                <UserIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500"/>
                                                {log.user ? log.user.name : 'System'}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${log.action === 'lead_created' ? 'bg-green-100 text-green-800 dark:bg-green-700/50 dark:text-green-200' : 
                                                     log.action === 'lead_updated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700/50 dark:text-blue-200' :
                                                     log.action === 'status_changed' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/50 dark:text-yellow-200' :
                                                     'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}`}>
                                                    {log.action ? log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 truncate max-w-xs" title={log.description}>{log.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-10">
                                <AlertCircle size={36} className="mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity found.</p>
                            </div>
                        )}
                         {recentActivity.length > 5 && (
                            <div className="pt-4 text-center">
                                <Link href={route('activity.logs')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                    View All Activity
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-700/60">
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                        &copy; { new Date().getFullYear() } LeadSetu. All rights reserved.
                    </p>
                </footer>
            </div>
        </AuthenticatedLayout>
    );
}
