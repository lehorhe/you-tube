import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, ShareIcon, PlayIcon, StopIcon, LoadingSpinnerIcon, DownloadIcon, AudioWaveIcon } from './icons';
import UpdateNotification from './UpdateNotification';
import { exportToPdf, exportToGoogleDocs, sendToSlack } from '../services/exportService';
import { getAudioData } from '../services/elevenLabsService';

interface AISummaryProps {
    summary: string;
    lectorSummary: string;
    isLoading: boolean;
    isUpdating?: boolean;
    channelName: string;
    updateChangelog?: string | null;
    onDismissChangelog?: () => void;
    elevenLabsApiKey: string;
}

type AudioState = 'idle' | 'loading' | 'playing' | 'error';

const AISummary: React.FC<AISummaryProps> = ({ summary, lectorSummary, isLoading, isUpdating, channelName, updateChangelog, onDismissChangelog, elevenLabsApiKey }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');
    const [audioState, setAudioState] = useState<AudioState>('idle');
    const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement>(null);

    // Cleanup Blob URL when component unmounts or URL changes
    useEffect(() => {
        const currentUrl = audioUrl;
        return () => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [audioUrl]);

    // Reset state when summary or lector summary changes
    useEffect(() => {
        setAudioData(null);
        setAudioUrl(null); 
        setAudioState('idle');
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.src = '';
        }
    }, [summary, lectorSummary]);

    const handlePlayAudio = async () => {
        if (!audioPlayerRef.current) return;

        if (audioState === 'playing') {
            audioPlayerRef.current.pause();
            return;
        }

        if (audioState === 'loading') {
            return; // Do nothing while loading
        }
        
        // Use lectorSummary for audio generation
        if (!lectorSummary) {
             console.log("No lector summary available to play.");
             return;
        }

        // If we already have the URL, just play
        if (audioUrl) {
            audioPlayerRef.current.play();
            return;
        }

        if (!elevenLabsApiKey) {
            alert("Proszę podać klucz API ElevenLabs w ustawieniach.");
            return;
        }

        setAudioState('loading');
        try {
            const data = await getAudioData(lectorSummary, elevenLabsApiKey);
            setAudioData(data); // for download
            const blob = new Blob([data], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url); // This will trigger the useEffect below
        } catch (error) {
            console.error(error);
            setAudioState('error');
            setTimeout(() => setAudioState('idle'), 3000);
        }
    };
    
    // This effect triggers playback once the audio URL is ready
    useEffect(() => {
        if (audioUrl && audioPlayerRef.current) {
            audioPlayerRef.current.src = audioUrl;
            audioPlayerRef.current.play().catch(e => {
                console.error("Audio playback failed:", e);
                setAudioState('error');
            });
        }
    }, [audioUrl]);


    const handleDownloadAudio = () => {
        if (!audioData) return;

        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analiza_${channelName.replace(/ /g, '_')}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // A more robust markdown-to-HTML converter for better formatting
    const renderMarkdown = (text: string) => {
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic

        // Headers
        html = html.replace(/^(#+)\s(.*$)/gm, (match, hashes, content) => {
            const level = hashes.length;
            if (level === 1) return `<h3 class="text-xl font-bold text-sky-300 mt-6 mb-2">${content}</h3>`;
            if (level === 2) return `<h4 class="text-lg font-semibold text-sky-400 mt-4 mb-1">${content}</h4>`;
            return `<h${level}>${content}</h${level}>`;
        });

        // Lists
        html = html.replace(/^- (.*$)/gm, '<li class="flex items-start mb-1"><span class="mr-2 mt-1 text-sky-400">&#8227;</span><span>$1</span></li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>').replace(/<\/ul>\s?<ul>/g, '');


        // Paragraphs - wrap remaining blocks of text that are not headers or lists in <p> tags
        html = html.split(/\n\s*\n/).map(paragraph => {
            if (paragraph.trim().startsWith('<h') || paragraph.trim().startsWith('<ul')) {
                return paragraph;
            }
            if (paragraph.trim() === '') {
                return '';
            }
            // For paragraphs that already contain list elements, don't wrap in <p>
            if (paragraph.trim().startsWith('<ul>')) {
                return paragraph;
            }
            return `<p class="mb-4">${paragraph.replace(/\n/g, '<br />')}</p>`;
        }).join('');

        // Cleanup any empty paragraphs or incorrect list wrappings
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<\/ul><p><br \/><\/p><ul>/g, '');


        return { __html: html };
    };


    if (isLoading) {
         return (
             <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg animate-pulse-fast">
                <div className="flex items-center gap-3 mb-4">
                    <SparklesIcon className="h-6 w-6 text-yellow-400" />
                    <h3 className="text-xl font-bold text-slate-200">Twój ekspert...</h3>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
                    <div className="h-4 bg-neutral-700 rounded"></div>
                    <div className="h-4 bg-neutral-700 rounded w-5/6"></div>
                </div>
            </div>
         );
    }
    
    const getPlayButton = () => {
        const isDisabled = !elevenLabsApiKey || isLoading || isUpdating || !lectorSummary;
        let title = "Odsłuchaj analizę";
        if (!elevenLabsApiKey) title = "Dodaj klucz API ElevenLabs, aby odsłuchać";
        if (elevenLabsApiKey && !lectorSummary) title = "Brak streszczenia do odsłuchania";


        switch (audioState) {
            case 'loading':
                title = "Generowanie audio...";
                return <button title={title} disabled className="text-slate-400"><LoadingSpinnerIcon className="h-6 w-6" /></button>;
            case 'playing':
                 title = "Zatrzymaj odtwarzanie";
                return <button title={title} onClick={handlePlayAudio} className="text-slate-400 hover:text-white transition-colors"><StopIcon className="h-6 w-6" /></button>;
            case 'error':
                 title = "Błąd generowania audio";
                return <button title={title} disabled className="text-red-500"><StopIcon className="h-6 w-6" /></button>;
            case 'idle':
            default:
                return <button title={title} onClick={handlePlayAudio} disabled={isDisabled} className="text-slate-400 enabled:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><PlayIcon className="h-6 w-6" /></button>;
        }
    }
    
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg backdrop-blur-sm">
            <audio 
                ref={audioPlayerRef}
                onPlay={() => setAudioState('playing')}
                onPause={() => setAudioState('idle')}
                onEnded={() => setAudioState('idle')}
                onError={() => setAudioState('error')}
                hidden
            />
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <SparklesIcon className="h-6 w-6 text-yellow-400" />
                    <h3 className="text-xl font-bold text-slate-200">Twój ekspert...</h3>
                </div>
                <div className="flex items-center gap-4">
                    {isUpdating && (
                        <div className="flex items-center gap-2 text-xs text-yellow-400">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                            Aktualizuję...
                        </div>
                    )}
                     <div className="relative">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-400 hover:text-white transition-colors"
                            aria-label="Eksportuj lub udostępnij analizę"
                        >
                            <ShareIcon className="h-6 w-6" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10">
                                <ul className="p-2 text-sm text-slate-200">
                                    <li className="px-3 py-1.5 text-xs font-semibold text-slate-400">Eksportuj & Udostępnij</li>
                                    <li 
                                        onClick={() => { exportToPdf('ai-summary-content', channelName); setIsMenuOpen(false); }}
                                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-700 cursor-pointer"
                                    >
                                        <span>Eksportuj do PDF</span>
                                    </li>
                                    <li 
                                        onClick={() => { exportToGoogleDocs('ai-summary-content', channelName); setIsMenuOpen(false); }}
                                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-700 cursor-pointer"
                                    >
                                        <span>Otwórz w karcie (dla Google Docs)</span>
                                    </li>
                                    <li 
                                        onClick={() => { sendToSlack(summary); setCopyStatus('Skopiowano!'); setIsMenuOpen(false); setTimeout(() => setCopyStatus(''), 2000); }}
                                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-neutral-700 cursor-pointer"
                                    >
                                        <span>Kopiuj do schowka (dla Slack)</span>
                                        {copyStatus && <span className="text-xs text-green-400">{copyStatus}</span>}
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {updateChangelog && onDismissChangelog && (
                <div className="my-4">
                    <UpdateNotification 
                        changelog={updateChangelog} 
                        onDismiss={onDismissChangelog} 
                    />
                </div>
            )}
            
            {lectorSummary && (
                <div className="mb-6 bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className='flex items-center gap-2'>
                           <AudioWaveIcon className="h-5 w-5 text-slate-400"/>
                           <h4 className="font-bold text-slate-300">Streszczenie dla Lektora</h4>
                        </div>
                         <div className="flex items-center gap-2">
                            {getPlayButton()}
                            {audioData && (
                                <button title="Pobierz plik audio" onClick={handleDownloadAudio} className="text-slate-400 hover:text-white transition-colors">
                                    <DownloadIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 italic">{lectorSummary}</p>
                </div>
            )}


            <div
                id="ai-summary-content"
                className="prose prose-slate prose-invert max-w-none text-slate-300"
                dangerouslySetInnerHTML={renderMarkdown(summary)}
            />
        </div>
    );
};

export default AISummary;