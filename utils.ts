export const formatNumber = (num: number | string): string => {
    const number = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(number)) return '0';
    if (number < 1000) return number.toString();
    if (number < 1000000) return `${(number / 1000).toFixed(1)}K`;
    if (number < 1000000000) return `${(number / 1000000).toFixed(1)}M`;
    return `${(number / 1000000000).toFixed(1)}B`;
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
