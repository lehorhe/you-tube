
import React from 'react';
import type { Channel } from '../types';
import { formatNumber } from '../utils';
import StatCard from './StatCard';
import { SubscribersIcon, ViewsIcon, VideosIcon } from './icons';

interface ChannelHeaderProps {
    channel: Channel;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel }) => {
    const bannerUrl = channel.brandingSettings.image?.bannerExternalUrl || 'https://picsum.photos/1200/300';
    const avatarUrl = channel.snippet.thumbnails.high.url;

    return (
        <div className="relative mb-16">
            <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden">
                <img src={bannerUrl} alt="Channel banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-wnet-dark via-wnet-dark/50 to-transparent"></div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 transform translate-y-1/2">
                <div className="flex flex-col sm:flex-row items-center sm:items-end">
                    <img src={avatarUrl} alt={channel.snippet.title} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-neutral-800 shadow-lg bg-neutral-700"/>
                    <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white shadow-text">
                            {channel.snippet.title}
                        </h2>
                        <p className="text-slate-400 mt-1 line-clamp-2">{channel.snippet.description}</p>
                    </div>
                </div>
            </div>

            <div className="mt-24 sm:mt-28 grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <StatCard 
                    icon={<SubscribersIcon className="h-8 w-8 text-wnet-yellow" />} 
                    label="Subskrybenci" 
                    value={formatNumber(channel.statistics.subscriberCount)} 
                />
                <StatCard 
                    icon={<ViewsIcon className="h-8 w-8 text-blue-400" />} 
                    label="Łączne Wyświetlenia" 
                    value={formatNumber(channel.statistics.viewCount)} 
                />
                <StatCard 
                    icon={<VideosIcon className="h-8 w-8 text-green-400" />} 
                    label="Łączna Liczba Filmów" 
                    value={formatNumber(channel.statistics.videoCount)} 
                />
            </div>
        </div>
    );
};

export default ChannelHeader;