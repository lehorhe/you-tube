import React from 'react';

interface AnalysisProgressProps {
    steps: string[];
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ steps }) => {
    return (
        <div className="bg-black border border-green-500/50 rounded-lg p-4 font-mono text-green-400 text-sm shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all duration-300">
            <div className="h-48 overflow-y-auto pr-2">
                {steps.map((step, index) => (
                    <p key={index} className="whitespace-pre-wrap leading-relaxed">
                        {step}
                    </p>
                ))}
                <div className="flex">
                    <span>&gt;&nbsp;</span>
                    <span className="flex-1 h-5 animate-blink bg-green-400 w-2"></span>
                </div>
            </div>
        </div>
    );
};

export default AnalysisProgress;