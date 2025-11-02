import React from 'react';

interface QuickNavProps {
    hasVideos: boolean;
    hasShorts: boolean;
    hasLiveStreams: boolean;
    hasAiSummary: boolean;
    stickyTop: number;
}

const QuickNav: React.FC<QuickNavProps> = ({ hasVideos, hasShorts, hasLiveStreams, hasAiSummary, stickyTop }) => {
    const navItems = [
        { href: '#videos-section', label: 'Filmy', show: hasVideos, isSpecial: false },
        { href: '#shorts-section', label: 'Shorty', show: hasShorts, isSpecial: false },
        { href: '#livestreams-section', label: 'Transmisje', show: hasLiveStreams, isSpecial: false },
        { href: '#ai-summary-section', label: 'Ekspert', show: hasAiSummary, isSpecial: true },
    ];

    const visibleItems = navItems.filter(item => item.show);

    if (visibleItems.length === 0) {
        return null;
    }
    
    const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        event.preventDefault();
        const id = href.substring(1); // remove '#'
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
            });
        }
    };

    return (
        <nav 
            className="sticky z-20 bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-full p-2 max-w-md mx-auto"
            style={{ top: `${stickyTop + 16}px` }}
        >
            <ul className="flex justify-center items-center gap-2">
                {visibleItems.map(item => (
                    <li key={item.href}>
                        <a 
                            href={item.href}
                            onClick={(e) => handleNavClick(e, item.href)}
                             className={`block px-4 py-2 rounded-full font-semibold transition-all duration-200 cursor-pointer text-sm ${
                                item.isSpecial 
                                    ? 'bg-wnet-yellow text-black hover:opacity-90' 
                                    : 'text-slate-300 hover:bg-neutral-800 hover:text-wnet-yellow'
                            }`}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default QuickNav;