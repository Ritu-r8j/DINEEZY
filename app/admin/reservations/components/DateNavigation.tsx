import { Calendar, ChevronLeft, ChevronRight, Search, List, Grid3x3, Clock, LayoutGrid } from 'lucide-react';

interface DateNavigationProps {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    formatDate: (date: string) => string;
    stats: { total: number };
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    viewMode: 'list' | 'grid' | 'timeline' | 'tables';
    setViewMode: (mode: 'list' | 'grid' | 'timeline' | 'tables') => void;
}

export default function DateNavigation({
    selectedDate,
    setSelectedDate,
    formatDate,
    stats,
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode
}: DateNavigationProps) {
    const changeDate = (days: number) => {
        const current = new Date(selectedDate);
        current.setDate(current.getDate() + days);
        setSelectedDate(current.toISOString().split('T')[0]);
    };

    return (
        <div className="bg-[#151d2f] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-800 mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:gap-4">
                {/* Date Picker */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                        </button>
                        <div className="flex items-center gap-2 sm:gap-3 flex-1">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 flex-shrink-0" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 flex-1 min-w-0"
                            />
                            <div className="text-xs sm:text-sm hidden md:block">
                                <div className="font-semibold text-white whitespace-nowrap">{formatDate(selectedDate)}</div>
                                <div className="text-gray-400 whitespace-nowrap">{stats.total} reservations</div>
                            </div>
                        </div>
                        <button
                            onClick={() => changeDate(1)}
                            className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                        >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500/10 text-orange-500 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-500/20 transition-colors border border-orange-500/20 whitespace-nowrap"
                    >
                        Today
                    </button>
                </div>

                {/* Mobile Date Info */}
                <div className="md:hidden text-xs text-center">
                    <div className="font-semibold text-white">{formatDate(selectedDate)}</div>
                    <div className="text-gray-400">{stats.total} reservations</div>
                </div>

                {/* Search & View Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700 self-center">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 sm:p-2 rounded transition-colors ${
                                viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                            title="List View"
                        >
                            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 sm:p-2 rounded transition-colors ${
                                viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                            title="Grid View"
                        >
                            <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`p-1.5 sm:p-2 rounded transition-colors ${
                                viewMode === 'timeline' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                            title="Timeline View"
                        >
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('tables')}
                            className={`p-1.5 sm:p-2 rounded transition-colors ${
                                viewMode === 'tables' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                            title="Table Management"
                        >
                            <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
