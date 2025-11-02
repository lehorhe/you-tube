import React, { forwardRef } from 'react';
import ChannelInput from './ChannelInput';
import { WnetLogo, SparklesIcon, Cog6ToothIcon } from './icons';

// Extend ChannelInputProps with isOpen and setIsOpen
interface ControlsProps extends React.ComponentProps<typeof ChannelInput> {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Controls = forwardRef<HTMLDivElement, ControlsProps>((
    { isOpen, setIsOpen, ...channelInputProps }, 
    ref
) => {
    return (
        <div ref={ref} className="sticky top-0 z-30 mb-8 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="bg-wnet-dark/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
                <header className="text-center mb-4">
                    <WnetLogo className="h-12 mx-auto mb-4" />
                    <div className="flex justify-center items-center gap-4 mb-2">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-wnet-yellow to-amber-500">
                           WOJNA KANAŁÓW
                        </h1>
                         <SparklesIcon className="h-10 w-10 text-yellow-400" />
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                       Monetyzator YouTube'a bawi i uczy. Wybierz konkurenta!
                    </p>
                </header>
                 <div className="flex justify-center mb-4">
                    <button 
                        onClick={() => setIsOpen(!isOpen)} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-neutral-800 hover:bg-neutral-700 text-slate-300 transition-colors"
                    >
                        <Cog6ToothIcon className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                        {isOpen ? "Ukryj Ustawienia" : "Pokaż Ustawienia Analizy"}
                    </button>
                </div>
            </div>
            
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
                <div className="px-4 sm:px-6 lg:px-8 pb-4">
                    <ChannelInput {...channelInputProps} />
                </div>
            </div>
             <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent"></div>
        </div>
    );
});

export default Controls;