import React, { useState, useMemo } from 'react';
import type { Video } from '../types';
import { formatNumber, parseISO8601Duration, formatDuration, calculateEngagementRate } from '../utils';
import { LikesIcon, CommentsIcon, ViewsIcon, CalendarIcon, EngagementIcon, CheckCircleIcon } from './icons';

interface VideoStatsGridProps {
    videos: Video[];
    title: string;
    onVideoSelect: (video: Video) => void;
    analyzedVideoIds: string[];
}

type SortKey = 'views' | 'likes' | 'comments' | 'duration' | 'engagement';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'views', label: 'Wyświetlenia' },
    { key: 'likes', label: 'Polubienia' },
    { key: 'comments', label: 'Komentarze' },
    { key: 'duration', label: 'Długość' },
    { key: 'engagement', label: 'Zaangażowanie' },
];

const VideoStatsGrid: React.FC<VideoStatsGridProps> = ({ videos, title, onVideoSelect, analyzedVideoIds }) => {
    const [sortBy, setSortBy] = useState<SortKey>('views');

    const formatPublicationDate = (isoString: string) => {
        const date = new Date(isoString);
        const dniTygodnia = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "So"];
        const dzienTygodnia = dniTygodnia[date.getDay()];
        const data = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
        const godzina = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        return `${dzienTygodnia}, ${data} ${godzina}`;
    };
    
    const sortedVideos = useMemo(() => {
        const newVideos = [...videos];
        newVideos.sort((a, b) => {
            switch (sortBy) {
                case 'likes':
                    return parseInt(b.statistics.likeCount) - parseInt(a.statistics.likeCount);
                case 'comments':
                    return parseInt(b.statistics.commentCount) - parseInt(a.statistics.commentCount);
                case 'duration':
                    return parseISO8601Duration(b.contentDetails.duration) - parseISO8601Duration(a.contentDetails.duration);
                case 'engagement':
                    return calculateEngagementRate(b) - calculateEngagementRate(a);
                case 'views':
                default:
                    return parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount);
            }
        });
        return newVideos;
    }, [videos, sortBy]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                 <h3 className="text-2xl font-bold text-slate-100">{title}</h3>
                 <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setSortBy(opt.key)}
                            className={`px-3 py-1 rounded-full font-semibold transition-all duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-wnet-dark focus:ring-wnet-yellow ${
                                sortBy === opt.key
                                    ? 'bg-wnet-yellow text-black'
                                    : 'bg-neutral-700 hover:bg-neutral-600 text-slate-300'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                 </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedVideos.map(video => {
                    const isAnalyzed = analyzedVideoIds.includes(video.id);
                    return (
                        <div 
                            key={video.id} 
                            className="bg-neutral-900 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col cursor-pointer group"
                            onClick={() => onVideoSelect(video)}
                        >
                            <div className="relative">
                                <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} className={`w-full aspect-video object-cover transition-all duration-300 ${isAnalyzed ? 'grayscale group-hover:grayscale-0' : ''}`}/>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                                {isAnalyzed && (
                                    <div className="absolute top-2 left-2 bg-green-500/80 text-white p-1 rounded-full shadow-lg" title="Analiza gotowa">
                                        <CheckCircleIcon className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                                    {formatDuration(parseISO8601Duration(video.contentDetails.duration))}
                                </div>
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <h4 className={`font-bold text-lg mb-2 flex-grow group-hover:text-wnet-yellow transition-colors ${isAnalyzed ? 'text-slate-400' : 'text-slate-200'}`}>{video.snippet.title}</h4>
                                <div className="flex items-center text-slate-400 text-sm font-bold mb-3">
                                    <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>{formatPublicationDate(video.snippet.publishedAt)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-400 mt-auto pt-2 border-t border-neutral-800">
                                    <div className="flex items-center space-x-2">
                                        <ViewsIcon className="h-5 w-5 text-blue-400"/>
                                        <span className="font-semibold text-sm">{formatNumber(video.statistics.viewCount)}</span>
                                     </div>
                                    <div className="flex items-center space-x-2">
                                        <LikesIcon className="h-5 w-5 text-wnet-yellow"/>
                                        <span className="font-semibold text-sm">{formatNumber(video.statistics.likeCount)}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <CommentsIcon className="h-5 w-5 text-green-400"/>
                                        <span className="font-semibold text-sm">{formatNumber(video.statistics.commentCount)}</span>
                                    </div>
                                     <div className="flex items-center space-x-2">
                                        <EngagementIcon className="h-5 w-5 text-red-400"/>
                                        <span className="font-semibold text-sm">{calculateEngagementRate(video).toFixed(2)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VideoStatsGrid;