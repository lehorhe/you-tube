import React from 'react';
import type { AnalysisResult } from '../types';
import { HistoryIcon, ChannelIcon, CompareIcon } from './icons';

interface HistorySidebarProps {
    history: AnalysisResult[];
    currentId: string | null;
    onSelect: (id: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, currentId, onSelect }) => {
    
    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const startDay = startDate.getDate().toString().padStart(2, '0');
        const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
        const endDay = endDate.getDate().toString().padStart(2, '0');
        const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
        return `${startDay}.${startMonth} - ${endDay}.${endMonth}`;
    };
    
    return (
        <aside className="w-64 bg-neutral-900/80 border-r border-neutral-800 p-4 h-screen sticky top-0 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <HistoryIcon className="h-6 w-6 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-200">Historia Analiz</h2>
            </div>
            
            {history.length === 0 ? (
                <div className="text-center text-sm text-slate-500 mt-8">
                    <p>Brak zapisanych analiz w tej sesji. Wygeneruj nową, aby ją tutaj zobaczyć.</p>
                </div>
            ) : (
                <ul className="space-y-2 overflow-y-auto flex-1">
                    {history.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => onSelect(item.id)}
                                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-start gap-3 ${
                                    item.id === currentId
                                        ? 'bg-wnet-yellow/10 text-wnet-yellow'
                                        : 'hover:bg-neutral-800 text-slate-300'
                                }`}
                            >
                                <div className="mt-1">
                                    {item.isComparative ? <CompareIcon className="h-5 w-5 flex-shrink-0" /> : <ChannelIcon className="h-5 w-5 flex-shrink-0" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm leading-tight line-clamp-2">{item.channelName}</p>
                                    <p className={`text-xs ${item.id === currentId ? 'text-yellow-400/80' : 'text-slate-500'}`}>
                                        {formatDateRange(item.startDate, item.endDate)}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
};

export default HistorySidebar;
