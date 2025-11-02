import React from 'react';
import { SparklesIcon, OpenInNewIcon, AudioWaveIcon } from './icons';
import UpdateNotification from './UpdateNotification';
import { exportToGoogleDocs } from '../services/exportService';

interface AISummaryProps {
    summary: string;
    lectorSummary: string;
    isLoading: boolean;
    isUpdating?: boolean;
    channelName: string;
    updateChangelog?: string | null;
    onDismissChangelog?: () => void;
}

const AISummary: React.FC<AISummaryProps> = ({ summary, lectorSummary, isLoading, isUpdating, channelName, updateChangelog, onDismissChangelog }) => {
    
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
    
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg backdrop-blur-sm">
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
                     <button 
                        onClick={() => exportToGoogleDocs('ai-summary-content', channelName)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Otwórz w nowej karcie (dla Google Docs)"
                    >
                        <OpenInNewIcon className="h-6 w-6" />
                    </button>
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
