import React, { useState, useEffect } from 'react';

interface ChannelInputProps {
    onFetch: () => void;
    isLoading: boolean;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    channelId: string;
    setChannelId: (id: string) => void;
    predefinedChannels: { id: string; name: string }[];
}

type Preset = 'today' | 'yesterday' | 'lastWeek' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth';

const ChannelInput: React.FC<ChannelInputProps> = ({ 
    onFetch, isLoading,
    startDate, setStartDate,
    endDate, setEndDate,
    channelId, setChannelId, predefinedChannels
 }) => {
    const [activePreset, setActivePreset] = useState<Preset | null>('last7');

    const toISODateString = (date: Date) => date.toISOString().split('T')[0];

    const handlePresetSelect = (preset: Preset) => {
        setActivePreset(preset);
        const now = new Date();
        let newStartDate: Date;
        let newEndDate = new Date(now);

        switch (preset) {
            case 'today':
                newStartDate = new Date();
                break;
            case 'yesterday':
                newStartDate = new Date();
                newStartDate.setDate(now.getDate() - 1);
                newEndDate = new Date(newStartDate);
                break;
             case 'lastWeek':
                const today = new Date();
                const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
                const lastSaturday = new Date(today);
                lastSaturday.setDate(today.getDate() - (dayOfWeek + 1) % 7);
                const lastSunday = new Date(lastSaturday);
                lastSunday.setDate(lastSaturday.getDate() - 6);
                newStartDate = lastSunday;
                newEndDate = lastSaturday;
                break;
            case 'last7':
                newStartDate = new Date();
                newStartDate.setDate(now.getDate() - 7);
                break;
            case 'last30':
                newStartDate = new Date();
                newStartDate.setDate(now.getDate() - 30);
                break;
            case 'thisMonth':
                newStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'lastMonth':
                newStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                newEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
        }
        
        setStartDate(toISODateString(newStartDate));
        setEndDate(toISODateString(newEndDate));
    };
    
    // Clear active preset if dates are changed manually
    useEffect(() => {
        setActivePreset(null);
    }, [startDate, endDate]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFetch();
    };

    const presetButtons: { key: Preset, label: string }[] = [
        { key: 'today', label: 'Dzisiaj' },
        { key: 'yesterday', label: 'Wczoraj' },
        { key: 'lastWeek', label: 'Ostatni tydzień' },
        { key: 'last7', label: 'Ostatnie 7 dni' },
        { key: 'last30', label: 'Ostatnie 30 dni' },
        { key: 'thisMonth', label: 'Ten miesiąc' },
        { key: 'lastMonth', label: 'Ostatni miesiąc' },
    ];

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 shadow-lg mb-6">
            <div className="mb-6">
                <label htmlFor="channel-select" className="block text-sm font-medium text-slate-400 mb-2">Wybierz Kanał</label>
                 <div className="relative">
                    <select
                        id="channel-select"
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        disabled={isLoading}
                        className="w-full appearance-none bg-neutral-800 border-2 border-neutral-700 rounded-lg text-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wnet-yellow/50 focus:border-wnet-yellow transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {predefinedChannels.map(channel => (
                            <option key={channel.id} value={channel.id} className="bg-neutral-900 text-slate-200">
                                {channel.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-400 mb-2">Wybierz Zakres Dat</label>
                <div className="flex flex-wrap gap-2 mb-4">
                     {presetButtons.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handlePresetSelect(key)}
                            disabled={isLoading}
                            className={`px-4 py-1.5 rounded-full font-medium transition-all duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-wnet-dark focus:ring-wnet-yellow ${
                                activePreset === key
                                    ? 'bg-wnet-yellow text-black'
                                    : 'bg-neutral-700 hover:bg-neutral-600 text-slate-300'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-lg text-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-wnet-yellow/50 focus:border-wnet-yellow transition disabled:opacity-50"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-lg text-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-wnet-yellow/50 focus:border-wnet-yellow transition disabled:opacity-50"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>
            
            <button
                type="submit"
                disabled={isLoading || !channelId}
                className="w-full flex items-center justify-center bg-wnet-yellow hover:opacity-90 disabled:bg-neutral-600 disabled:cursor-not-allowed text-black font-bold rounded-full px-6 py-3 transition-all duration-300 shadow-md"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analizuję...
                    </>
                ) : (
                    'Analizuj Kanał'
                )}
            </button>
        </form>
    );
};

export default ChannelInput;