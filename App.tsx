import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Channel, Video, Playlist, AnalysisResult, AnalyzedVideo } from './types';
import { getChannelStats, getChannelVideos, getChannelPlaylists } from './services/youtubeService';
import { generateChannelSummary, updateChannelSummaryWithVideoInsights, generateUpdateChangelog, generateLectorSummary, refineAnalysis } from './services/geminiService';
import { exportAnalysesToHTML } from './services/exportService';
import ChannelHeader from './components/ChannelHeader';
import VideoStatsGrid from './components/VideoStatsGrid';
import AISummary from './components/AISummary';
import VideoDetailView from './components/VideoDetailView';
import { WnetLogo } from './components/icons';
import QuickNav from './components/QuickNav';
import HistorySidebar from './components/HistorySidebar';
import AnalysisProgress from './components/AnalysisProgress';
import Scoreboard from './components/Scoreboard';
import { calculateEngagementRate } from './utils';
import Controls from './components/Controls';
import MinimizedSidebar from './components/MinimizedSidebar';
import { ChevronDoubleLeftIcon } from './components/icons';
import Footer from './components/Footer';


const PREDEFINED_CHANNELS = [
    { id: 'UCMA-v2JV_9ZYNoY4uY4mRWA', name: 'Radio Wnet' },
    { id: 'UClhEl4bMD8_escGCCTmRAYg', name: 'Kanał Zero' },
    { id: 'UCgEJqzJA106dMXQg8mcfgRA', name: 'Super Ring' },
    { id: 'UCc282c_TN8xIba_Z6GaDnQw', name: 'Telewizja Republika' },
    { id: 'UCsIhnC98MY38cN2BOEwZHuw', name: 'Analiza Polityczna' },
    { id: 'UCn_ngI4kGCiMploRas6QUBQ', name: 'Polityczny Vibe' },
    { id: 'UCTAAUHQl0sN6w0RpAUzs-Bg', name: 'Bądź Na Bieżąco' },
    { id: 'UCv8Ist9tKfzHxQ6gHH9_hTQ', name: 'Jan Pospieszalski' },
    { id: 'UCeqUW_B8E-BPcpw1oQQ0rFA', name: 'Polskość to normalność' },
    { id: 'UCqXzykyeNdMNwiXTvfUOSNQ', name: 'Rafał Ziemkiewicz' },
    { id: 'UCp204ah3iChrYrpY_gccm6g', name: 'Otwarta Konserwa' },
    { id: 'UC4uWtFsAryV2p_UDvu0rraA', name: 'Rymanowski Live' },
    { id: 'UC4U-Bz5I-jttkLO4XktpXOQ', name: 'GadowskiTV' },
    { id: 'UCPiu4CZlknkTworskK79CPg', name: 'wPolsce24' },
    { id: 'UCNY81VIp_eKAmyKymiAyr3A', name: 'Telewizja Trwam' },
    { id: 'UCtnpvFVFVlS8sf5blhTr1lQ', name: 'Stanisław Michalkiewicz' },
    { id: 'UCg-s1p2hBd1p061-4c1-x-g', name: 'Łukasz Warzecha' },
    { id: 'UCuAOJnMr905iKjURUsffDgA', name: 'Układ otwarty - Igor Janke' },
    { id: 'UCn0TKgJb9EV6COKd8vlzJZQ', name: 'Konfederacja' },
    { id: 'UCj9A4-h-h6N-MYpE2_5sK9A', name: 'Prawo i Sprawiedliwość' },
    { id: 'UCvFf9SgP0wB-E1-s1sgxAlw', name: 'Polsat News' },
    { id: 'UC3R8278fJUWn2ysrOCJrmAQ', name: 'TVN24' },
    { id: 'UCzQZbOb86WvhOPoR7jgAfsA', name: 'TVP Info' },
    { id: 'UCkC9YgH_FlqOhOIoTDFt4CA', name: 'RMF24' },
    { id: 'UCjkNubkfecaFLZbHnnsz6pw', name: 'Onet Rano' },
    { id: 'UCKBknIMjyDBuCCMesl1F0Yw', name: 'Gazeta Wyborcza' },
    { id: 'UCk98nS2WgQ16IbuG1g5Bw-A', name: 'OKO.press' },
    { id: 'UCMvBXVa0KUO-IaeXzUtbuHA', name: 'Newsweek Polska' },
    { id: 'UC3MluKZngz34_Zi-XvpGtXw', name: 'TOMASZ LIS - kanał oficjalny' },
    { id: 'UCHWB1dvebBlXIHUSuUQSrxQ', name: 'Krytyka Polityczna' },
    { id: 'UC9P7BO26oRIYsOmZ4u3P0WQ', name: 'KanałTAK' }
];

const RADIO_WNET_ID = 'UCMA-v2JV_9ZYNoY4uY4mRWA';

const RANKS = [
    { title: 'Rekrut Areny', level: 1, threshold: 0 },
    { title: 'Szermierz Danych', level: 2, threshold: 3 },
    { title: 'Taktyk Widowni', level: 3, threshold: 6 },
    { title: 'Mistrz Strategii', level: 4, threshold: 11 },
    { title: 'Legenda Areny', level: 5, threshold: 20 },
];

const getRankDetails = (analysesCount: number) => {
    let currentRank = RANKS[0];
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (analysesCount >= RANKS[i].threshold) {
            currentRank = RANKS[i];
            break;
        }
    }
    
    const nextRank = RANKS.find(r => r.level === currentRank.level + 1) || null;
    
    return {
        rank: currentRank,
        nextRank: nextRank,
    };
};


const App: React.FC = () => {
    const getInitialDate = (offsetDays: number = 0) => {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        return date.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState<string>(getInitialDate(-7));
    const [endDate, setEndDate] = useState<string>(getInitialDate());
    const [channelId, setChannelId] = useState<string>(PREDEFINED_CHANNELS[0].id);
    
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
    const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
    const [isUpdatingSummary, setIsUpdatingSummary] = useState<boolean>(false);
    const [updateChangelog, setUpdateChangelog] = useState<string | null>(null);
    const [progressSteps, setProgressSteps] = useState<string[]>([]);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
    const [analysisJustCompleted, setAnalysisJustCompleted] = useState(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320); // Corresponds to w-80
    const isResizing = useRef(false);

    const [headerHeight, setHeaderHeight] = useState(0);
    const headerRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const [isControlsOpen, setIsControlsOpen] = useState(true);

    useEffect(() => {
        const headerElement = headerRef.current;
        if (!headerElement) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setHeaderHeight(entries[0].contentRect.height);
            }
        });

        resizeObserver.observe(headerElement);

        return () => {
            if (headerElement) {
                resizeObserver.unobserve(headerElement);
            }
        };
    }, []);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleResizeMouseMove);
        window.addEventListener('mouseup', handleResizeMouseUp);
    }, []);

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = e.clientX;
        if (newWidth >= 280 && newWidth <= 600) {
            setSidebarWidth(newWidth);
        }
    }, []);

    const handleResizeMouseUp = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        window.removeEventListener('mousemove', handleResizeMouseMove);
        window.removeEventListener('mouseup', handleResizeMouseUp);
    }, []);


    const currentAnalysis = useMemo(() => {
        return analysisHistory.find(analysis => analysis.id === currentAnalysisId) || null;
    }, [analysisHistory, currentAnalysisId]);

    const gamificationStats = useMemo(() => {
        const totalAnalyses = analysisHistory.length;
        const wnetAnalysesCount = analysisHistory.filter(a => !a.isComparative).length;
        const comparativeAnalysesCount = analysisHistory.filter(a => a.isComparative).length;

        let highestEngagementRate = -1;
        let topVideo: Video | null = null;
        const uniqueChannels = new Set<string>();
        let hasGoldenShot = false;
        let hasDiscussionKing = false;
        let hasViralAlert = false;

        analysisHistory.forEach(analysis => {
            uniqueChannels.add(analysis.channelName);
            const allVideos = [
                ...analysis.videoData.longForm,
                ...analysis.videoData.shorts,
                ...analysis.videoData.liveStreams,
            ];
            allVideos.forEach(video => {
                const engagement = calculateEngagementRate(video);
                if (engagement > highestEngagementRate) {
                    highestEngagementRate = engagement;
                    topVideo = video;
                }
                if (parseInt(video.statistics.viewCount, 10) >= 1000000) {
                    hasGoldenShot = true;
                }
                if (parseInt(video.statistics.commentCount, 10) >= 1000) {
                    hasDiscussionKing = true;
                }
            });
            analysis.videoData.shorts.forEach(short => {
                if(calculateEngagementRate(short) > 5) {
                    hasViralAlert = true;
                }
            });
        });
        
        const toISODateString = (date: Date) => date.toISOString().split('T')[0];

        const checkLastWeekPreset = (start: string, end: string): boolean => {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
            const lastSaturday = new Date(today);
            lastSaturday.setDate(today.getDate() - (dayOfWeek + 1) % 7);
            const lastSunday = new Date(lastSaturday);
            lastSunday.setDate(lastSaturday.getDate() - 6);
            
            return start === toISODateString(lastSunday) && end === toISODateString(lastSaturday);
        };
        
        const hasLastWeekWnetAnalysis = analysisHistory.some(
            analysis => 
                !analysis.isComparative && 
                checkLastWeekPreset(analysis.startDate, analysis.endDate)
        );

        const analysisStreak = totalAnalyses >= 5;
        const { rank, nextRank } = getRankDetails(totalAnalyses);

        return {
            totalAnalyses,
            wnetAnalysesCount,
            comparativeAnalysesCount,
            topEngagementVideo: topVideo,
            highestEngagementRate: highestEngagementRate > -1 ? highestEngagementRate : 0,
            uniqueChannels: Array.from(uniqueChannels),
            hasGoldenShot,
            hasDiscussionKing,
            hasViralAlert,
            analysisStreak,
            rank,
            nextRank,
            hasLastWeekWnetAnalysis,
        };
    }, [analysisHistory]);

    const analyzedVideoIds = useMemo(
        () => Object.keys(currentAnalysis?.analyzedVideos || {}),
        [currentAnalysis?.analyzedVideos]
    );

    const addProgressStep = useCallback((message: string) => {
        setProgressSteps(prev => [...prev, message]);
    }, []);

    const handleFetchStats = useCallback(async () => {
        if (!channelId) {
            setError("Proszę wybrać kanał do analizy.");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError("Data początkowa nie może być późniejsza niż data końcowa.");
            return;
        }

        setIsLoading(true);
        setIsGeneratingSummary(false);
        setError(null);
        setSelectedVideo(null);
        setUpdateChangelog(null);
        setProgressSteps([]);
        setAnalysisJustCompleted(true);
        
        const newAnalysisId = `analysis-${Date.now()}`;

        try {
            addProgressStep('Inicjuję połączenie z YouTube Data API...');
            const isComparativeAnalysis = channelId !== RADIO_WNET_ID;
            
            const selectedChannelPromise = getChannelStats(channelId);
            addProgressStep('Wysyłam żądanie o statystyki wybranego kanału...');
            const selectedVideosPromise = getChannelVideos(channelId, startDate, endDate);
            addProgressStep('Wysyłam żądanie o listę filmów wybranego kanału...');
            const selectedPlaylistsPromise = getChannelPlaylists(channelId);
            addProgressStep('Wysyłam żądanie o playlisty wybranego kanału...');


            let mainChannelForPrompt: Channel;
            let mainVideosForPrompt: { longForm: Video[], shorts: Video[], liveStreams: Video[] };
            let mainPlaylistsForPrompt: Playlist[];
            let competitorChannelForPrompt: Channel | undefined;
            let competitorVideosForPrompt: { longForm: Video[], shorts: Video[], liveStreams: Video[] } | undefined;
            let competitorPlaylistsForPrompt: Playlist[] | undefined;

            let displayChannel: Channel;
            let displayVideos: { longForm: Video[], shorts: Video[], liveStreams: Video[] };
            let displayPlaylists: Playlist[];

            if (isComparativeAnalysis) {
                addProgressStep('Analiza porównawcza: Pobieram dane dla kanału Radio Wnet...');
                const radioWnetChannelPromise = getChannelStats(RADIO_WNET_ID);
                const radioWnetVideosPromise = getChannelVideos(RADIO_WNET_ID, startDate, endDate);
                const radioWnetPlaylistsPromise = getChannelPlaylists(RADIO_WNET_ID);
                const [selectedChannel, selectedVideos, selectedPlaylists, wnetChannel, wnetVideos, wnetPlaylists] = await Promise.all([
                    selectedChannelPromise,
                    selectedVideosPromise,
                    selectedPlaylistsPromise,
                    radioWnetChannelPromise,
                    radioWnetVideosPromise,
                    radioWnetPlaylistsPromise
                ]);
                
                addProgressStep(`[ OK ] Pobrano dane dla: ${selectedChannel.snippet.title}`);
                addProgressStep(`[ OK ] Pobrano dane dla: ${wnetChannel.snippet.title}`);

                displayChannel = selectedChannel;
                displayVideos = selectedVideos;
                displayPlaylists = selectedPlaylists;
                
                mainChannelForPrompt = wnetChannel;
                mainVideosForPrompt = wnetVideos;
                mainPlaylistsForPrompt = wnetPlaylists;
                competitorChannelForPrompt = selectedChannel;
                competitorVideosForPrompt = selectedVideos;
                competitorPlaylistsForPrompt = selectedPlaylists;
            } else {
                const [selectedChannel, selectedVideos, selectedPlaylists] = await Promise.all([selectedChannelPromise, selectedVideosPromise, selectedPlaylistsPromise]);
                addProgressStep(`[ OK ] Pobrano dane dla: ${selectedChannel.snippet.title}`);
                displayChannel = selectedChannel;
                displayVideos = selectedVideos;
                displayPlaylists = selectedPlaylists;

                mainChannelForPrompt = selectedChannel;
                mainVideosForPrompt = selectedVideos;
                mainPlaylistsForPrompt = selectedPlaylists;
            }
            
            addProgressStep('[ OK ] Dane kanału i listy wideo pobrane. Możesz już je przeglądać.');
            
            const hasDisplayVideos = displayVideos.longForm.length > 0 || displayVideos.shorts.length > 0 || displayVideos.liveStreams.length > 0;
            const initialSummary = hasDisplayVideos ? '' : "Nie znaleziono filmów (w tym Shorts i transmisji na żywo) w wybranym zakresie dat do analizy.";
            
            const newAnalysisShell: AnalysisResult = {
                id: newAnalysisId,
                channelData: displayChannel,
                videoData: displayVideos,
                playlists: displayPlaylists,
                aiSummary: initialSummary,
                lectorSummary: '',
                startDate,
                endDate,
                isComparative: isComparativeAnalysis,
                channelName: displayChannel.snippet.title,
                integratedVideoIds: [],
                analyzedVideos: {},
            };

            setAnalysisHistory(prev => [newAnalysisShell, ...prev]);
            setCurrentAnalysisId(newAnalysisShell.id);
            setIsLoading(false); // Data from YouTube is loaded, we can show grids

            const hasMainVideosForPrompt = mainVideosForPrompt.longForm.length > 0 || mainVideosForPrompt.shorts.length > 0 || mainVideosForPrompt.liveStreams.length > 0;
            const hasCompetitorVideos = competitorVideosForPrompt ? (competitorVideosForPrompt.longForm.length > 0 || competitorVideosForPrompt.shorts.length > 0 || competitorVideosForPrompt.liveStreams.length > 0) : false;
            
            if (mainChannelForPrompt && (hasMainVideosForPrompt || hasCompetitorVideos)) {
                setIsGeneratingSummary(true);
                addProgressStep('-----------------------------------------');
                addProgressStep('Rozpoczynam generowanie analizy AI...');
                addProgressStep('Prompt to zestaw instrukcji dla modelu językowego.');

                if (isComparativeAnalysis && competitorChannelForPrompt) {
                     addProgressStep('Konstruuję zapytanie (prompt) dla modelu Gemini. Wybrany szablon: Analiza Porównawcza.');
                     addProgressStep(`Wypełniam prompt danymi (kontekstem): Główny kanał='${mainChannelForPrompt.snippet.title}', Konkurent='${competitorChannelForPrompt.snippet.title}'`);
                } else {
                     addProgressStep('Konstruuję zapytanie (prompt) dla modelu Gemini. Wybrany szablon: Analiza Generalna Kanału.');
                     const totalVideos = mainVideosForPrompt.longForm.length + mainVideosForPrompt.shorts.length + mainVideosForPrompt.liveStreams.length;
                     addProgressStep(`Wypełniam prompt danymi (kontekstem): Kanał='${mainChannelForPrompt.snippet.title}', Łącznie filmów=${totalVideos}`);
                }
                
                addProgressStep("Wysyłam zapytanie do Google Gemini (model: gemini-2.5-pro)... To może potrwać kilkanaście sekund.");
                try {
                    const summary = await generateChannelSummary(
                        mainChannelForPrompt,
                        mainVideosForPrompt,
                        mainPlaylistsForPrompt,
                        competitorChannelForPrompt,
                        competitorVideosForPrompt,
                        competitorPlaylistsForPrompt
                    );
                    addProgressStep('[ OK ] Model AI zakończył generowanie. Otrzymano odpowiedź.');
                    
                    setAnalysisHistory(prev => 
                        prev.map(analysis => 
                            analysis.id === newAnalysisId 
                            ? { ...analysis, aiSummary: summary }
                            : analysis
                        )
                    );

                    addProgressStep('Generuję podsumowanie dla lektora...');
                    const lectorSummary = await generateLectorSummary(summary);
                    addProgressStep('[ OK ] Podsumowanie dla lektora gotowe.');
                    addProgressStep('Zakończono. Wyświetlam pełny raport.');
                    
                    setAnalysisHistory(prev => 
                        prev.map(analysis => 
                            analysis.id === newAnalysisId 
                            ? { ...analysis, aiSummary: summary, lectorSummary: lectorSummary }
                            : analysis
                        )
                    );

                } catch (aiError) {
                    console.error("AI Summary generation failed:", aiError);
                    const summary = "Wystąpił błąd podczas generowania analizy AI. Model może być niedostępny lub żądanie nie mogło zostać przetworzone.";
                    addProgressStep('BŁĄD: Nie udało się wygenerować analizy AI.');
                    setAnalysisHistory(prev => 
                        prev.map(analysis => 
                            analysis.id === newAnalysisId 
                            ? { ...analysis, aiSummary: summary }
                            : analysis
                        )
                    );
                } finally {
                    setIsGeneratingSummary(false);
                }
            } else {
                addProgressStep('Zakończono. Brak materiałów do analizy przez AI.');
                setIsGeneratingSummary(false);
            }

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd.";
            setError(`Nie udało się pobrać danych z YouTube: ${errorMessage}`);
            addProgressStep(`BŁĄD KRYTYCZNY: ${errorMessage}`);
            setIsLoading(false);
            setIsGeneratingSummary(false);
        }
    }, [startDate, endDate, channelId, addProgressStep]);
    
    const handleHumanInput = useCallback(async (command: string) => {
        if (!currentAnalysis || !currentAnalysis.aiSummary) return;

        setIsUpdatingSummary(true);
        addProgressStep(`> ${command}`);
        addProgressStep("Przetwarzam polecenie człowieka...");
        addProgressStep("Redaguję nowy prompt aktualizujący dla Gemini...");

        try {
            const refinedSummary = await refineAnalysis(currentAnalysis.aiSummary, command);
            addProgressStep("[ OK ] Otrzymano zaktualizowaną analizę.");
            
            addProgressStep("Generuję nowe podsumowanie dla lektora...");
            const refinedLectorSummary = await generateLectorSummary(refinedSummary);
            addProgressStep("[ OK ] Podsumowanie dla lektora gotowe.");
            
            setAnalysisHistory(prevHistory => 
                prevHistory.map(analysis => {
                    if (analysis.id === currentAnalysisId) {
                        return { 
                            ...analysis, 
                            aiSummary: refinedSummary,
                            lectorSummary: refinedLectorSummary,
                        };
                    }
                    return analysis;
                })
            );
            addProgressStep("Zakończono. Analiza została zaktualizowana.");

        } catch (error) {
            console.error("Failed to refine analysis:", error);
            const errorMessage = error instanceof Error ? error.message : "Nieznany błąd.";
            addProgressStep(`BŁĄD: Nie udało się zaktualizować analizy. ${errorMessage}`);
        } finally {
            setIsUpdatingSummary(false);
        }
    }, [currentAnalysis, currentAnalysisId, addProgressStep]);
    
    const handleSelectAnalysis = (analysisId: string) => {
        setSelectedVideo(null);
        setUpdateChangelog(null);
        setCurrentAnalysisId(analysisId);
        setAnalysisJustCompleted(false);
        setProgressSteps([]);
    };

    const handleVideoSelect = (video: Video) => {
        setUpdateChangelog(null);
        setSelectedVideo(video);
    };

    const handleSelectVideoFromHistory = (analysisId: string, videoId: string) => {
        const analysis = analysisHistory.find(a => a.id === analysisId);
        const videoData = analysis?.analyzedVideos?.[videoId]?.video;
        if (analysis && videoData) {
            setCurrentAnalysisId(analysisId);
            setSelectedVideo(videoData);
            setAnalysisJustCompleted(false);
            setProgressSteps([]);
        }
    };
    
    const handleClearSelectedVideo = useCallback(async () => {
        const justExitedVideoId = selectedVideo?.id;
        setSelectedVideo(null);

        const hasVideoInsight = justExitedVideoId && currentAnalysis?.analyzedVideos?.[justExitedVideoId];
        const isAlreadyIntegrated = currentAnalysis?.integratedVideoIds?.includes(justExitedVideoId || '');

        if (hasVideoInsight && currentAnalysis && !isAlreadyIntegrated) {
            const videoInsight = currentAnalysis.analyzedVideos[justExitedVideoId].summary;
            const oldSummary = currentAnalysis.aiSummary;
            
            setIsUpdatingSummary(true);
            setUpdateChangelog(null);
            try {
                const updatedSummary = await updateChannelSummaryWithVideoInsights(
                    oldSummary,
                    videoInsight
                );
                
                const changelog = await generateUpdateChangelog(oldSummary, updatedSummary);
                setUpdateChangelog(changelog);
                
                const updatedLectorSummary = await generateLectorSummary(updatedSummary);
                
                setAnalysisHistory(prevHistory => 
                    prevHistory.map(analysis => {
                        if (analysis.id === currentAnalysisId) {
                            return { 
                                ...analysis, 
                                aiSummary: updatedSummary,
                                lectorSummary: updatedLectorSummary,
                                integratedVideoIds: [...analysis.integratedVideoIds, justExitedVideoId] 
                            };
                        }
                        return analysis;
                    })
                );
            } catch (error) {
                console.error("Failed to update summary with video insights:", error);
            } finally {
                setIsUpdatingSummary(false);
            }
        }
    }, [selectedVideo, currentAnalysis, currentAnalysisId]);

    const handleVideoDataLoaded = (videoId: string, data: AnalyzedVideo) => {
        setAnalysisHistory(prevHistory => 
            prevHistory.map(analysis => {
                if (analysis.id === currentAnalysisId) {
                    const updatedAnalyzedVideos = {
                        ...(analysis.analyzedVideos || {}),
                        [videoId]: data
                    };
                    return { ...analysis, analyzedVideos: updatedAnalyzedVideos };
                }
                return analysis;
            })
        );
    };

    const handleToggleSelection = (id: string) => {
        setSelectedHistoryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleExport = () => {
        if (selectedHistoryIds.size === 0) return;

        const allChannelsData = analysisHistory.map(a => a.channelData);

        const selectedAnalyses = analysisHistory
            .map(analysis => {
                const isChannelSelected = selectedHistoryIds.has(analysis.id);
                const selectedVideos = Object.values(analysis.analyzedVideos || {})
                    .filter(v => selectedHistoryIds.has(`${analysis.id}-${v.video.id}`));

                if (!isChannelSelected && selectedVideos.length === 0) {
                    return null;
                }

                return {
                    channelData: analysis.channelData,
                    channelAnalysis: isChannelSelected ? {
                        summary: analysis.aiSummary,
                        lectorSummary: analysis.lectorSummary,
                    } : undefined,
                    videoAnalyses: selectedVideos
                };
            })
            .filter(Boolean) as { channelData: Channel, channelAnalysis?: any, videoAnalyses: AnalyzedVideo[] }[];
        
        selectedAnalyses.sort((a, b) => {
            if (a.channelData.id === RADIO_WNET_ID) return -1;
            if (b.channelData.id === RADIO_WNET_ID) return 1;
            const videoCountA = parseInt(a.channelData.statistics.videoCount, 10);
            const videoCountB = parseInt(b.channelData.statistics.videoCount, 10);
            return videoCountB - videoCountA;
        });
        
        exportAnalysesToHTML(selectedAnalyses, allChannelsData);
    };

    const handleNewAnalysisClick = () => {
        setIsControlsOpen(true);
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const showTerminal = isLoading || isGeneratingSummary || (analysisJustCompleted && progressSteps.length > 0);


    return (
        <div className="h-screen bg-wnet-dark font-sans flex flex-col overflow-hidden">
            <div className="flex flex-1 min-h-0">
                <aside
                    style={{ width: isSidebarMinimized ? '72px' : `${sidebarWidth}px`, transition: isResizing.current ? 'none' : 'width 0.2s ease-in-out' }}
                    className="bg-neutral-900/80 border-r border-neutral-800 flex flex-col flex-shrink-0 relative"
                >
                    {isSidebarMinimized ? (
                        <MinimizedSidebar 
                            stats={gamificationStats} 
                            onExport={handleExport} 
                            onToggle={() => setIsSidebarMinimized(false)}
                            history={analysisHistory}
                        />
                    ) : (
                        <div className="p-4 h-full flex flex-col overflow-y-auto">
                            <Scoreboard 
                                stats={gamificationStats} 
                                history={analysisHistory}
                                onSelectAnalysis={handleSelectAnalysis}
                            />
                            <div className="flex-1 flex flex-col min-h-0">
                                <HistorySidebar 
                                    history={analysisHistory} 
                                    currentId={currentAnalysisId} 
                                    onSelect={handleSelectAnalysis}
                                    onSelectVideo={handleSelectVideoFromHistory}
                                    selectedIds={selectedHistoryIds}
                                    onToggleSelect={handleToggleSelection}
                                    onExport={handleExport}
                                />
                            </div>
                        </div>
                    )}
                    
                    {!isSidebarMinimized && (
                        <button 
                            onClick={() => setIsSidebarMinimized(true)} 
                            className="absolute top-4 -right-[10px] z-10 w-6 h-6 bg-neutral-700 hover:bg-wnet-yellow text-white hover:text-black rounded-full flex items-center justify-center transition-colors"
                            title="Zminimalizuj panel"
                        >
                            <ChevronDoubleLeftIcon className="h-4 w-4" />
                        </button>
                    )}
                </aside>
                
                {!isSidebarMinimized && (
                    <div
                        onMouseDown={handleResizeMouseDown}
                        className="w-1.5 cursor-col-resize bg-neutral-800 hover:bg-wnet-yellow transition-colors flex-shrink-0"
                        title="Zmień szerokość panelu"
                    />
                )}

                <div ref={mainContentRef} className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                        <Controls
                            ref={headerRef}
                            onFetch={handleFetchStats} 
                            isLoading={isLoading || isGeneratingSummary}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            channelId={channelId}
                            setChannelId={setChannelId}
                            predefinedChannels={PREDEFINED_CHANNELS}
                            isOpen={isControlsOpen}
                            setIsOpen={setIsControlsOpen}
                        />
                        
                        <main>
                            {selectedVideo ? (
                                <VideoDetailView 
                                    video={selectedVideo} 
                                    onBack={handleClearSelectedVideo} 
                                    cachedData={currentAnalysis?.analyzedVideos?.[selectedVideo.id]}
                                    onDataLoaded={(data) => handleVideoDataLoaded(selectedVideo.id, data)}
                                />
                            ) : (
                                <>
                                    {showTerminal && (
                                        <div className="mb-8">
                                            <AnalysisProgress 
                                                key={currentAnalysis?.id}
                                                steps={progressSteps} 
                                                title="ANALIZA KANAŁU"
                                                showBootSequence={true}
                                                isHumanInputEnabled={analysisJustCompleted && !isGeneratingSummary && !isLoading && !!currentAnalysis?.aiSummary}
                                                onHumanInputCommand={handleHumanInput}
                                            />
                                        </div>
                                    )}

                                    {error && !isLoading && (
                                        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg text-center max-w-3xl mx-auto">
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    {isLoading && !currentAnalysis && <LoadingSkeleton />}

                                    {!isLoading && currentAnalysis && (
                                        <div className="space-y-12">
                                            
                                            <ChannelHeader channel={currentAnalysis.channelData} />

                                            <QuickNav 
                                                hasVideos={currentAnalysis.videoData.longForm.length > 0}
                                                hasShorts={currentAnalysis.videoData.shorts.length > 0}
                                                hasLiveStreams={currentAnalysis.videoData.liveStreams.length > 0}
                                                hasAiSummary={!!(isGeneratingSummary || currentAnalysis.aiSummary)}
                                                stickyTop={headerHeight}
                                            />
                                            
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <div className="lg:col-span-2 space-y-12">
                                                    {currentAnalysis.videoData.longForm.length > 0 ? (
                                                        <div id="videos-section" className="scroll-mt-24">
                                                            <VideoStatsGrid title="Najpopularniejsze Filmy" videos={currentAnalysis.videoData.longForm} onVideoSelect={handleVideoSelect} analyzedVideoIds={analyzedVideoIds} />
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-slate-500">
                                                            <div className="bg-neutral-900/50 p-8 rounded-lg max-w-md mx-auto">
                                                                <h3 className="text-xl font-bold text-slate-300 mb-2">Nie Znaleziono Filmów</h3>
                                                                <p>Nie znaleziono standardowych filmów (innych niż Shorts) dla tego kanalu w wybranym zakresie dat.</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {currentAnalysis.videoData.shorts.length > 0 && (
                                                         <div id="shorts-section" className="scroll-mt-24">
                                                            <VideoStatsGrid title="Najpopularniejsze Shorty" videos={currentAnalysis.videoData.shorts} onVideoSelect={handleVideoSelect} analyzedVideoIds={analyzedVideoIds}/>
                                                        </div>
                                                    )}

                                                    {currentAnalysis.videoData.liveStreams.length > 0 && (
                                                        <div id="livestreams-section" className="scroll-mt-24">
                                                            <VideoStatsGrid title="Najpopularniejsze Transmisje na Żywo" videos={currentAnalysis.videoData.liveStreams} onVideoSelect={handleVideoSelect} analyzedVideoIds={analyzedVideoIds}/>
                                                        </div>
                                                    )}
                                                </div>

                                                <aside className="lg:col-span-1">
                                                    {(isGeneratingSummary || currentAnalysis.aiSummary) && (
                                                        <div id="ai-summary-section" className="sticky top-28 scroll-mt-28">
                                                            <AISummary 
                                                                summary={currentAnalysis.aiSummary || ''} 
                                                                lectorSummary={currentAnalysis.lectorSummary || ''}
                                                                isLoading={isGeneratingSummary && !currentAnalysis.aiSummary}
                                                                isUpdating={isUpdatingSummary}
                                                                channelName={currentAnalysis.channelName}
                                                                updateChangelog={updateChangelog}
                                                                onDismissChangelog={() => setUpdateChangelog(null)}
                                                            />
                                                        </div>
                                                    )}
                                                </aside>
                                            </div>
                                        </div>
                                    )}

                                    {!currentAnalysis && !showTerminal && (
                                        <div className="text-center mt-12 text-slate-500">
                                            <div className="bg-neutral-900/50 p-8 rounded-lg max-w-md mx-auto">
                                                <h3 className="text-xl font-bold text-slate-300 mb-2">Gotowy do analizy?</h3>
                                                <p>Wybierz kanał Radio Wnet, żeby otrzymać jego analizę generalną i za wybrany okres. Wybierz każdy inny kanał i uzyskaj jego porównanie z kanałem Radio Wnet. Ucz się od konkurencji.</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </main>
                    </div>
                </div>
            </div>
             <Footer onNewAnalysisClick={handleNewAnalysisClick} />
        </div>
    );
};

const LoadingSkeleton: React.FC = () => (
    <div className="mt-8 space-y-12">
        <div className="animate-pulse-fast">
            <div className="h-48 md:h-64 bg-neutral-900 rounded-lg"></div>
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 px-4 sm:px-8">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-neutral-800 rounded-full border-4 border-wnet-dark"></div>
                <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left w-full">
                    <div className="h-8 bg-neutral-800 rounded w-1/2 sm:w-1/3 mb-2 mx-auto sm:mx-0"></div>
                    <div className="h-4 bg-neutral-800 rounded w-3/4 sm:w-1/2 mx-auto sm:mx-0"></div>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2 space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse-fast bg-neutral-900 rounded-lg overflow-hidden">
                            <div className="h-48 bg-neutral-800"></div>
                            <div className="p-4">
                                <div className="h-5 bg-neutral-800 rounded mb-3"></div>
                                <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-1">
                 <div className="animate-pulse-fast bg-neutral-900/50 p-6 rounded-lg">
                    <div className="h-6 bg-neutral-800 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-neutral-800 rounded"></div>
                        <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
                        <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default App;