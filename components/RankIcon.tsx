import React from 'react';

interface RankIconProps extends React.SVGProps<SVGSVGElement> {
    level: number;
}

const RankIcon: React.FC<RankIconProps> = ({ level, ...props }) => {
    switch (level) {
        case 1: // Początkujący Analityk
            return (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12h10.5" />
                </svg>
            );
        case 2: // Młodszy Analityk
            return (
                 <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 9h10.5m-10.5 6h10.5" />
                </svg>
            );
        case 3: // Analityk
            return (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5h10.5m-10.5 4.5h10.5m-10.5 4.5h10.5" />
                </svg>
            );
        case 4: // Starszy Strateg
            return (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.31h5.414a.562.562 0 01.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 21.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988h5.414a.563.563 0 00.475-.31L11.48 3.5z" />
                </svg>
            );
        case 5: // Mistrz Analizy
            return (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.095-4.43 3.75 3.75 0 017.81 0 9.75 9.75 0 011.095 4.43zM18.75 10.5h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375m-13.5 0h-.375a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h.375" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5v-3A3.375 3.375 0 0112.375 7.125 3.375 3.375 0 0115 10.5v3m-6-3h6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v2.25m0-11.25v-2.25" />
                </svg>
            );
        default:
            return (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            );
    }
};

export default RankIcon;
