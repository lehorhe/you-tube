import React, { useState, useEffect, useCallback } from 'react';
import type { Video, CommentThread, AnalyzedVideo } from '../types';
import { getVideoComments } from '../services/youtubeService';
import { generateVideoSummary, generateLectorSummary, refineAnalysis } from '../services/geminiService';
import { formatNumber } from '../utils';
import { LikesIcon, CommentsIcon, ViewsIcon, PlayButtonIcon } from './icons';
import AISummary from './AISummary';
import AnalysisProgress from './AnalysisProgress';

interface VideoDetailViewProps {
    video: Video;
    onBack: () => void;
    cachedData?: AnalyzedVideo;
    onDataLoaded: (data: AnalyzedVideo) => void;
}

const VideoDetailView: React.FC<VideoDetailViewProps> = ({ video, onBack, cachedData, onDataLoaded }) => {
    const [comments, setComments] = useState<CommentThread[] | null>(cachedData?.comments ?? null);
    const [summary, setSummary] = useState<string | null>(cachedData?.summary ?? null);
    const [lectorSummary, setLectorSummary] = useState<string | null>(cachedData?.lectorSummary ?? null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(!cachedData);
    const [isRefining, setIsRefining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progressSteps, setProgressSteps] = useState<string[]>([]);
    
    const addProgressStep = useCallback((message: string) => {
        setProgressSteps(prev => [...prev, message]);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (cachedData) {
                return;
            }

            setIsSummaryLoading(true);
            setError(null);
            setProgressSteps([]);
            
            try {
                addProgressStep('Inicjuję analizę wideo...');
                addProgressStep('Pobieram komentarze...');
                const fetchedComments = await getVideoComments(video.id);
                setComments(fetchedComments);
                addProgressStep(`[ OK ] Pobrano ${fetchedComments.length} najistotniejszych komentarzy.`);
                addProgressStep('-----------------------------------------');
                addProgressStep('Rozpoczynam generowanie analizy AI...');
                addProgressStep('Prompt to zestaw instrukcji dla modelu językowego.');
                addProgressStep(`Konstruuję zapytanie (prompt) dla modelu Gemini. Wybrany szablon: Analiza Pojedynczego Wideo.`);
                addProgressStep(`Wypełniam prompt danymi (kontekstem): Tytuł='${video.snippet.title.substring(0,30)}...', Liczba Komentarzy=${fetchedComments.length}`);
                addProgressStep("Wysyłam zapytanie do Google Gemini (model: gemini-2.5-pro)...");
                
                const generatedSummary = await generateVideoSummary(video, fetchedComments);
                addProgressStep('[ OK ] Model AI zakończył generowanie. Otrzymano odpowiedź.');
                
                addProgressStep('Generuję podsumowanie dla lektora...');
                const generatedLectorSummary = await generateLectorSummary(generatedSummary);
                addProgressStep('[ OK ] Streszczenie dla lektora wygenerowane.');
                
                setSummary(generatedSummary);
                setLectorSummary(generatedLectorSummary);
                
                addProgressStep('Zakończono. Wyświetlam pełny raport.');

                onDataLoaded({ video, comments: fetchedComments, summary: generatedSummary, lectorSummary: generatedLectorSummary });

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd.";
                setError(`Nie udało się wczytać szczegółów wideo: ${errorMessage}`);
                addProgressStep(`BŁĄD KRYTYCZNY: ${errorMessage}`);
                console.error(err);
            } finally {
                setIsSummaryLoading(false);
            }
        };

        fetchData();
    }, [video, cachedData, onDataLoaded, addProgressStep]);
    
    const handleHumanInputForVideo = useCallback(async (command: string) => {
        if (!summary) return;
        
        setIsRefining(true);
        addProgressStep(`> ${command}`);
        addProgressStep("Przetwarzam polecenie człowieka dla analizy wideo...");

        try {
            const refinedSummary = await refineAnalysis(summary, command);
            addProgressStep("[ OK ] Otrzymano zaktualizowaną analizę wideo.");

            const refinedLectorSummary = await generateLectorSummary(refinedSummary);
            addProgressStep("[ OK ] Nowe podsumowanie dla lektora gotowe.");
            
            setSummary(refinedSummary);
            setLectorSummary(refinedLectorSummary);
            
            if (comments) {
                 onDataLoaded({ video, comments, summary: refinedSummary, lectorSummary: refinedLectorSummary });
            }
            
            addProgressStep("Zakończono. Analiza wideo została zaktualizowana.");
        } catch (err) {
             const errorMessage = err instanceof Error ? err.message : "Nieznany błąd.";
             addProgressStep(`BŁĄD: Nie udało się zaktualizować analizy wideo. ${errorMessage}`);
        } finally {
            setIsRefining(false);
        }
    }, [summary, comments, video, onDataLoaded, addProgressStep]);
    
    const terminalTitle = isSummaryLoading ? "ANALIZA WIDEO" : (isRefining ? "AKTUALIZACJA W TOKU..." : "ANALIZA GOTOWA");

    return (
        <div className="space-y-8">
            <div>
                <button
                    onClick={onBack}
                    className="mb-6 bg-neutral-800 hover:bg-neutral-700 text-slate-300 font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Powrót do Analizy Kanału
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Player Fallback */}
                    <div className="relative group aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Obejrzyj ${video.snippet.title} na YouTube`}>
                             <img 
                                src={video.snippet.thumbnails.high.url} 
                                alt={video.snippet.title} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                                <PlayButtonIcon className="w-20 h-20 text-white/80 group-hover:text-white transition-all duration-300 transform group-hover:scale-110" />
                            </div>
                        </a>
                    </div>

                     {/* Video Title and Stats */}
                    <div className="bg-neutral-900/50 p-6 rounded-lg">
                        <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4">{video.snippet.title}</h2>
                        <div className="flex flex-wrap gap-6 text-slate-300">
                             <div className="flex items-center space-x-2">
                                <ViewsIcon className="h-6 w-6 text-blue-400"/>
                                <span className="font-semibold text-lg">{formatNumber(video.statistics.viewCount)}</span>
                                <span className="text-slate-400">Wyświetleń</span>
                             </div>
                            <div className="flex items-center space-x-2">
                                <LikesIcon className="h-6 w-6 text-wnet-yellow"/>
                                <span className="font-semibold text-lg">{formatNumber(video.statistics.likeCount)}</span>
                                <span className="text-slate-400">Polubień</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CommentsIcon className="h-6 w-6 text-green-400"/>
                                <span className="font-semibold text-lg">{formatNumber(video.statistics.commentCount)}</span>
                                <span className="text-slate-400">Komentarzy</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Summary */}
                    <AISummary 
                        summary={summary || ''} 
                        lectorSummary={lectorSummary || ''}
                        isLoading={isSummaryLoading}
                        isUpdating={isRefining}
                        channelName={video.snippet.channelTitle}
                    />
                    
                     {(isSummaryLoading || !!summary) && (
                         <div className="mt-8">
                             <AnalysisProgress
                                key={video.id}
                                steps={progressSteps}
                                title={terminalTitle}
                                showBootSequence={false}
                                isHumanInputEnabled={!isSummaryLoading && !isRefining && !!summary}
                                onHumanInputCommand={handleHumanInputForVideo}
                            />
                         </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                     {/* Comments Section */}
                    <div>
                        <h3 className="text-2xl font-bold mb-6 text-slate-100">Najlepsze Komentarze</h3>
                        {error ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg text-center">
                                <p>Nie udało się wczytać komentarzy.</p>
                            </div>
                        ) : comments === null ? (
                             <div className="space-y-4 animate-pulse-fast">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="bg-neutral-900 p-4 rounded-lg flex items-start space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-neutral-800"></div>
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                                            <div className="h-4 bg-neutral-800 rounded w-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : comments && comments.length > 0 ? (
                            <div className="space-y-4">
                                {comments.map(comment => {
                                    const snippet = comment.snippet.topLevelComment.snippet;
                                    return (
                                        <div key={comment.id} className="bg-neutral-900 p-4 rounded-lg flex items-start space-x-4">
                                            <img src={snippet.authorProfileImageUrl} alt={snippet.authorDisplayName} className="w-10 h-10 rounded-full" />
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <p className="font-semibold text-slate-200">{snippet.authorDisplayName}</p>
                                                    <p className="text-xs text-slate-500">{new Date(snippet.publishedAt).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-slate-300 text-sm" dangerouslySetInnerHTML={{ __html: snippet.textDisplay }}></p>
                                                <div className="flex items-center space-x-1 mt-2 text-slate-400">
                                                    <LikesIcon className="h-4 w-4 text-wnet-yellow" />
                                                    <span>{formatNumber(snippet.likeCount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 bg-neutral-900/50 p-8 rounded-lg">
                                <p>Nie znaleziono komentarzy do tego filmu lub komentarze są wyłączone.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoDetailView;