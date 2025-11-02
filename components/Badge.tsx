import React from 'react';

interface BadgeProps {
    isUnlocked: boolean;
    icon: React.ReactNode;
    title: string;
    unlockedDescription: string;
    lockedDescription: string;
}

const Badge: React.FC<BadgeProps> = ({ isUnlocked, icon, title, unlockedDescription, lockedDescription }) => {
    return (
        <div 
            className={`relative group flex items-center justify-center aspect-square rounded-lg transition-all duration-300 ${
                isUnlocked 
                    ? 'bg-wnet-yellow/10 border-2 border-wnet-yellow/50 text-wnet-yellow' 
                    : 'bg-neutral-800 text-slate-600 grayscale'
            }`}
        >
            {icon}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="font-bold">{title}</p>
                <p>{isUnlocked ? unlockedDescription : lockedDescription}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900"></div>
            </div>
        </div>
    );
};

export default Badge;