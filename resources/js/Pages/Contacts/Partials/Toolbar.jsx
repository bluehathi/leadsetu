import React from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { Link } from '@inertiajs/react';
import ViewToggle from './ViewToggle';

export default function Toolbar({ setViewMode, viewMode, baseButtonClasses, activeViewButtonClasses, inactiveViewButtonClasses }) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Link
                href={route('contacts.create')}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium"
            >
                <Plus size={18} className="mr-2 -ml-1" />
                Add
            </Link>
            <Link
                href={route('contacts.import_excel')}
                className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-sm font-medium"
            >
                <RotateCcw size={18} className="mr-2 -ml-1" />
                Import Excel
            </Link>
            <ViewToggle
                setViewMode={setViewMode}
                viewMode={viewMode}
                baseButtonClasses={baseButtonClasses}
                activeViewButtonClasses={activeViewButtonClasses}
                inactiveViewButtonClasses={inactiveViewButtonClasses}
            />
        </div>
    );
}
