import React from 'react';

interface FooterProps {
    onNewAnalysisClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNewAnalysisClick }) => {
    return (
        <footer className="w-full bg-neutral-900 border-t border-neutral-800 p-2 text-center text-xs text-slate-500 flex items-center justify-center gap-4 flex-shrink-0">
            <span>
                © 2025 Radio Wnet, Lech R. Rustecki. Oparte na YouTube Data API i Google Gemini.
            </span>
            <button
                onClick={onNewAnalysisClick}
                className="px-3 py-1 rounded-full font-semibold transition-colors duration-200 bg-neutral-700 hover:bg-neutral-600 text-slate-300"
            >
                Nowa analiza
            </button>
        </footer>
    );
};

export default Footer;