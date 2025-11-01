
import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => {
    return (
        <div className="bg-neutral-900/50 backdrop-blur-sm p-6 rounded-lg shadow-md flex items-center space-x-4">
            <div className="flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;