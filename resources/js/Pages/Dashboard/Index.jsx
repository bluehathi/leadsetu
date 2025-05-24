import React, { useState } from 'react'; // Import useState for potential mobile menu toggle
import { Head, Link } from '@inertiajs/react';
import Logo from '@/Components/Logo'; // Adjust path if needed
import Sidebar from '@/Components/parts/Sidebar';
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Dashboard Component
export default function Dashboard({ user, stats = {}, charts = {}, recentActivity = [] }) {
    const [sidebarOpen, setSidebarOpen] = useState(false); // State for mobile sidebar toggle
    console.log('Dashboard props:', { user, stats, charts, recentActivity });
    // Chart data
    const leadsBarData = {
        //labels: charts.months || [],
        datasets: [
            {
                label: 'Leads per Month',
                data: charts.leadsPerMonth || [],
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderRadius: 6,
            },
        ],
    };
    const conversionLineData = {
        //labels: charts.months || [],
        datasets: [
            {
                label: 'Conversion Rate (%)',
                data: charts.conversionPerMonth || [],
                fill: false,
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                tension: 0.3,
                pointRadius: 5,
            },
        ],
    };

    return (
        <>
            <Head title="Dashboard" />

            {/* Main container with sidebar */}
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <Sidebar user={user}/>
               
                {/* Main content area */}
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    {/* Header for main content area (can be simpler now) */}
                    <header className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700 md:hidden">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
                            onClick={() => setSidebarOpen(true)} // Implement mobile sidebar toggle later if needed
                        >
                            <span className="sr-only">Open sidebar</span>
                            {/* Heroicon name: outline/menu-alt-2 */}
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </button>
                        <div className="flex-1 px-4 flex justify-between items-center">
                           {/* Logo for Mobile Header */}
                            <div className="flex-shrink-0 md:hidden">
                                <Link href={route('dashboard')}>
                                    <Logo />
                                </Link>
                            </div>
                            {/* Logout Button for Mobile Header */}
                            <div className="ml-auto">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition duration-150 ease-in-out"
                                >
                                    Log Out
                                </Link>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8">
                             {/* Welcome message inside main content */}
                             <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                                Welcome back, {user?.name ?? 'User'}!
                            </h2>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Total Leads</h3>
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalLeads ?? 0}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Conversion Rate</h3>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.conversionRate ?? 0}%</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Active Deals</h3>
                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.activeDeals ?? 0}</p>
                                    {typeof stats.activeDealsValue !== 'undefined' && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Value: ${stats.activeDealsValue}</p>
                                    )}
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-4">Leads per Month</h4>
                                    
                                    <Bar data={leadsBarData} options={{ responsive: true, plugins: { legend: { display: false } } }} height={220} />
                                    
                                    </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-4">Conversion Rate Trend</h4>
                                    <Line data={conversionLineData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} height={220} /> 
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Activity</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {recentActivity.length > 0 ? recentActivity.map((log) => (
                                                <tr key={log.id}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(log.created_at).toLocaleString()}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{log.user ? log.user.name : 'System'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{log.action}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{log.description}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-2 text-center text-gray-500 dark:text-gray-300">No recent activity found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Footer (Optional, inside main content scroll area) */}
                    <footer className="bg-gray-100 dark:bg-gray-900 py-4 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            &copy; { new Date().getFullYear() } LeadSetu. All rights reserved.
                        </p>
                    </footer>
                </div>

                {/* Mobile Sidebar (placeholder logic) */}
                {/* Add transition and state management for sidebarOpen here if needed */}
                {/* Example structure:
                <Transition show={sidebarOpen}>
                    <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
                         <Transition.Child ... > <Dialog.Overlay ... /> </Transition.Child>
                         <Transition.Child ... > [Sidebar content identical to desktop] </Transition.Child>
                    </Dialog>
                </Transition>
                */}

            </div>
        </>
    );
}
