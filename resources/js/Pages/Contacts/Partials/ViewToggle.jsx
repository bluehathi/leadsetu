import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export default function ViewToggle({ viewMode, setViewMode, baseButtonClasses, activeViewButtonClasses, inactiveViewButtonClasses }) {
    return (
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg ml-2">
            <button 
                onClick={() => setViewMode('grid')}
                className={`${baseButtonClasses} ${viewMode === 'grid' ? activeViewButtonClasses : inactiveViewButtonClasses}`}
                title="Grid View"
            >
                <LayoutGrid size={20} />
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`${baseButtonClasses} ${viewMode === 'list' ? activeViewButtonClasses : inactiveViewButtonClasses}`}
                title="List View"
            >
                <List size={20} />
            </button>
        </div>
    );
}
