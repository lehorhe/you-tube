import React from 'react';
import type { AnalysisResult, AnalyzedVideo } from '../types';
import { HistoryIcon, ChannelIcon, CompareIcon, ViewsIcon, LikesIcon, CommentsIcon, EngagementIcon, CalendarIcon, ArrowDownTrayIcon } from './icons';
import { formatNumber, calculateEngagementRate } from '../utils';

interface HistorySidebarProps {
    history: AnalysisResult[];
    currentId: string | null;
    onSelect: (id: string) => void;
    onSelectVideo: (analysisId: string, videoId: string) => void;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onExport: () => void;
}

const formatPublicationDate = (isoString: string) => {
    const date = new Date(isoString);
    const dniTygodnia = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "So"];
    const dzienTygodnia = dniTygodnia[date.getDay()];
    const data = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
    const godzina = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    return `${dzienTygodnia}, ${data} ${godzina}`;
};

const VideoHistoryItem: React.FC<{ video: AnalyzedVideo['video'], analysisId: string, isSelected: boolean, onSelect: () => void, onToggle: () => void }> = ({ video, analysisId, isSelected, onSelect, onToggle }) => {
    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle();
    };

    return (
        <div className="ml-4 pl-4 border-l-2 border-neutral-800">
            <div className="flex items-start gap-2 text-left w-full p-2 rounded-lg transition-colors duration-200 hover:bg-neutral-800/50 cursor-pointer" onClick={onSelect}>
                <div className="pt-1" onClick={handleCheckboxClick}>
                    <input type="checkbox" checked={isSelected} readOnly className="form-checkbox h-4 w-4 bg-neutral-700 border-neutral-600 text-wnet-yellow focus:ring-wnet-yellow/50 rounded" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm leading-tight text-slate-300 line-clamp-2">{video.snippet.title}</p>
                    <div className="flex items-center text-slate-500 text-xs mt-1">
                        <CalendarIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                        <span>{formatPublicationDate(video.snippet.publishedAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-400 mt-2 text-xs">
                        <div className="flex items-center space-x-1.5"><ViewsIcon className="h-4 w-4 text-blue-400/80"/><span className="font-semibold">{formatNumber(video.statistics.viewCount)}</span></div>
                        <div className="flex items-center space-x-1.5"><LikesIcon className="h-4 w-4 text-wnet-yellow/80"/><span className="font-semibold">{formatNumber(video.statistics.likeCount)}</span></div>
                        <div className="flex items-center space-x-1.5"><CommentsIcon className="h-4 w-4 text-green-400/80"/><span className="font-semibold">{formatNumber(video.statistics.commentCount)}</span></div>
                        <div className="flex items-center space-x-1.5"><EngagementIcon className="h-4 w-4 text-red-400/80"/><span className="font-semibold">{calculateEngagementRate(video).toFixed(2)}%</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, currentId, onSelect, onSelectVideo, selectedIds, onToggleSelect, onExport }) => {
    
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
        <>
             <div className="flex items-center justify-between gap-3 mb-4 mt-6 pt-6 border-t border-neutral-800">
                <div className="flex items-center gap-3">
                    <HistoryIcon className="h-6 w-6 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-200">Historia Analiz</h2>
                </div>
                <button
                    onClick={onExport}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-2 text-sm bg-wnet-yellow text-black font-semibold px-3 py-1.5 rounded-md transition-opacity hover:opacity-90 disabled:bg-neutral-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Eksportuj
                </button>
            </div>
            
            {history.length === 0 ? (
                <div className="text-center text-sm text-slate-500 mt-8">
                    <p>Brak zapisanych analiz w tej sesji. Wygeneruj nową, aby ją tutaj zobaczyć.</p>
                </div>
            ) : (
                <ul className="space-y-1 overflow-y-auto flex-1 pr-1 -mr-2">
                    {history.map(item => {
                        const analyzedVideos = Object.values(item.analyzedVideos || {});
                        return (
                            <li key={item.id} className="bg-neutral-900/50 rounded-lg py-2">
                                <div className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-start gap-3 cursor-pointer ${
                                        item.id === currentId
                                            ? 'bg-wnet-yellow/10'
                                            : 'hover:bg-neutral-800'
                                    }`}
                                >
                                    <div className="pt-1" onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}>
                                         <input type="checkbox" checked={selectedIds.has(item.id)} readOnly className="form-checkbox h-4 w-4 bg-neutral-700 border-neutral-600 text-wnet-yellow focus:ring-wnet-yellow/50 rounded" />
                                    </div>
                                    <div onClick={() => onSelect(item.id)} className="flex-1 flex items-start gap-3">
                                        <div className="mt-1">
                                            {item.isComparative ? <CompareIcon className="h-5 w-5 flex-shrink-0 text-slate-300" /> : <ChannelIcon className="h-5 w-5 flex-shrink-0 text-slate-300" />}
                                        </div>
                                        <div>
                                            <p className={`font-semibold text-sm leading-tight line-clamp-2 ${item.id === currentId ? 'text-wnet-yellow' : 'text-slate-200'}`}>{item.channelName}</p>
                                            <p className={`text-xs ${item.id === currentId ? 'text-yellow-400/80' : 'text-slate-500'}`}>
                                                {formatDateRange(item.startDate, item.endDate)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {analyzedVideos.length > 0 && (
                                    <div className="mt-1 space-y-1 pr-1">
                                        {analyzedVideos.map(analyzedVideo => (
                                            <VideoHistoryItem
                                                key={analyzedVideo.video.id}
                                                video={analyzedVideo.video}
                                                analysisId={item.id}
                                                isSelected={selectedIds.has(`${item.id}-${analyzedVideo.video.id}`)}
                                                onSelect={() => onSelectVideo(item.id, analyzedVideo.video.id)}
                                                onToggle={() => onToggleSelect(`${item.id}-${analyzedVideo.video.id}`)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
             <style>{`
                .form-checkbox:checked {
                    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
                }
            `}</style>
        </>
    );
};

export default HistorySidebar;