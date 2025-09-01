'use client';

import { ContentType } from '@/generated/prisma';
import { Filter, SortAsc, SortDesc, Calendar, FileType, HardDrive } from 'lucide-react';

interface ContentFiltersProps {
  filters: {
    search: string;
    type: ContentType | 'all';
    sortBy: 'createdAt' | 'name' | 'fileSize';
    sortOrder: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
}

export function ContentFilters({ filters, onFiltersChange }: ContentFiltersProps) {
  const contentTypes = [
    { value: 'all', label: 'All Types' },
    { value: ContentType.IMAGE, label: 'Images' },
    { value: ContentType.VIDEO, label: 'Videos' },
    { value: ContentType.PDF, label: 'PDFs' },
    { value: ContentType.URL, label: 'URLs' },
    { value: ContentType.YOUTUBE, label: 'YouTube' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date', icon: Calendar },
    { value: 'name', label: 'Name', icon: FileType },
    { value: 'fileSize', label: 'Size', icon: HardDrive },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {/* Type Filter */}
      <div className="relative">
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
          className="appearance-none px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-orange-500 cursor-pointer"
        >
          {contentTypes.map((type) => (
            <option key={type.value} value={type.value} className="bg-brand-gray-900 text-white">
              {type.label}
            </option>
          ))}
        </select>
        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none" />
      </div>

      {/* Sort By */}
      <div className="relative">
        <select
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
          className="appearance-none px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-orange-500 cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-brand-gray-900 text-white">
              Sort by {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {sortOptions.find(o => o.value === filters.sortBy)?.icon && (
            <div className="text-white/50 w-4 h-4">
              {(() => {
                const Icon = sortOptions.find(o => o.value === filters.sortBy)!.icon;
                return <Icon className="w-4 h-4" />;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Sort Order */}
      <button
        onClick={() => onFiltersChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
        className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition"
        title={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
      >
        {filters.sortOrder === 'asc' ? (
          <SortAsc className="w-5 h-5" />
        ) : (
          <SortDesc className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}