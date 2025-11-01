import React from 'react';

interface QuickNavProps {
    hasVideos: boolean;
    hasShorts: boolean;
    hasLiveStreams: boolean;
}

const QuickNav: React.FC<QuickNavProps> = ({ hasVideos, hasShorts, hasLiveStreams }) => {
    const navItems = [
        { href: '#videos-section', label: 'Filmy', show: hasVideos },
        { href: '#shorts-section', label: 'Shorty', show: hasShorts },
        { href: '#livestreams-section', label: 'Transmisje', show: hasLiveStreams },
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
        <nav className="sticky top-4 z-20 bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-full p-2 max-w-md mx-auto">
            <ul className="flex justify-center items-center gap-2">
                {visibleItems.map(item => (
                    <li key={item.href}>
                        <a 
                            href={item.href}
                            onClick={(e) => handleNavClick(e, item.href)}
                            className="block px-4 py-2 rounded-full font-semibold text-slate-300 hover:bg-neutral-800 hover:text-wnet-yellow transition-all duration-200 cursor-pointer"
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