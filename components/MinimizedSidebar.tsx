import React from 'react';
import Badge from './Badge';
import { 
    HistoryIcon, 
    WnetLogo, 
    Badge1Icon, Badge3Icon, Badge5Icon, Badge10Icon, 
    ViewsIcon, ChatBubbleLeftRightIcon, ArrowTrendingUpIcon, 
    BoltIcon, SubmarineBadgeIcon, ChevronDoubleRightIcon,
    ArrowDownTrayIcon, DocumentTextIcon, FireIcon
} from './icons';
import RankIcon from './RankIcon';
import type { AnalysisResult } from '../types';

interface MinimizedSidebarProps {
    stats: {
        totalAnalyses: number;
        wnetAnalysesCount: number;
        comparativeAnalysesCount: number;
        highestEngagementRate: number;
        hasGoldenShot: boolean;
        hasDiscussionKing: boolean;
        hasViralAlert: boolean;
        analysisStreak: boolean;
        rank: { title: string; level: number };
        hasLastWeekWnetAnalysis: boolean;
    };
    history: AnalysisResult[];
    onExport: () => void;
    onToggle: () => void;
}

const IconContainer: React.FC<{ children: React.ReactNode, title: string, subtitle?: string }> = ({ children, title, subtitle }) => (
    <div className="relative group flex flex-col items-center">
        {children}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-48 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            <p className="font-bold">{title}</p>
            {subtitle && <p>{subtitle}</p>}
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-neutral-900"></div>
        </div>
    </div>
);

const MinimizedSidebar: React.FC<MinimizedSidebarProps> = ({ stats, history, onExport, onToggle }) => {
    
    const badges = [
        { isUnlocked: stats.wnetAnalysesCount > 0, icon: <WnetLogo className="h-5"/>, title: "Analityk Wnet" },
        { isUnlocked: stats.comparativeAnalysesCount >= 1, icon: <Badge1Icon className="h-6 w-6"/>, title: "Pierwszy Krok" },
        { isUnlocked: stats.comparativeAnalysesCount >= 3, icon: <Badge3Icon className="h-6 w-6"/>, title: "Dociekliwy Analityk" },
        { isUnlocked: stats.comparativeAnalysesCount >= 5, icon: <Badge5Icon className="h-6 w-6"/>, title: "Weteran Rynku" },
        { isUnlocked: stats.comparativeAnalysesCount >= 10, icon: <Badge10Icon className="h-6 w-6"/>, title: "Mistrz Benchmarku" },
        { isUnlocked: stats.hasGoldenShot, icon: <ViewsIcon className="h-6 w-6"/>, title: "Złoty Strzał" },
        { isUnlocked: stats.hasDiscussionKing, icon: <ChatBubbleLeftRightIcon className="h-6 w-6"/>, title: "Król Dyskusji" },
        { isUnlocked: stats.hasViralAlert, icon: <ArrowTrendingUpIcon className="h-6 w-6"/>, title: "Viral Alert" },
        { isUnlocked: stats.analysisStreak, icon: <BoltIcon className="h-6 w-6"/>, title: "Analityczna Seria" },
    ];

    const unlockedBadges = badges.filter(b => b.isUnlocked);

    return (
        <div className="flex flex-col items-center h-full p-3 text-slate-400">
            <button 
                onClick={onToggle} 
                className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-neutral-800 hover:text-wnet-yellow transition-colors"
                title="Rozszerz panel"
            >
                <ChevronDoubleRightIcon className="h-6 w-6" />
            </button>

            <div className="w-full h-px bg-neutral-800 my-2"></div>

            <div className="flex flex-col items-center gap-y-5">
                <IconContainer title={stats.rank.title} subtitle="Twoja Ranga">
                    <RankIcon level={stats.rank.level} className="h-8 w-8 text-slate-300" />
                </IconContainer>
                
                <IconContainer title="Raport Tygodniowy" subtitle={stats.hasLastWeekWnetAnalysis ? "Odblokowano!" : "Zablokowana"}>
                    <SubmarineBadgeIcon active={stats.hasLastWeekWnetAnalysis} className={`h-6 transition-all duration-300 ${!stats.hasLastWeekWnetAnalysis && 'text-slate-600'}`} />
                </IconContainer>

                <IconContainer title={`${stats.totalAnalyses} Analiz`} subtitle="Łączna liczba wykonanych analiz">
                     <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-7 w-7"/>
                        <span className="font-bold text-lg">{stats.totalAnalyses}</span>
                    </div>
                </IconContainer>

                <IconContainer title="Najwyższe Zaangażowanie" subtitle={`${stats.highestEngagementRate.toFixed(2)}%`}>
                    <div className="flex items-center gap-2">
                        <FireIcon className="h-7 w-7 text-red-400"/>
                        <span className="font-bold text-lg">{stats.highestEngagementRate.toFixed(1)}%</span>
                    </div>
                </IconContainer>
            </div>
            
            <div className="w-full h-px bg-neutral-800 my-4"></div>

            {unlockedBadges.length > 0 && (
                 <div className="flex-1 flex flex-col items-center gap-y-4 overflow-y-auto w-full py-2">
                    {unlockedBadges.map(badge => (
                         <IconContainer key={badge.title} title={badge.title}>
                             <div className="text-wnet-yellow">
                                {React.cloneElement(badge.icon, { className: 'h-6 w-6' })}
                            </div>
                        </IconContainer>
                    ))}
                </div>
            )}
           
            <div className="mt-auto flex flex-col items-center gap-y-2 pt-4 border-t border-neutral-800 w-full">
                <button 
                    className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-neutral-800 hover:text-wnet-yellow transition-colors"
                    title="Historia Analiz"
                    onClick={() => onToggle()} // Also expands sidebar
                >
                    <HistoryIcon className="h-7 w-7" />
                </button>
                <button
                    onClick={onExport}
                    disabled={history.length === 0}
                    className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-neutral-800 hover:text-wnet-yellow transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
                    title="Eksportuj Zaznaczone"
                >
                    <ArrowDownTrayIcon className="h-7 w-7" />
                </button>
            </div>
        </div>
    );
};

export default MinimizedSidebar;
