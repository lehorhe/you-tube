import React, { useState, useEffect } from 'react';
import type { Video, CommentThread } from '../types';
import { getVideoComments } from '../services/youtubeService';
import { generateVideoSummary, generateLectorSummary } from '../services/geminiService';
import { formatNumber } from '../utils';
import { LikesIcon, CommentsIcon, ViewsIcon, PlayButtonIcon } from './icons';
import AISummary from './AISummary';

interface VideoDetailViewProps {
    video: Video;
    apiKey: string;
    onBack: () => void;
    cachedData?: { comments: CommentThread[]; summary: string; lectorSummary: string; };
    onDataLoaded: (data: { comments: CommentThread[]; summary: string; lectorSummary: string; }) => void;
    elevenLabsApiKey: string;
}

const VideoDetailView: React.FC<VideoDetailViewProps> = ({ video, apiKey, onBack, cachedData, onDataLoaded, elevenLabsApiKey }) => {
    const [comments, setComments] = useState<CommentThread[]>([]);
    const [summary, setSummary] = useState<string | null>(null);
    const [lectorSummary, setLectorSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (cachedData) {
                // Cache hit: Use cached data
                setComments(cachedData.comments);
                setSummary(cachedData.summary);
                setLectorSummary(cachedData.lectorSummary);
                setIsLoading(false);
                return;
            }

            // Cache miss: Fetch new data
            setIsLoading(true);
            setError(null);
            try {
                const fetchedComments = await getVideoComments(apiKey, video.id);
                const generatedSummary = await generateVideoSummary(video, fetchedComments);
                const generatedLectorSummary = await generateLectorSummary(generatedSummary);
                
                setComments(fetchedComments);
                setSummary(generatedSummary);
                setLectorSummary(generatedLectorSummary);

                // Update the parent's cache
                onDataLoaded({ comments: fetchedComments, summary: generatedSummary, lectorSummary: generatedLectorSummary });

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd.";
                setError(`Nie udało się wczytać szczegółów wideo: ${errorMessage}`);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [video, apiKey, cachedData, onDataLoaded]);

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
                        isLoading={isLoading} 
                        channelName={video.snippet.channelTitle}
                        elevenLabsApiKey={elevenLabsApiKey}
                    />
                </div>

                <div className="lg:col-span-1">
                     {/* Comments Section */}
                    <div>
                        <h3 className="text-2xl font-bold mb-6 text-slate-100">Najlepsze Komentarze</h3>
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-start space-x-4 p-4 bg-neutral-900 rounded-lg animate-pulse-fast">
                                        <div className="w-12 h-12 rounded-full bg-neutral-800"></div>
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
                                            <div className="h-4 bg-neutral-800 rounded w-full"></div>
                                            <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg text-center">
                                <p>Nie udało się wczytać komentarzy.</p>
                            </div>
                        ) : comments.length > 0 ? (
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