import React, { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
// Import desired icons from lucide-react
import { Plus, Eye, Pencil, Trash2, CheckCircle2, XCircle, Info, Flame, TrendingUp, ChevronDown, Calendar, User, Tag, DollarSign, Search } from 'lucide-react'; // Added CheckCircle2, XCircle for flash
import Sidebar from '@/Components/parts/Sidebar'; // Adjust path if needed
import Pagination from '@/Components/Pagination'; // Import the Pagination component
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import axios from 'axios';
import Select from 'react-select';

// Assuming you might refactor Dashboard into a layout component:
// import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Example import


// Leads Index Page Component
// Receives 'auth' (containing user), 'leads' (Laravel Paginator instance), and 'flash' messages as props
export default function LeadsIndex({ user, leads }) {

    // --- Get Flash Messages ---
    // Use the usePage hook to access shared props, including flash messages
    const { props } = usePage();
    const flash = props.flash || {}; // Get flash object, default to empty object if not present

    // --- Status/Method Options (These should ideally come from props passed by the controller) ---
    const leadStatusOptions = props.statusOptions || [ // Example fallback
        { value: 'new', label: 'New Lead' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'unqualified', label: 'Unqualified' },
        { value: 'lost', label: 'Lost Deal' },
        { value: 'won', label: 'Won Deal' }
    ];
    const leadMethodOptions = props.methodOptions || [ // Example fallback
        { value: 'website', label: 'Website Form' },
        { value: 'referral', label: 'Referral' },
        { value: 'cold_call', label: 'Cold Call' },
        { value: 'advertisement', label: 'Advertisement' },
        { value: 'other', label: 'Other' },
    ];
    // --- End Status/Method Options ---

    // --- Filtering and Sorting State ---
    const [statusMulti, setStatusMulti] = useState([]);
    const [qualificationMulti, setQualificationMulti] = useState([]);
    const [ownerMulti, setOwnerMulti] = useState([]);
    const [sortField, setSortField] = useState('');
    const [sortDir, setSortDir] = useState('asc');

    // Advanced filter state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [dealMin, setDealMin] = useState('');
    const [dealMax, setDealMax] = useState('');
    const [tagsFilter, setTagsFilter] = useState('');

    // --- Filtered and Sorted Leads ---
    const filteredLeads = useMemo(() => {
        let data = leads && leads.data ? [...leads.data] : [];
        // Advanced filters
        if (searchText) {
            const s = searchText.toLowerCase();
            data = data.filter(l =>
                (l.name && l.name.toLowerCase().includes(s)) ||
                (l.email && l.email.toLowerCase().includes(s)) ||
                (l.company && l.company.toLowerCase().includes(s)) ||
                (l.tags && Array.isArray(l.tags) && l.tags.join(',').toLowerCase().includes(s))
            );
        }
        if (statusMulti.length > 0) {
            const vals = statusMulti.map(s => s.value);
            data = data.filter(l => vals.includes(l.status));
        }
        if (qualificationMulti.length > 0) {
            const vals = qualificationMulti.map(q => q.value);
            data = data.filter(l => vals.includes(l.qualification));
        }
        if (ownerMulti.length > 0) {
            const vals = ownerMulti.map(o => o.value);
            data = data.filter(l => vals.includes(String(l.lead_owner)));
        }
        if (dateFrom) {
            data = data.filter(l => new Date(l.created_at) >= new Date(dateFrom));
        }
        if (dateTo) {
            data = data.filter(l => new Date(l.created_at) <= new Date(dateTo));
        }
        if (dealMin !== '') {
            data = data.filter(l => Number(l.deal_value) >= Number(dealMin));
        }
        if (dealMax !== '') {
            data = data.filter(l => Number(l.deal_value) <= Number(dealMax));
        }
        if (tagsFilter) {
            const tag = tagsFilter.toLowerCase();
            data = data.filter(l => Array.isArray(l.tags) && l.tags.some(t => t.toLowerCase().includes(tag)));
        }
        if (sortField) {
            data = data.sort((a, b) => {
                if (sortField === 'score') {
                    return sortDir === 'asc' ? a.score - b.score : b.score - a.score;
                }
                if (sortField === 'qualification') {
                    const order = { Hot: 3, Warm: 2, Cold: 1 };
                    return sortDir === 'asc' ? (order[a.qualification] || 0) - (order[b.qualification] || 0) : (order[b.qualification] || 0) - (order[a.qualification] || 0);
                }
                if (sortField === 'added_on') {
                    return sortDir === 'asc'
                        ? new Date(a.created_at) - new Date(b.created_at)
                        : new Date(b.created_at) - new Date(a.created_at);
                }
                // Generic string/array sort for other fields
                let aVal = a[sortField];
                let bVal = b[sortField];
                if (Array.isArray(aVal)) aVal = aVal.join(', ');
                if (Array.isArray(bVal)) bVal = bVal.join(', ');
                if (aVal === undefined) aVal = '';
                if (bVal === undefined) bVal = '';
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return 0;
            });
        }
        return data;
    }, [leads, searchText, statusMulti, qualificationMulti, ownerMulti, dateFrom, dateTo, dealMin, dealMax, tagsFilter, sortField, sortDir]);

    // --- Sorting Handlers ---
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    // --- Column Visibility State ---
    const allColumns = [
        { key: 'title', label: 'Title' },
        { key: 'positions', label: 'Positions' },
        { key: 'tags', label: 'Tags' },
        { key: 'company', label: 'Company' },
        { key: 'status', label: 'Status' },
        { key: 'score', label: 'Score' },
        { key: 'qualification', label: 'Qualification' },
        { key: 'added_on', label: 'Added On' },
    ];
    const [showColumns, setShowColumns] = useState(allColumns.map(col => col.key));
    const [showColDropdown, setShowColDropdown] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(true);

    // Fetch user settings on mount
    React.useEffect(() => {
        let mounted = true;
        axios.get('/admin/user/settings')
            .then(res => {
                if (mounted && res.data.settings && res.data.settings.leads_table_columns) {
                    setShowColumns(res.data.settings.leads_table_columns);
                }
            })
            .catch(() => {})
            .finally(() => { if (mounted) setSettingsLoading(false); });
        return () => { mounted = false; };
    }, []);

    // Persist column settings when changed
    React.useEffect(() => {
        if (!settingsLoading) {
            axios.post('user/settings', { settings: { leads_table_columns: showColumns } });
        }
    }, [showColumns, settingsLoading]);

    const toggleColumn = (key) => {
        setShowColumns(cols =>
            cols.includes(key)
                ? cols.filter(c => c !== key)
                : [...cols, key]
        );
    };

    return (
        // If using a separate Layout component, remove the outer div and Sidebar,
        // and wrap the content with <AuthenticatedLayout user={auth.user}> ... </AuthenticatedLayout>
        <>
            <Head title="Leads" />

             {/* Main Flex Container including Sidebar */}
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">

                {/* Sidebar */}
                {/* Ensure 'auth.user' object is passed */}
                <Sidebar user={user} />

                {/* Main Content Area */}
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    {/* Optional Header for mobile (if not handled by layout) */}
                    {/* Example: <header className="md:hidden ..."> ... </header> */}

                    {/* Scrollable Content Area */}
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8">
                            {settingsLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">Loading your preferences...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Page Header */}
                                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Leads</h1>
                                        <div className="flex flex-row gap-2 w-full sm:w-auto justify-end items-center">
                                            {/* Toggle Columns Button */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                    onClick={() => setShowColDropdown(v => !v)}
                                                >
                                                    Toggle Columns
                                                </button>
                                                {showColDropdown && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-50 p-2">
                                                        {allColumns.map(col => (
                                                            <label key={col.key} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={showColumns.includes(col.key)}
                                                                    onChange={() => toggleColumn(col.key)}
                                                                    className="form-checkbox h-4 w-4 text-blue-600"
                                                                />
                                                                <span className="text-sm text-gray-700 dark:text-gray-200">{col.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Use absolute path for Kanban View to avoid route helper issues */}
                                            <Link href="/admin/leads/kanban" className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition">Kanban View</Link>
                                            <Link
                                                href={route('leads.create')}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 transition"
                                            >
                                                <Plus size={18} className="mr-2 -ml-1" />
                                                Add Lead
                                            </Link>
                                        </div>
                                    </div>

                                     {/* Flash Message Display */}
                                    {flash.success && (
                                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md flex items-center justify-between" role="alert">
                                           <div className="flex items-center">
                                             <CheckCircle2 size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                                             <span>{flash.success}</span>
                                           </div>
                                        
                                        </div>
                                    )}
                                     {/* Display error flash messages if they exist */}
                                     {flash.error && (
                                        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center justify-between" role="alert">
                                           <div className="flex items-center">
                                             <XCircle size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                                             <span>{flash.error}</span>
                                           </div>
                                        </div>
                                    )}

                                    {/* Advanced Filter Toggle */}
                                    <button
                                        className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition shadow"
                                        onClick={() => setShowAdvanced(v => !v)}
                                    >
                                        {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                                    </button>
                                    {showAdvanced && (
                                        <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-wrap gap-4 items-center">
                                            <div className="flex items-center gap-2">
                                                <Search size={16} />
                                                <input
                                                    type="text"
                                                    className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2 min-w-[180px]"
                                                    placeholder="Search name, email, company, tags..."
                                                    value={searchText}
                                                    onChange={e => setSearchText(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} />
                                                <input
                                                    type="text"
                                                    className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2 min-w-[120px]"
                                                    placeholder="Tag"
                                                    value={tagsFilter}
                                                    onChange={e => setTagsFilter(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} />
                                                <input
                                                    type="number"
                                                    className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2 w-20"
                                                    placeholder="Min Value"
                                                    value={dealMin}
                                                    onChange={e => setDealMin(e.target.value)}
                                                />
                                                <span>-</span>
                                                <input
                                                    type="number"
                                                    className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2 w-20"
                                                    placeholder="Max Value"
                                                    value={dealMax}
                                                    onChange={e => setDealMax(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                <input
                                                    type="date"
                                                    className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2"
                                                    value={dateFrom}
                                                    onChange={e => setDateFrom(e.target.value)}
                                                />
                                                <span>-</span>
                                                <input
                                                    type="date"
                                                    className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2"
                                                    value={dateTo}
                                                    onChange={e => setDateTo(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User size={16} />
                                                <input
                                                    type="text"
                                                    className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2 min-w-[100px]"
                                                    placeholder="Owner ID"
                                                    value={ownerFilter}
                                                    onChange={e => setOwnerFilter(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2 min-w-[110px]"
                                                    value={statusFilter}
                                                    onChange={e => setStatusFilter(e.target.value)}
                                                >
                                                    <option value="">All Statuses</option>
                                                    {leadStatusOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                className="ml-2 px-4 py-2 rounded border border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-800 transition"
                                                onClick={() => {
                                                    setSearchText('');
                                                    setStatusFilter('');
                                                    setOwnerFilter('');
                                                    setDateFrom('');
                                                    setDateTo('');
                                                    setDealMin('');
                                                    setDealMax('');
                                                    setTagsFilter('');
                                                }}
                                            >
                                                Reset All
                                            </button>
                                        </div>
                                    )}

                                    {/* Useful Filter Bar */}
                                    <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-wrap gap-4 items-center">
                                        <div className="min-w-[180px]">
                                            <Select
                                                isMulti
                                                options={leadStatusOptions}
                                                value={statusMulti}
                                                onChange={setStatusMulti}
                                                placeholder="Status"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div className="min-w-[180px]">
                                            <Select
                                                isMulti
                                                options={[{ value: 'Hot', label: 'Hot' }, { value: 'Warm', label: 'Warm' }, { value: 'Cold', label: 'Cold' }]}
                                                value={qualificationMulti}
                                                onChange={setQualificationMulti}
                                                placeholder="Qualification"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div className="min-w-[180px]">
                                            <Select
                                                isMulti
                                                options={props.owners ? props.owners.map(u => ({ value: String(u.id), label: u.name })) : []}
                                                value={ownerMulti}
                                                onChange={setOwnerMulti}
                                                placeholder="Owner"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        {(statusMulti.length > 0 || qualificationMulti.length > 0 || ownerMulti.length > 0) && (
                                            <button
                                                type="button"
                                                className="ml-2 px-4 py-2 rounded-full border border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-800 transition"
                                                onClick={() => { setStatusMulti([]); setQualificationMulti([]); setOwnerMulti([]); }}
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    {/* Leads Table Container */}
                                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto" style={{ minWidth: 900 }}>
                                            <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                                                {/* Table Head */}
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                    <tr>
                                                        <th
                                                            scope="col"
                                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                            onClick={() => handleSort('name')}
                                                        >
                                                            <span className="inline-flex items-center">
                                                                Name {sortField === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                                                            </span>
                                                        </th>
                                                        {showColumns.includes('title') && (
                                                            <th
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                                onClick={() => handleSort('title')}
                                                            >
                                                                <span className="inline-flex items-center">
                                                                    Title {sortField === 'title' && (sortDir === 'asc' ? '▲' : '▼')}
                                                                </span>
                                                            </th>
                                                        )}
                                                        {showColumns.includes('positions') && (
                                                            <th
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                                onClick={() => handleSort('positions')}
                                                            >
                                                                <span className="inline-flex items-center">
                                                                    Positions {sortField === 'positions' && (sortDir === 'asc' ? '▲' : '▼')}
                                                                </span>
                                                            </th>
                                                        )}
                                                        {showColumns.includes('tags') && (
                                                            <th
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                                onClick={() => handleSort('tags')}
                                                            >
                                                                <span className="inline-flex items-center">
                                                                    Tags {sortField === 'tags' && (sortDir === 'asc' ? '▲' : '▼')}
                                                                </span>
                                                            </th>
                                                        )}
                                                        {showColumns.includes('company') && (
                                                            <th
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                                onClick={() => handleSort('company')}
                                                            >
                                                                <span className="inline-flex items-center">
                                                                    Company {sortField === 'company' && (sortDir === 'asc' ? '▲' : '▼')}
                                                                </span>
                                                            </th>
                                                        )}
                                                        {showColumns.includes('status') && (
                                                            <th
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                                onClick={() => handleSort('status')}
                                                            >
                                                                <span className="inline-flex items-center">
                                                                    Status {sortField === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
                                                                </span>
                                                            </th>
                                                        )}
                                                        {showColumns.includes('score') && (
                                                            <th
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                                onClick={() => handleSort('score')}
                                                            >
                                                                <span className="inline-flex items-center">
                                                                    Score {sortField === 'score' && (sortDir === 'asc' ? '▲' : '▼')}
                                                                    <Tippy content="Lead Score: Calculated based on email, phone, status, notes, and source. Higher score = more qualified.">
                                                                        <span><Info size={14} className="ml-1 text-gray-400" /></span>
                                                                    </Tippy>
                                                                </span>
                                                            </th>
                                                        )}
                                                        {showColumns.includes('qualification') && (
                                                            <th
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                                onClick={() => handleSort('qualification')}
                                                            >
                                                                <span className="inline-flex items-center">
                                                                    Qualification {sortField === 'qualification' && (sortDir === 'asc' ? '▲' : '▼')}
                                                                    <Tippy content="Qualification: Hot (score ≥ 70), Warm (score ≥ 40), Cold (score < 40).">
                                                                        <span><Info size={14} className="ml-1 text-gray-400" /></span>
                                                                    </Tippy>
                                                                </span>
                                                            </th>
                                                        )}
                                                        {showColumns.includes('added_on') && (
                                                            <th
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                                                                onClick={() => handleSort('added_on')}
                                                            >
                                                                <span className="inline-flex items-center">
                                                                    Added On {sortField === 'added_on' && (sortDir === 'asc' ? '▲' : '▼')}
                                                                </span>
                                                            </th>
                                                        )}
                                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                {/* Table Body */}
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {/* Check if leads.data exists and has items */}
                                                    {filteredLeads.length > 0 ? (
                                                        filteredLeads.map((lead) => (
                                                            <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                                                {/* Name & Email Cell */}
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{lead.email || '-'}</div>
                                                                </td>
                                                                {showColumns.includes('title') && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{lead.title || '-'}</td>}
                                                                {showColumns.includes('positions') && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{lead.positions || '-'}</td>}
                                                                {showColumns.includes('tags') && (
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        {Array.isArray(lead.tags) && lead.tags.length > 0 ? (
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {lead.tags.map((tag, idx) => (
                                                                                    <span key={idx} className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full px-2 py-0.5 text-xs font-semibold">{tag}</span>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-400">-</span>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                {showColumns.includes('company') && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{lead.company || '-'}</td>}
                                                                {showColumns.includes('status') && (
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                            lead.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                                            lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                            lead.status === 'qualified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                            lead.status === 'won' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                                                            lead.status === 'lost' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                                        }`}>
                                                                            {leadStatusOptions.find(s => s.value === lead.status)?.label || lead.status}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                {showColumns.includes('score') && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{lead.score ?? '-'}</td>}
                                                                {showColumns.includes('qualification') && (
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <Tippy
                                                                            content={
                                                                                lead.qualification === 'Hot'
                                                                                    ? 'Hot: Highly qualified lead (score ≥ 70)'
                                                                                    : lead.qualification === 'Warm'
                                                                                    ? 'Warm: Moderately qualified lead (score ≥ 40)'
                                                                                    : 'Cold: Low qualification (score < 40)'
                                                                            }
                                                                        >
                                                                            <span
                                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                                    lead.qualification === 'Hot' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                                    lead.qualification === 'Warm' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                                }`}
                                                                            >
                                                                                {lead.qualification || '-'}
                                                                            </span>
                                                                        </Tippy>
                                                                    </td>
                                                                )}
                                                                {showColumns.includes('added_on') && (
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                        {new Date(lead.created_at).toLocaleDateString()}
                                                                    </td>
                                                                )}
                                                                {/* Actions Cell */}
                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                                    <div className="flex items-center justify-center space-x-2">
                                                                        {/* View Action */}
                                                                        <Link href={route('leads.show', lead.id)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="View">
                                                                            <Eye size={16} />
                                                                        </Link>
                                                                        {/* Edit Action */}
                                                                        <Link href={route('leads.edit', lead.id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Edit">
                                                                            <Pencil size={16} />
                                                                        </Link>
                                                                        {/* Delete Action */}
                                                                        <Link
                                                                            href={route('leads.destroy', lead.id)}
                                                                            method="delete"
                                                                            as="button"
                                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                            title="Delete"
                                                                            onBefore={() => confirm('Are you sure you want to delete this lead?')}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </Link>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        // Row shown if no leads are found
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                No leads found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                         {/* --- Pagination --- */}
                                         {leads && leads.links && leads.data.length > 0 && (
                                             <Pagination links={leads.links} /> // Pass the links array
                                         )}
                                         {/* --- End Pagination --- */}
                                    </div>
                                </>
                            )}
                        </div>
                    </main>
                     {/* Optional Footer (if not handled by layout) */}
                    {/* <footer className="..."> ... </footer> */}
                </div>
            </div>
        </>
        // </AuthenticatedLayout> // Close layout component if used
    );
}
