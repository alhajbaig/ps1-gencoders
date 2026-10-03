import React from 'react';
import type { BloodGroup } from '../../types';
import type { BloodRequestFilters } from '../../types/bloodRequest';
import { Search, X, Filter } from 'lucide-react';

interface RequestFiltersProps {
  filters: BloodRequestFilters;
  onChange: (filters: BloodRequestFilters) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export const RequestFilters: React.FC<RequestFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
}) => {
  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.bloodGroup !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.searchQuery.trim().length > 0;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, status: e.target.value as BloodRequestFilters['status'] });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, priority: e.target.value as BloodRequestFilters['priority'] });
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, bloodGroup: e.target.value as BloodRequestFilters['bloodGroup'] });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, dateRange: e.target.value as BloodRequestFilters['dateRange'] });
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-card space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input (Supports ID, Blood Group, Status, Priority) */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search request ID, blood group, status..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A] font-inter transition-all placeholder:text-slate-400"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="lg:col-span-2">
          <label htmlFor="filter-status" className="sr-only">Status</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={handleStatusChange}
            className="w-full py-2 px-3 text-xs font-inter bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="searching">Searching</option>
            <option value="matched">Matched</option>
            <option value="reserved">Reserved</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="lg:col-span-2">
          <label htmlFor="filter-priority" className="sr-only">Priority</label>
          <select
            id="filter-priority"
            value={filters.priority}
            onChange={handlePriorityChange}
            className="w-full py-2 px-3 text-xs font-inter bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        {/* Blood Group Dropdown */}
        <div className="lg:col-span-2">
          <label htmlFor="filter-group" className="sr-only">Blood Group</label>
          <select
            id="filter-group"
            value={filters.bloodGroup}
            onChange={handleGroupChange}
            className="w-full py-2 px-3 text-xs font-inter bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] cursor-pointer"
          >
            <option value="all">All Blood Groups</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        {/* Date Dropdown */}
        <div className="lg:col-span-2">
          <label htmlFor="filter-date" className="sr-only">Date</label>
          <select
            id="filter-date"
            value={filters.dateRange}
            onChange={handleDateChange}
            className="w-full py-2 px-3 text-xs font-inter bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Filter Status Summary & Reset Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono text-[#64748B]">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Showing <strong className="text-[#0F172A]">{filteredCount}</strong> of{' '}
            <strong className="text-[#0F172A]">{totalCount}</strong> requests
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#C1272D] hover:text-[#A61E24] font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
