import React, { useMemo } from 'react';
import type { Video, AnalysisResult } from '../types';
import { formatNumber, formatCurrency } from '../utils';
import StatCard from './StatCard';
import { VideosIcon, LiveIcon, ShortsIcon, MoneyIcon } from './icons';

interface PeriodSummaryStatsProps {
    videoData: {
        longForm: Video[];
        shorts: Video[];
        liveStreams: Video[];
    };
    startDate: string;
    endDate: string;
    estimatedRevenue: AnalysisResult['estimatedRevenue'];
}

const PeriodSummaryStats: React.FC<PeriodSummaryStatsProps> = ({ videoData, startDate, endDate, estimatedRevenue }) => {
    const totalViews = useMemo(() => {
        const calculateTotal = (videos: Video[]) => 
            videos.reduce((sum, video) => sum + parseInt(video.statistics.viewCount, 10), 0);
        
        return {
            longForm: calculateTotal(videoData.longForm),
            shorts: calculateTotal(videoData.shorts),
            liveStreams: calculateTotal(videoData.liveStreams),
        };
    }, [videoData]);

    const formatDateRange = (start: string, end: string) => {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const startDateFormatted = new Date(start).toLocaleDateString('pl-PL', options);
        const endDateFormatted = new Date(end).toLocaleDateString('pl-PL', options);
        return `${startDateFormatted} - ${endDateFormatted}`;
    };

    const hasAnyViews = totalViews.longForm > 0 || totalViews.shorts > 0 || totalViews.liveStreams > 0;

    if (!hasAnyViews) {
        return null;
    }

    return (
        <div className="mb-12">
            <h3 className="text-2xl font-bold text-slate-100 mb-2">Podsumowanie okresu</h3>
            <p className="text-slate-400 mb-6">{formatDateRange(startDate, endDate)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    icon={<VideosIcon className="h-8 w-8 text-green-400" />} 
                    label="Wyświetlenia filmów" 
                    value={formatNumber(totalViews.longForm)} 
                />
                <StatCard 
                    icon={<ShortsIcon className="h-8 w-8 text-purple-400" />} 
                    label="Wyświetlenia Shorts" 
                    value={formatNumber(totalViews.shorts)} 
                />
                <StatCard 
                    icon={<LiveIcon className="h-8 w-8 text-red-400" />} 
                    label="Wyświetlenia transmisji" 
                    value={formatNumber(totalViews.liveStreams)} 
                />
                 <StatCard 
                    icon={<MoneyIcon className="h-8 w-8 text-wnet-yellow" />} 
                    label="Szacowany przychód" 
                    value={formatCurrency(estimatedRevenue.total)} 
                />
            </div>
        </div>
    );
};

export default PeriodSummaryStats;