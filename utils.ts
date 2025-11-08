import type { Video } from './types';

export const RPM_LONG_FORM = 10.32; // (10048.85 PLN / 973700 views) * 1000
export const RPM_SHORTS = 0.27;    // (32.66 PLN / 122500 views) * 1000
export const RPM_LIVE_STREAM = 16.15; // (626.77 PLN / 38800 views) * 1000

export const formatNumber = (num: number | string): string => {
    const number = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(number)) return '0';
    if (number < 1000) return number.toString();
    if (number < 1000000) return `${(number / 1000).toFixed(1)}K`;
    if (number < 1000000000) return `${(number / 1000000).toFixed(1)}M`;
    return `${(number / 1000000000).toFixed(1)}B`;
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
    }).format(amount);
};


/**
 * Parses an ISO 8601 duration string (e.g., "PT2M10S") into seconds.
 * @param duration The ISO 8601 duration string.
 * @returns The total duration in seconds.
 */
export const parseISO8601Duration = (duration: string): number => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) {
        return 0;
    }
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Formats seconds into a HH:MM:SS or MM:SS string.
 * @param seconds The total duration in seconds.
 * @returns The formatted time string.
 */
export const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const hStr = h > 0 ? `${h}:` : '';
    const mStr = m < 10 && h > 0 ? `0${m}` : m;
    const sStr = s < 10 ? `0${s}` : s;

    return `${hStr}${mStr}:${sStr}`;
};

/**
 * Calculates the engagement rate of a video.
 * @param video The video object.
 * @returns The engagement rate as a percentage.
 */
export const calculateEngagementRate = (video: Video): number => {
    const views = parseInt(video.statistics.viewCount, 10);
    if (views === 0) return 0;
    const likes = parseInt(video.statistics.likeCount, 10);
    const comments = parseInt(video.statistics.commentCount, 10);
    return ((likes + comments) / views) * 100;
};

/**
 * Estimates revenue based on view count and RPM.
 * @param viewCount The number of views.
 * @param rpm The revenue per mille (1000 views).
 * @returns The estimated revenue.
 */
export const estimateRevenue = (viewCount: number, rpm: number): number => {
    return (viewCount / 1000) * rpm;
};


export type { Video };