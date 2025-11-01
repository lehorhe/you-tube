import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Channel, Video, CommentThread, AnalysisResult } from './types';
import { getChannelStats, getChannelVideos } from './services/youtubeService';
import { generateChannelSummary, updateChannelSummaryWithVideoInsights, generateUpdateChangelog, generateLectorSummary } from './services/geminiService';
import ChannelInput from './components/ChannelInput';
import ChannelHeader from './components/ChannelHeader';
import VideoStatsGrid from './components/VideoStatsGrid';
import AISummary from './components/AISummary';
import VideoDetailView from './components/VideoDetailView';
import { WnetLogo, SparklesIcon, KeyIcon, AudioWaveIcon } from './components/icons';
import QuickNav from './components/QuickNav';
import HistorySidebar from './components/HistorySidebar';
import AnalysisProgress from './components/AnalysisProgress';


const PREDEFINED_CHANNELS = [
    { id: 'UCMA-v2JV_9ZYNoY4uY4mRWA', name: 'Radio Wnet' },
    { id: 'UClhEl4bMD8_escGCCTmRAYg', name: 'Kanał Zero' },
    { id: 'UCgEJqzJA106dMXQg8mcfgRA', name: 'Super Ring' },
    { id: 'UCc282c_TN8xIba_Z6GaDnQw', name: 'Telewizja Republika' },
    { id: 'UCsIhnC98MY38cN2BOEwZHuw', name: 'Analiza Polityczna' },
    { id: 'UCn_ngI4kGCiMploRas6QUBQ', name: 'Polityczny Vibe' },
    { id: 'UCTAAUHQl0sN6w0RpAUzs-Bg', name: 'Bądź Na Bieżąco' },
    { id: 'UCv8Ist9tKfzHxQ6gHH9_hTQ', name: 'Jan Pospieszalski' },
    { id: 'UCeqUW_B8E-BPcpw1oQQ0rFA', name: 'Polskość to normalność. Tomasz Gdula' },
    { id: 'UCqXzykyeNdMNwiXTvfUOSNQ', name: 'Rafał Ziemkiewicz' },
    { id: 'UCp204ah3iChrYrpY_gccm6g', name: 'Otwarta Konserwa' },
    { id: 'UC4uWtFsAryV2p_UDvu0rraA', name: 'Rymanowski Live' },
    { id: 'UC4U-Bz5I-jttkLO4XktpXOQ', name: 'GadowskiTV' },
];

const RADIO_WNET_ID = 'UCMA-v2JV_9ZYNoY4uY4mRWA';

interface VideoAnalysisCache {
    [videoId: string]: {
        comments: CommentThread[];
        summary: string;
        lectorSummary: string;
    };
}

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('youtubeApiKey') || '');
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>(() => localStorage.getItem('elevenLabsApiKey') || '');


    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('youtubeApiKey', apiKey);
        } else {
            localStorage.removeItem('youtubeApiKey');
        }
    }, [apiKey]);

     useEffect(() => {
        if (elevenLabsApiKey) {
            localStorage.setItem('elevenLabsApiKey', elevenLabsApiKey);
        } else {
            localStorage.removeItem('elevenLabsApiKey');
        }
    }, [elevenLabsApiKey]);

    const getInitialDate = (offsetDays: number = 0) => {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        return date.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState<string>(getInitialDate(-7));
    const [endDate, setEndDate] = useState<string>(getInitialDate());
    const [channelId, setChannelId] = useState<string>(PREDEFINED_CHANNELS[1].id);
    
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
    const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
    const [isUpdatingSummary, setIsUpdatingSummary] = useState<boolean>(false);
    const [updateChangelog, setUpdateChangelog] = useState<string | null>(null);
    const [progressSteps, setProgressSteps] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [videoAnalysisCache, setVideoAnalysisCache] = useState<VideoAnalysisCache>({});
    
    const currentAnalysis = useMemo(() => {
        return analysisHistory.find(analysis => analysis.id === currentAnalysisId) || null;
    }, [analysisHistory, currentAnalysisId]);


    const handleFetchStats = useCallback(async () => {
        if (!apiKey) {
            setError("Proszę podać klucz YouTube Data API, aby rozpocząć analizę.");
            return;
        }
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
        
        const newAnalysisId = `analysis-${Date.now()}`;

        const addProgressStep = (message: string) => {
            setProgressSteps(prev => [...prev, message]);
        };

        try {
            addProgressStep('> Inicjuję połączenie z YouTube Data API...');
            const isComparativeAnalysis = channelId !== RADIO_WNET_ID;
            
            const selectedChannelPromise = getChannelStats(apiKey, channelId);
            addProgressStep('> Wysyłam żądanie o statystyki wybranego kanału...');
            const selectedVideosPromise = getChannelVideos(apiKey, channelId, startDate, endDate);
            addProgressStep('> Wysyłam żądanie o listę filmów wybranego kanału...');

            let mainChannelForPrompt: Channel;
            let mainVideosForPrompt: { longForm: Video[], shorts: Video[], liveStreams: Video[] };
            let competitorChannelForPrompt: Channel | undefined;
            let competitorVideosForPrompt: { longForm: Video[], shorts: Video[], liveStreams: Video[] } | undefined;

            let displayChannel: Channel;
            let displayVideos: { longForm: Video[], shorts: Video[], liveStreams: Video[] };

            if (isComparativeAnalysis) {
                addProgressStep('> Analiza porównawcza: Pobieram dane dla kanału Radio Wnet...');
                const radioWnetChannelPromise = getChannelStats(apiKey, RADIO_WNET_ID);
                const radioWnetVideosPromise = getChannelVideos(apiKey, RADIO_WNET_ID, startDate, endDate);
                const [selectedChannel, selectedVideos, wnetChannel, wnetVideos] = await Promise.all([
                    selectedChannelPromise,
                    selectedVideosPromise,
                    radioWnetChannelPromise,
                    radioWnetVideosPromise
                ]);
                
                addProgressStep(`> Pobrano dane dla: ${selectedChannel.snippet.title}... [OK]`);
                addProgressStep(`> Pobrano dane dla: ${wnetChannel.snippet.title}... [OK]`);

                displayChannel = selectedChannel;
                displayVideos = selectedVideos;
                
                mainChannelForPrompt = wnetChannel;
                mainVideosForPrompt = wnetVideos;
                competitorChannelForPrompt = selectedChannel;
                competitorVideosForPrompt = selectedVideos;
            } else {
                const [selectedChannel, selectedVideos] = await Promise.all([selectedChannelPromise, selectedVideosPromise]);
                addProgressStep(`> Pobrano dane dla: ${selectedChannel.snippet.title}... [OK]`);
                displayChannel = selectedChannel;
                displayVideos = selectedVideos;

                mainChannelForPrompt = selectedChannel;
                mainVideosForPrompt = selectedVideos;
            }
            
            // --- OPTIMIZATION: RENDER YOUTUBE DATA FIRST ---
            const hasDisplayVideos = displayVideos.longForm.length > 0 || displayVideos.shorts.length > 0 || displayVideos.liveStreams.length > 0;
            const initialSummary = hasDisplayVideos ? '' : "Nie znaleziono filmów (w tym Shorts i transmisji na żywo) w wybranym zakresie dat do analizy.";
            
            const newAnalysisShell: AnalysisResult = {
                id: newAnalysisId,
                channelData: displayChannel,
                videoData: displayVideos,
                aiSummary: initialSummary,
                lectorSummary: '',
                startDate,
                endDate,
                isComparative: isComparativeAnalysis,
                channelName: displayChannel.snippet.title,
                integratedVideoIds: [],
            };

            setAnalysisHistory(prev => [...prev, newAnalysisShell]);
            setCurrentAnalysisId(newAnalysisShell.id);
            setIsLoading(false); // UI renders here!

            // --- OPTIMIZATION: GENERATE AI SUMMARY IN BACKGROUND ---
            const hasMainVideosForPrompt = mainVideosForPrompt.longForm.length > 0 || mainVideosForPrompt.shorts.length > 0 || mainVideosForPrompt.liveStreams.length > 0;
            const hasCompetitorVideos = competitorVideosForPrompt ? (competitorVideosForPrompt.longForm.length > 0 || competitorVideosForPrompt.shorts.length > 0 || competitorVideosForPrompt.liveStreams.length > 0) : false;
            
            if (mainChannelForPrompt && (hasMainVideosForPrompt || hasCompetitorVideos)) {
                setIsGeneratingSummary(true);
                addProgressStep('> Przekazuję zebrane dane do Gemini AI w celu analizy strategicznej...');
                try {
                    const summary = await generateChannelSummary(
                        mainChannelForPrompt,
                        mainVideosForPrompt,
                        competitorChannelForPrompt,
                        competitorVideosForPrompt
                    );
                    addProgressStep('> Analiza AI zakończona pomyślnie. Generowanie raportu... [OK]');
                    
                    // Update history with the full summary first
                    setAnalysisHistory(prev => 
                        prev.map(analysis => 
                            analysis.id === newAnalysisId 
                            ? { ...analysis, aiSummary: summary }
                            : analysis
                        )
                    );

                    // Now, generate the lector summary
                    addProgressStep('> Generuję podsumowanie dla lektora...');
                    const lectorSummary = await generateLectorSummary(summary);
                    addProgressStep('> Podsumowanie dla lektora gotowe... [OK]');
                    
                    // Update history again with the lector summary
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
                    addProgressStep('> BŁĄD: Nie udało się wygenerować analizy AI.');
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
            }

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd.";
            setError(`Nie udało się pobrać danych z YouTube: ${errorMessage}`);
            addProgressStep(`> BŁĄD KRYTYCZNY: ${errorMessage}`);
            setIsLoading(false);
            setIsGeneratingSummary(false);
        }
    }, [startDate, endDate, channelId, apiKey]);
    
    const handleSelectAnalysis = (analysisId: string) => {
        setSelectedVideo(null); // Ensure we are not in video detail view
        setUpdateChangelog(null);
        setCurrentAnalysisId(analysisId);
    };

    const handleVideoSelect = (video: Video) => {
        setUpdateChangelog(null);
        setSelectedVideo(video);
    };
    
    const handleClearSelectedVideo = useCallback(async () => {
        const justExitedVideoId = selectedVideo?.id;
        setSelectedVideo(null);

        const hasVideoInsight = justExitedVideoId && videoAnalysisCache[justExitedVideoId];
        const isAlreadyIntegrated = currentAnalysis?.integratedVideoIds?.includes(justExitedVideoId || '');

        if (hasVideoInsight && currentAnalysis && !isAlreadyIntegrated) {
            const videoInsight = videoAnalysisCache[justExitedVideoId].summary;
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
                
                // Also update the lector summary based on the new full summary
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
    }, [selectedVideo, videoAnalysisCache, currentAnalysis, currentAnalysisId]);

    const handleVideoDataLoaded = (videoId: string, data: { comments: CommentThread[], summary: string, lectorSummary: string }) => {
        setVideoAnalysisCache(prevCache => ({
            ...prevCache,
            [videoId]: data,
        }));
    };


    return (
        <div className="min-h-screen bg-wnet-dark font-sans">
            <div className="flex">
                <HistorySidebar 
                    history={analysisHistory} 
                    currentId={currentAnalysisId} 
                    onSelect={handleSelectAnalysis} 
                />
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <header className="text-center mb-8">
                            <WnetLogo className="h-12 mx-auto mb-4" />
                            <div className="flex justify-center items-center gap-4 mb-2">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-wnet-yellow to-amber-500">
                                   WYGRAJ YOUTUBE z AI!
                                </h1>
                                 <SparklesIcon className="h-10 w-10 text-yellow-400" />
                            </div>
                            <p className="text-slate-400 text-lg">
                               Analizuj kanał Radio Wnet lub ucz się od konkurentów!
                            </p>
                        </header>
                        
                        <main>
                            {selectedVideo ? (
                                <VideoDetailView 
                                    video={selectedVideo} 
                                    apiKey={apiKey} 
                                    onBack={handleClearSelectedVideo} 
                                    cachedData={videoAnalysisCache[selectedVideo.id]}
                                    onDataLoaded={(data) => handleVideoDataLoaded(selectedVideo.id, data)}
                                    elevenLabsApiKey={elevenLabsApiKey}
                                />
                            ) : (
                                <>
                                    <div className="max-w-3xl mx-auto bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 shadow-lg mb-6 space-y-4">
                                        <div>
                                            <label htmlFor="api-key-input" className="flex items-center text-sm font-medium text-slate-400 mb-2">
                                                <KeyIcon className="h-5 w-5 mr-2" />
                                                Klucz YouTube Data API
                                            </label>
                                            <input
                                                id="api-key-input"
                                                type="password"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="Wprowadź swój klucz API..."
                                                className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-lg text-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-wnet-yellow/50 focus:border-wnet-yellow transition"
                                            />
                                            {!apiKey && (
                                                <p className="text-xs text-slate-500 mt-2">
                                                    Klucz jest wymagany do pobierania danych. Jest przechowywany tylko w Twojej przeglądarce. <a href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noopener noreferrer" className="text-wnet-yellow hover:underline">Jak uzyskać klucz?</a>
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="elevenlabs-api-key-input" className="flex items-center text-sm font-medium text-slate-400 mb-2">
                                                <AudioWaveIcon className="h-5 w-5 mr-2" />
                                                Klucz API ElevenLabs (Opcjonalny)
                                            </label>
                                            <input
                                                id="elevenlabs-api-key-input"
                                                type="password"
                                                value={elevenLabsApiKey}
                                                onChange={(e) => setElevenLabsApiKey(e.target.value)}
                                                placeholder="Wprowadź klucz do syntezy mowy..."
                                                className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-lg text-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-wnet-yellow/50 focus:border-wnet-yellow transition"
                                            />
                                            {!elevenLabsApiKey && (
                                                <p className="text-xs text-slate-500 mt-2">
                                                    Klucz jest wymagany do odsłuchania analiz. <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="text-wnet-yellow hover:underline">Jak uzyskać klucz?</a>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <ChannelInput 
                                        onFetch={handleFetchStats} 
                                        isLoading={isLoading || isGeneratingSummary}
                                        startDate={startDate}
                                        setStartDate={setStartDate}
                                        endDate={endDate}
                                        setEndDate={setEndDate}
                                        channelId={channelId}
                                        setChannelId={setChannelId}
                                        predefinedChannels={PREDEFINED_CHANNELS}
                                        apiKey={apiKey}
                                    />
                                    
                                    {(isLoading || isGeneratingSummary) && (
                                        <div className="max-w-3xl mx-auto mt-6">
                                            <AnalysisProgress steps={progressSteps} />
                                        </div>
                                    )}

                                    {error && !isLoading && (
                                        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg text-center max-w-3xl mx-auto">
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    {isLoading && !currentAnalysis && <LoadingSkeleton />}

                                    {!isLoading && currentAnalysis && (
                                        <div className="mt-8 space-y-12">
                                            
                                            <ChannelHeader channel={currentAnalysis.channelData} />

                                            <QuickNav 
                                                hasVideos={currentAnalysis.videoData.longForm.length > 0}
                                                hasShorts={currentAnalysis.videoData.shorts.length > 0}
                                                hasLiveStreams={currentAnalysis.videoData.liveStreams.length > 0}
                                            />
                                            
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <div className="lg:col-span-2 space-y-12">
                                                    {currentAnalysis.videoData.longForm.length > 0 ? (
                                                        <div id="videos-section" className="scroll-mt-24">
                                                            <VideoStatsGrid title="Najpopularniejsze Filmy" videos={currentAnalysis.videoData.longForm} onVideoSelect={handleVideoSelect} />
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-slate-500">
                                                            <div className="bg-neutral-900/50 p-8 rounded-lg max-w-md mx-auto">
                                                                <h3 className="text-xl font-bold text-slate-300 mb-2">Nie Znaleziono Filmów</h3>
                                                                <p>Nie znaleziono standardowych filmów (innych niż Shorts) dla tego kanału w wybranym zakresie dat.</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {currentAnalysis.videoData.shorts.length > 0 && (
                                                         <div id="shorts-section" className="scroll-mt-24">
                                                            <VideoStatsGrid title="Najpopularniejsze Shorty" videos={currentAnalysis.videoData.shorts} onVideoSelect={handleVideoSelect}/>
                                                        </div>
                                                    )}

                                                    {currentAnalysis.videoData.liveStreams.length > 0 && (
                                                        <div id="livestreams-section" className="scroll-mt-24">
                                                            <VideoStatsGrid title="Najpopularniejsze Transmisje na Żywo" videos={currentAnalysis.videoData.liveStreams} onVideoSelect={handleVideoSelect}/>
                                                        </div>
                                                    )}
                                                </div>

                                                <aside className="lg:col-span-1">
                                                    {(isGeneratingSummary || currentAnalysis.aiSummary) && (
                                                        <div className="sticky top-8">
                                                            <AISummary 
                                                                summary={currentAnalysis.aiSummary || ''} 
                                                                lectorSummary={currentAnalysis.lectorSummary || ''}
                                                                isLoading={isGeneratingSummary && !currentAnalysis.aiSummary}
                                                                isUpdating={isUpdatingSummary}
                                                                channelName={currentAnalysis.channelName}
                                                                updateChangelog={updateChangelog}
                                                                onDismissChangelog={() => setUpdateChangelog(null)}
                                                                elevenLabsApiKey={elevenLabsApiKey}
                                                            />
                                                        </div>
                                                    )}
                                                </aside>
                                            </div>
                                        </div>
                                    )}

                                    {!isLoading && !currentAnalysis && !isGeneratingSummary && (
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

                        <footer className="text-center mt-12 text-slate-500 text-sm">
                            <p>Oparte na YouTube Data API i Google Gemini</p>
                        </footer>
                    </div>
                </div>
            </div>
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