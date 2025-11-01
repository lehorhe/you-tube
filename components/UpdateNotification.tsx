import React from 'react';
import { CheckCircleIcon } from './icons';

interface UpdateNotificationProps {
    changelog: string;
    onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ changelog, onDismiss }) => {

    const renderMarkdown = (text: string) => {
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\* (.*$)/gm, '<li class="flex items-start mb-1"><span class="mr-2 mt-1 text-green-300">&#8227;</span><span>$1</span></li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul class="list-none p-0">$1</ul>').replace(/<\/ul>\s?<ul>/g, '');
        return { __html: html };
    };

    return (
        <div className="bg-green-500/10 border border-green-500/50 text-green-200 px-4 py-4 rounded-lg relative shadow-lg animate-fade-in">
            <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-lg mb-2">Analiza została wzbogacona!</h4>
                    <div 
                        className="text-sm prose-p:mb-1"
                        dangerouslySetInnerHTML={renderMarkdown(changelog)} 
                    />
                </div>
            </div>
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 text-green-200/60 hover:text-green-200/90 transition-colors"
                aria-label="Zamknij powiadomienie"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            {/* FIX: The `jsx` prop on the style tag is a feature of styled-jsx (used in Next.js) and is not supported in a standard React setup. Removing it resolves the TypeScript error. The styles will be injected globally. */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default UpdateNotification;