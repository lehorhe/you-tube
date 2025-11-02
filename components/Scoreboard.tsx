import React from 'react';
import Badge from './Badge';
import { 
    TrophyIcon, DocumentTextIcon, FireIcon, WnetLogo, 
    Badge1Icon, Badge3Icon, Badge5Icon, Badge10Icon, ViewsIcon, ChatBubbleLeftRightIcon, 
    ArrowTrendingUpIcon, LikesIcon, CommentsIcon, ShieldCheckIcon, BoltIcon, SubmarineBadgeIcon
} from './icons';
import type { Video, AnalysisResult } from '../types';
import { formatNumber, calculateEngagementRate } from '../utils';

interface ScoreboardProps {
    stats: {
        totalAnalyses: number;
        wnetAnalysesCount: number;
        comparativeAnalysesCount: number;
        topEngagementVideo: Video | null;
        uniqueChannels: string[];
        hasGoldenShot: boolean;
        hasDiscussionKing: boolean;
        hasViralAlert: boolean;
        analysisStreak: boolean;
        rank: { title: string; level: number };
        nextRank: { title: string; level: number; threshold: number } | null;
        hasLastWeekWnetAnalysis: boolean;
    };
    history: AnalysisResult[];
    onSelectAnalysis: (id: string) => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ stats, history, onSelectAnalysis }) => {
    const { 
        totalAnalyses, wnetAnalysesCount, comparativeAnalysesCount, topEngagementVideo,
        uniqueChannels, hasGoldenShot, hasDiscussionKing, hasViralAlert, analysisStreak, 
        rank, nextRank, hasLastWeekWnetAnalysis
    } = stats;

    const handleChannelClick = (channelName: string) => {
        const lastAnalysisForChannel = [...history].find(a => a.channelName === channelName);
        if (lastAnalysisForChannel) {
            onSelectAnalysis(lastAnalysisForChannel.id);
        }
    };

    const badges = [
        { 
            isUnlocked: wnetAnalysesCount > 0,
            icon: <WnetLogo className="h-5"/>,
            title: "Serce Lwa",
            unlockedDescription: "Odwaga! Zmierzyłeś się z sercem areny – kanałem Radio Wnet. Poznałeś jego siłę.",
            lockedDescription: "Poznaj serce areny. Zmierz się z kanałem Radio Wnet, aby zdobyć szacunek."
        },
        { 
            isUnlocked: comparativeAnalysesCount >= 1,
            icon: <Badge1Icon className="h-6 w-6"/>,
            title: "Przelana Krew",
            unlockedDescription: "Pierwsza bitwa za Tobą! Sprawdziłeś siłę rywala i poczułeś smak prawdziwej rywalizacji.",
            lockedDescription: "Rzuć pierwszą rękawicę. Zmierz się z dowolnym konkurentem."
        },
        { 
            isUnlocked: comparativeAnalysesCount >= 3,
            icon: <Badge3Icon className="h-6 w-6"/>,
            title: "Oczy Tygrysa",
            unlockedDescription: "Obserwujesz pole bitwy z uwagą. Trzech rywali padło pod Twoim analitycznym spojrzeniem.",
            lockedDescription: "Obserwuj pole bitwy. Pokonaj w analizie trzech różnych rywali."
        },
        { 
            isUnlocked: comparativeAnalysesCount >= 5,
            icon: <Badge5Icon className="h-6 w-6"/>,
            title: "Skóra Nosorożca",
            unlockedDescription: "Weteran wielu bitew. Pięciu rywali przeanalizowanych, a Ty stoisz niewzruszony.",
            lockedDescription: "Zahartuj się w boju. Przeanalizuj pięciu konkurentów."
        },
        { 
            isUnlocked: comparativeAnalysesCount >= 10,
            icon: <Badge10Icon className="h-6 w-6"/>,
            title: "Mądrość Sowy",
            unlockedDescription: "Dziesięciu rywali to dziesięć lekcji. Znasz ich strategie na wylot. Twoja wiedza jest potężna.",
            lockedDescription: "Zdobądź wiedzę o największych. Przeanalizuj dziesięciu rywali."
        },
        { 
            isUnlocked: hasGoldenShot,
            icon: <ViewsIcon className="h-6 w-6"/>,
            title: "Tytanowy Cios",
            unlockedDescription: "Trafiłeś w giganta! Twoja analiza namierzyła film-kolosa z ponad milionem wyświetleń.",
            lockedDescription: "Znajdź i przeanalizuj film-giganta z ponad 1,000,000 wyświetleń."
        },
        { 
            isUnlocked: hasDiscussionKing,
            icon: <ChatBubbleLeftRightIcon className="h-6 w-6"/>,
            title: "Głos Ludu",
            unlockedDescription: "Twoja analiza rozpętała burzę! Znalazłeś materiał, który poruszył tysiące serc i umysłów.",
            lockedDescription: "Znajdź materiał, który rozpala dyskusje (ponad 1,000 komentarzy)."
        },
        { 
            isUnlocked: hasViralAlert,
            icon: <ArrowTrendingUpIcon className="h-6 w-6"/>,
            title: "Iskra Geniuszu",
            unlockedDescription: "Dostrzegłeś ukryty płomień! Znalazłeś Shorta, który rozbłysnął viralowym ogniem.",
            lockedDescription: "Znajdź viralową iskrę – Shorta z zaangażowaniem ponad 5%."
        },
        { 
            isUnlocked: analysisStreak,
            icon: <BoltIcon className="h-6 w-6"/>,
            title: "Szał Bitewny",
            unlockedDescription: "Nie zwalniasz tempa! Pięć analiz w jednej sesji to dowód Twojej niepowstrzymanej pasji.",
            lockedDescription: "Wejdź w szał bitewny. Wykonaj 5 analiz w jednej sesji."
        },
    ];

    return (
        <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
                <TrophyIcon className="h-6 w-6 text-wnet-yellow" />
                <h2 className="text-lg font-bold text-slate-200">Tablica Wyników</h2>
            </div>
            
             <div className="bg-gradient-to-r from-neutral-800 to-neutral-800/50 p-4 rounded-lg mb-4 flex items-center gap-4 border border-neutral-700">
                <ShieldCheckIcon className="h-10 w-10 text-slate-400 flex-shrink-0" />
                <div>
                    <p className="text-xs text-slate-400">TWOJA RANGA</p>
                    <p className="font-bold text-xl text-white leading-tight">{rank.title}</p>
                    {nextRank && (
                        <p className="text-xs text-slate-500 leading-tight">
                            <strong className="font-bold text-slate-400">Następna:</strong> {nextRank.title}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-stretch gap-4">
                    <div className="relative group bg-neutral-800/50 p-4 rounded-lg flex items-center justify-center w-24 flex-shrink-0">
                        <SubmarineBadgeIcon 
                            active={hasLastWeekWnetAnalysis}
                            className={`h-12 w-12 transition-all duration-300 ${
                                hasLastWeekWnetAnalysis 
                                    ? '' 
                                    : 'text-slate-500'
                            }`}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <p className="font-bold">Raport Tygodniowy</p>
                            <p>Odznaka przyznawana za analizę kanału Radio Wnet za ostatni pełny tydzień.</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900"></div>
                        </div>
                    </div>

                    <div className="bg-neutral-800/50 p-4 rounded-lg flex-1">
                        <div className="flex items-center gap-3">
                            <DocumentTextIcon className="h-7 w-7 text-slate-400 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-slate-400">ANALIZY</p>
                                <p className="font-bold text-2xl text-white leading-tight">{totalAnalyses}</p>
                            </div>
                        </div>
                        {uniqueChannels.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-neutral-700/50">
                                <ul className="flex flex-wrap gap-x-3 gap-y-1">
                                    {uniqueChannels.map(name => (
                                        <li key={name}>
                                            <button 
                                                onClick={() => handleChannelClick(name)} 
                                                className="text-xs text-slate-400 hover:text-wnet-yellow lowercase transition-colors"
                                            >
                                                {name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-neutral-800/50 p-4 rounded-lg">
                     <div className="flex items-start gap-4">
                        <FireIcon className="h-7 w-7 text-red-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-400">Rekord Zaangażowania</p>
                            {topEngagementVideo ? (
                                <>
                                    <p className="font-bold text-2xl text-white leading-tight">{calculateEngagementRate(topEngagementVideo).toFixed(2)}%</p>
                                    <div className="mt-3 flex items-start gap-3">
                                        <a href={`https://www.youtube.com/watch?v=${topEngagementVideo.id}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 block rounded overflow-hidden w-24 aspect-video group">
                                            <img src={topEngagementVideo.snippet.thumbnails.medium.url} alt={topEngagementVideo.snippet.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        </a>
                                        <div className="text-xs text-slate-400 space-y-1">
                                            <div className="flex items-center gap-1.5"><ViewsIcon className="h-4 w-4 text-blue-400"/><span>{formatNumber(topEngagementVideo.statistics.viewCount)}</span></div>
                                            <div className="flex items-center gap-1.5"><LikesIcon className="h-4 w-4 text-wnet-yellow"/><span>{formatNumber(topEngagementVideo.statistics.likeCount)}</span></div>
                                            <div className="flex items-center gap-1.5"><CommentsIcon className="h-4 w-4 text-green-400"/><span>{formatNumber(topEngagementVideo.statistics.commentCount)}</span></div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="font-bold text-2xl text-white">--</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                 <h3 className="text-sm font-semibold text-slate-400 mb-3">Odznaki</h3>
                 <div className="grid grid-cols-4 gap-3">
                     {badges.map(badge => (
                         <Badge 
                            key={badge.title}
                            isUnlocked={badge.isUnlocked}
                            icon={badge.icon}
                            title={badge.title}
                            unlockedDescription={badge.unlockedDescription}
                            lockedDescription={badge.lockedDescription}
                         />
                     ))}
                 </div>
            </div>
        </div>
    );
};

export default Scoreboard;