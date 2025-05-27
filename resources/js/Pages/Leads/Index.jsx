import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit2, Trash2, CheckCircle2, XCircle, Search, Filter as FilterIcon, RotateCcw, UserCircle2, Briefcase, Phone, Mail, Building, Tag, DollarSign, CalendarDays, TrendingUp, Flame, Star, SlidersHorizontal } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import Select from 'react-select';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const getLeadAvatarPlaceholder = (name) => {
    const colors = [
        'bg-red-400', 'bg-green-400', 'bg-blue-400', 'bg-yellow-400', 
        'bg-purple-400', 'bg-indigo-400', 'bg-pink-400', 'bg-teal-400',
        'bg-cyan-400', 'bg-orange-400', 'bg-lime-400', 'bg-emerald-400'
    ];
    if (!name || name.trim() === '') name = "L"; 
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return {
        colorClass: `${color} text-white`,
        initials: initials || name.charAt(0).toUpperCase()
    };
};

const statusColorMap = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
    qualified: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
    unqualified: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    lost: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200',
    won: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
    default: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
};

const qualificationColorMap = {
    Hot: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200',
    Warm: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200',
    Cold: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
    default: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
};


export default function LeadsIndex({ user, leads, statusOptions: propStatusOptions, methodOptions: propMethodOptions, owners: propOwners }) {
    const { props } = usePage();
    const flash = props.flash || {};

    const queryParams = new URLSearchParams(window.location.search);
    
    const leadStatusOptions = propStatusOptions || [];
    const leadMethodOptions = propMethodOptions || [];
    const ownersOptions = propOwners ? propOwners.map(o => ({ value: String(o.id), label: o.name })) : [];

    const [searchText, setSearchText] = useState(queryParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(
        queryParams.getAll('status[]').map(val => leadStatusOptions.find(opt => opt.value === val)).filter(Boolean) || []
    );
    const [qualificationFilter, setQualificationFilter] = useState(
        queryParams.getAll('qualification[]').map(val => ({ value: val, label: val })) || []
    ); 
    const [ownerFilter, setOwnerFilter] = useState(
        queryParams.getAll('owner[]').map(val => ownersOptions.find(opt => opt.value === val)).filter(Boolean) || []
    );
    const [dateFrom, setDateFrom] = useState(queryParams.get('date_from') || '');
    const [dateTo, setDateTo] = useState(queryParams.get('date_to') || '');
    const [dealMin, setDealMin] = useState(queryParams.get('deal_min') || '');
    const [dealMax, setDealMax] = useState(queryParams.get('deal_max') || '');
    const [tagsFilter, setTagsFilter] = useState(queryParams.get('tags') || '');
    
    const [isListMounted, setIsListMounted] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false); // State for filter panel visibility

    useEffect(() => {
        const timer = setTimeout(() => setIsListMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const displayedLeads = leads && leads.data ? leads.data : [];

    const handleSearchInputChange = (e) => setSearchText(e.target.value);

    const applyFilters = () => {
        const params = {};
        if (searchText) params.search = searchText;
        if (statusFilter.length > 0) params['status[]'] = statusFilter.map(s => s.value);
        if (qualificationFilter.length > 0) params['qualification[]'] = qualificationFilter.map(q => q.value);
        if (ownerFilter.length > 0) params['owner[]'] = ownerFilter.map(o => o.value);
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (dealMin) params.deal_min = dealMin;
        if (dealMax) params.deal_max = dealMax;
        if (tagsFilter) params.tags = tagsFilter;
        
        router.get(route('leads.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearchText('');
        setStatusFilter([]);
        setQualificationFilter([]);
        setOwnerFilter([]);
        setDateFrom('');
        setDateTo('');
        setDealMin('');
        setDealMax('');
        setTagsFilter('');
        router.get(route('leads.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };
    
    const handleDelete = (leadId, leadName) => {
        if (confirm(`Are you sure you want to delete the lead "${leadName}"? This action cannot be undone.`)) {
            router.delete(route('leads.destroy', leadId), {
                preserveScroll: true,
            });
        }
    };
    
    const qualificationOptions = [
        { value: 'Hot', label: 'Hot' },
        { value: 'Warm', label: 'Warm' },
        { value: 'Cold', label: 'Cold' }
    ];

    const reactSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '42px',
            borderColor: state.isFocused ? '#3b82f6' : (props.errors && Object.keys(props.errors).length > 0 ? '#ef4444' : '#d1d5db'),
            '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#a5b4fc' },
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : null,
            borderRadius: '0.5rem',
            backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : 'white', 
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '0.5rem',
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white', 
            zIndex: 50,
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#3b82f6' : (state.isFocused ? (document.documentElement.classList.contains('dark') ? '#374151' : '#eff6ff') : 'transparent'), 
            color: state.isSelected ? 'white' : (document.documentElement.classList.contains('dark') ? '#d1d5db' : '#1f2937'), 
            '&:hover': {
                 backgroundColor: state.isSelected ? '#2563eb' : (document.documentElement.classList.contains('dark') ? '#4b5563' : '#dbeafe'), 
            }
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#4b5563' : '#e0e7ff', 
            borderRadius: '0.25rem',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#3730a3', 
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4338ca', 
            '&:hover': {
                backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#c7d2fe', 
                color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#312e81', 
            },
        }),
        placeholder: (provided) => ({
            ...provided,
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280', 
        }),
         input: (provided) => ({
            ...provided,
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827', 
        }),
        singleValue: (provided) => ({
            ...provided,
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
        }),
    };


    return (
        <AuthenticatedLayout user={user} title="Leads">
            <Head title="Leads" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('leads.create')}
                            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium"
                        >
                            <Plus size={18} className="mr-2 -ml-1" />
                            Add Lead
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 shadow-sm hover:shadow-md"
                        >
                            <SlidersHorizontal size={16} className="mr-2" />
                            {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>
                    <div className="relative w-full sm:w-auto sm:max-w-xs md:max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                            placeholder="Search leads..."
                            value={searchText}
                            onChange={handleSearchInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                </div>

                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {showFilterPanel && (
                    <div className="mb-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300 ease-in-out">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                            <div className="min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <Select isMulti options={leadStatusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Any Status" styles={reactSelectStyles} />
                            </div>
                            <div className="min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Qualification</label>
                                <Select isMulti options={qualificationOptions} value={qualificationFilter} onChange={setQualificationFilter} placeholder="Any Qualification" styles={reactSelectStyles} />
                            </div>
                            <div className="min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Owner</label>
                                <Select isMulti options={ownersOptions} value={ownerFilter} onChange={setOwnerFilter} placeholder="Any Owner" styles={reactSelectStyles} />
                            </div>
                             <div className="min-w-[180px]">
                                <label htmlFor="tagsFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                                <input id="tagsFilter" type="text" value={tagsFilter} onChange={e => setTagsFilter(e.target.value)} placeholder="e.g. important, follow-up" className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md h-[42px]" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md h-[42px]" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md h-[42px]" />
                            </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Value</label>
                                    <input type="number" value={dealMin} onChange={e => setDealMin(e.target.value)} placeholder="Min" className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md h-[42px]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Value</label>
                                    <input type="number" value={dealMax} onChange={e => setDealMax(e.target.value)} placeholder="Max" className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md h-[42px]" />
                                </div>
                            </div>
                            <div className="flex items-end gap-3 md:col-span-full lg:col-span-1 xl:col-auto justify-end w-full">
                                <button type="button" onClick={applyFilters} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-150 h-[42px]">
                                    <FilterIcon size={16} className="mr-2"/>Apply
                                </button>
                                <button type="button" onClick={resetFilters} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm hover:shadow-md transition-all duration-150 h-[42px]">
                                    <RotateCcw size={16} className="mr-2"/>Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {displayedLeads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {displayedLeads.map((lead, index) => {
                            const avatar = getLeadAvatarPlaceholder(lead.name);
                            const statusDisplay = leadStatusOptions.find(s => s.value === lead.status)?.label || lead.status;
                            return (
                                <div 
                                    key={lead.id} 
                                    className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 flex flex-col justify-between transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5
                                                ${isListMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                                    style={{ animationDelay: isListMounted ? `${index * 0.06}s` : '0s' }}
                                >
                                    <div>
                                        <div className="flex items-start mb-4">
                                            <div className={`w-16 h-16 ${avatar.colorClass} rounded-lg flex items-center justify-center font-semibold text-2xl mr-4 flex-shrink-0 shadow-md`}>
                                                {avatar.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate" title={lead.name}>
                                                    {lead.name}
                                                </h3>
                                                {lead.company && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center" title={lead.company}>
                                                        <Briefcase size={14} className="mr-1.5 flex-shrink-0 text-gray-400" /> {lead.company}
                                                    </p>
                                                )}
                                                {lead.title && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5" title={lead.title}>
                                                        {lead.title}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                                            {lead.email && (
                                                <a href={`mailto:${lead.email}`} className="flex items-center group hover:text-blue-600 dark:hover:text-blue-400" title={lead.email} onClick={(e) => e.stopPropagation()}>
                                                    <Mail size={14} className="mr-2.5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 flex-shrink-0" />
                                                    <span className="truncate group-hover:underline">{lead.email}</span>
                                                </a>
                                            )}
                                            {lead.phone && (
                                                <p className="flex items-center" title={`Phone: ${lead.phone}`}>
                                                    <Phone size={14} className="mr-2.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                    {lead.phone}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Tippy content={`Status: ${statusDisplay}`}>
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[lead.status] || statusColorMap.default}`}>
                                                    {statusDisplay}
                                                </span>
                                            </Tippy>
                                            {lead.qualification && (
                                                <Tippy content={`Qualification: ${lead.qualification}`}>
                                                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${qualificationColorMap[lead.qualification] || qualificationColorMap.default}`}>
                                                        {lead.qualification === 'Hot' && <Flame size={12} className="mr-1" />}
                                                        {lead.qualification === 'Warm' && <TrendingUp size={12} className="mr-1" />}
                                                        {lead.qualification === 'Cold' && <Star size={12} className="mr-1" />} 
                                                        {lead.qualification}
                                                    </span>
                                                </Tippy>
                                            )}
                                            {lead.score !== null && lead.score !== undefined && (
                                                <Tippy content={`Lead Score: ${lead.score}`}>
                                                    <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 items-center">
                                                        <Star size={12} className="mr-1 text-yellow-500" /> Score: {lead.score}
                                                    </span>
                                                </Tippy>
                                            )}
                                        </div>
                                        
                                        {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {lead.tags.slice(0, 3).map((tag, idx) => ( 
                                                        <span key={idx} className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md px-2 py-0.5 text-xs font-medium">{tag}</span>
                                                    ))}
                                                    {lead.tags.length > 3 && (
                                                         <Tippy content={lead.tags.slice(3).join(', ')}>
                                                            <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md px-2 py-0.5 text-xs font-medium">+{lead.tags.length - 3} more</span>
                                                        </Tippy>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1">
                                            <CalendarDays size={12} className="mr-1.5 flex-shrink-0" /> Added: {new Date(lead.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700/60 flex items-center justify-end space-x-2">
                                        <Tippy content="View Lead"><Link href={route('leads.show', lead.id)} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-700/50"><Eye size={18} /></Link></Tippy>
                                        <Tippy content="Edit Lead"><Link href={route('leads.edit', lead.id)} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-700/50"><Edit2 size={18} /></Link></Tippy>
                                        <Tippy content="Delete Lead"><button onClick={() => handleDelete(lead.id, lead.name)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-700/50"><Trash2 size={18} /></button></Tippy>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                     <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <Search size={60} className="mx-auto mb-6 text-gray-400 dark:text-gray-500" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                            {queryParams.toString() ? 'No leads match your criteria.' : 'No leads found.'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2.5">
                            {queryParams.toString() ? 'Try adjusting your search or filter options.' : 'Get started by adding a new lead.'}
                        </p>
                        {!queryParams.toString() && (
                            <Link
                                href={route('leads.create')}
                                className="mt-8 inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                            >
                                <Plus size={18} className="mr-2" /> Add New Lead
                            </Link>
                        )}
                    </div>
                )}

                {leads && leads.links && leads.data && leads.data.length > 0 && (
                     <div className="mt-8">
                        <Pagination links={leads.links} />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
