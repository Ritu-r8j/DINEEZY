import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    label: string;
    value: number;
    subtext: string;
    icon: LucideIcon;
    color: string;
    isActive?: boolean;
    onClick?: () => void;
}

export default function StatsCard({ label, value, subtext, icon: Icon, color, isActive, onClick }: StatsCardProps) {
    const getColorClasses = () => {
        switch (color) {
            case 'blue':
                return {
                    icon: 'text-blue-400',
                    border: isActive ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' : 'border-gray-800 hover:border-gray-700',
                    text: isActive ? 'text-blue-400' : 'text-white'
                };
            case 'amber':
                return {
                    icon: 'text-amber-400',
                    border: isActive ? 'border-amber-500/50 shadow-lg shadow-amber-500/20' : 'border-gray-800 hover:border-gray-700',
                    text: isActive ? 'text-amber-400' : 'text-white'
                };
            case 'emerald':
                return {
                    icon: 'text-emerald-400',
                    border: isActive ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/20' : 'border-gray-800 hover:border-gray-700',
                    text: isActive ? 'text-emerald-400' : 'text-white'
                };
            case 'red':
                return {
                    icon: 'text-red-400',
                    border: isActive ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 'border-gray-800 hover:border-gray-700',
                    text: isActive ? 'text-red-400' : 'text-white'
                };
            case 'purple':
                return {
                    icon: 'text-purple-400',
                    border: 'border-gray-800',
                    text: 'text-white'
                };
            case 'pink':
                return {
                    icon: 'text-pink-400',
                    border: 'border-gray-800',
                    text: 'text-white'
                };
            default:
                return {
                    icon: 'text-gray-400',
                    border: 'border-gray-800',
                    text: 'text-white'
                };
        }
    };

    const colors = getColorClasses();
    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            onClick={onClick}
            className={`bg-[#151d2f] rounded-lg sm:rounded-xl p-3 sm:p-4 border transition-all ${
                onClick ? 'hover:scale-105 cursor-pointer' : ''
            } ${colors.border}`}
        >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-gray-400">{label}</span>
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${colors.icon}`} />
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${colors.text}`}>
                {value}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">{subtext}</div>
        </Component>
    );
}
