import React from 'react';
import { Mail as MailIcon, Phone as PhoneIcon, Briefcase as BriefcaseIcon, AlignLeft, Building } from 'lucide-react';

export default function ContactFormFields({ data, setData, errors, companies, companyList, showNewCompany, setShowNewCompany, newCompanyName, setNewCompanyName, creatingCompany, companyError, handleCreateCompany }) {
    return (
        <>
            <div>
                <label htmlFor="name" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                    Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                    type="text" 
                    id="name"
                    value={data.name} 
                    onChange={e => setData('name', e.target.value)} 
                    className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md" 
                    required 
                    placeholder="e.g., Jane Doe"
                />
                {errors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="email" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                        <MailIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Email Address
                    </label>
                    <input 
                        type="email" 
                        id="email"
                        value={data.email} 
                        onChange={e => setData('email', e.target.value)} 
                        className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md" 
                        placeholder="e.g., jane.doe@example.com"
                    />
                    {errors.email && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email}</div>}
                </div>
                <div>
                    <label htmlFor="phone" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                        <PhoneIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Phone Number
                    </label>
                    <input 
                        type="text" 
                        id="phone"
                        value={data.phone} 
                        onChange={e => setData('phone', e.target.value)} 
                        className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md" 
                        placeholder="e.g., (123) 456-7890"
                    />
                    {errors.phone && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.phone}</div>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="company_id" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                        <Building size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Company <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                        id="company_id"
                        value={data.company_id || ''}
                        onChange={e => setData('company_id', e.target.value)}
                        className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md appearance-none"
                        required
                        disabled={showNewCompany}
                    >
                        <option value="">Select a company</option>
                        {companyList.map(company => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                    </select>
                    {errors.company_id && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.company_id}</div>}
                    <button
                        type="button"
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        onClick={() => setShowNewCompany(v => !v)}
                    >
                        {showNewCompany ? 'Cancel' : '+ Add new company'}
                    </button>
                    {showNewCompany && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col gap-2">
                            <label htmlFor="new_company_name" className="text-xs font-medium text-gray-700 dark:text-gray-300">Company Name <span className="text-red-500">*</span></label>
                            <input
                                id="new_company_name"
                                type="text"
                                value={newCompanyName}
                                onChange={e => setNewCompanyName(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700/50 text-sm"
                                placeholder="e.g., New Company Inc."
                                disabled={creatingCompany}
                            />
                            {companyError && <div className="text-xs text-red-500 mt-1">{companyError}</div>}
                            <button
                                type="button"
                                className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-60"
                                disabled={creatingCompany}
                                onClick={handleCreateCompany}
                            >
                                {creatingCompany ? 'Creating...' : 'Create & Select'}
                            </button>
                        </div>
                    )}
                </div>
                <div>
                    <label htmlFor="title" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                        <BriefcaseIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Job Title (Optional)
                    </label>
                    <input 
                        type="text" 
                        id="title"
                        value={data.title} 
                        onChange={e => setData('title', e.target.value)} 
                        className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md" 
                        placeholder="e.g., Marketing Manager"
                    />
                    {errors.title && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.title}</div>}
                </div>
            </div>
            <div>
                <label htmlFor="notes" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                    <AlignLeft size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Notes (Optional)
                </label>
                <textarea 
                    id="notes"
                    rows="4"
                    value={data.notes} 
                    onChange={e => setData('notes', e.target.value)} 
                    className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                    placeholder="e.g., Met at the tech conference, interested in our new product..."
                ></textarea>
                {errors.notes && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.notes}</div>}
            </div>
        </>
    );
}
