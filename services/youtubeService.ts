import type { Channel, Video, CommentThread, Playlist } from '../types';
import { parseISO8601Duration } from '../utils';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = 'AIzaSyBatPYmVZYZL_Ri10LOLRDiStdPp68rvdw';

const handleApiError = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Wystąpił nieznany błąd API.';
        if (errorMessage.includes('key invalid')) {
             throw new Error("Klucz API YouTube jest nieprawidłowy lub nieaktywny.");
        }
        if (errorMessage.includes('not found')) {
            throw new Error("Nie znaleziono kanału o podanym ID.");
        }
        if(errorMessage.includes('quotaExceeded')) {
            throw new Error("Przekroczono limit zapytań API YouTube. Spróbuj ponownie później.");
        }
        if (errorMessage.includes('comments are disabled')) {
             throw new Error("disabled comments");
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

export const getChannelStats = async (channelId: string): Promise<Channel> => {
    const url = `${API_BASE_URL}/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await handleApiError(response);
    if (!data.items || data.items.length === 0) {
        throw new Error("Nie znaleziono kanału. Sprawdź ID kanału.");
    }
    return data.items[0];
};

export const getChannelVideos = async (channelId: string, startDate: string, endDate: string): Promise<{ longForm: Video[], shorts: Video[], liveStreams: Video[] }> => {
    const videoIds: string[] = [];
    let nextPageToken: string | undefined = undefined;

    const startDateISO = new Date(startDate).toISOString();
    const endDateISO = new Date(endDate);
    endDateISO.setHours(23, 59, 59, 999);
    const endDateISOString = endDateISO.toISOString();

    do {
        const searchUrl = new URL(`${API_BASE_URL}/search`);
        searchUrl.searchParams.set('part', 'id');
        searchUrl.searchParams.set('channelId', channelId);
        searchUrl.searchParams.set('publishedAfter', startDateISO);
        searchUrl.searchParams.set('publishedBefore', endDateISOString);
        searchUrl.searchParams.set('type', 'video');
        searchUrl.searchParams.set('maxResults', '50');
        searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
        if (nextPageToken) {
            searchUrl.searchParams.set('pageToken', nextPageToken);
        }

        const response = await fetch(searchUrl.toString());
        const data = await handleApiError(response);

        data.items.forEach((item: any) => videoIds.push(item.id.videoId));
        nextPageToken = data.nextPageToken;

    } while (nextPageToken);

    if (videoIds.length === 0) {
        return { longForm: [], shorts: [], liveStreams: [] };
    }

    const allVideos: Video[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
        const chunkIds = videoIds.slice(i, i + 50);
        const detailsUrl = `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${chunkIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(detailsUrl);
        const data = await handleApiError(response);
        allVideos.push(...data.items);
    }

    const longForm: Video[] = [];
    const shorts: Video[] = [];
    const liveStreams: Video[] = [];

    allVideos.forEach(video => {
        if (!video.contentDetails?.duration) {
            return;
        }
        
        const contentDurationSeconds = parseISO8601Duration(video.contentDetails.duration);
        const isShort = contentDurationSeconds > 0 && contentDurationSeconds <= 60;

        const isTrueLiveStream = video.liveStreamingDetails?.actualStartTime &&
                                 video.liveStreamingDetails?.actualEndTime &&
                                 (() => {
                                     const broadcastStart = new Date(video.liveStreamingDetails.actualStartTime as string).getTime();
                                     const broadcastEnd = new Date(video.liveStreamingDetails.actualEndTime as string).getTime();
                                     const broadcastDurationSeconds = (broadcastEnd - broadcastStart) / 1000;
                                     return Math.abs(broadcastDurationSeconds - contentDurationSeconds) < 60; 
                                 })();

        if (isTrueLiveStream) {
            liveStreams.push(video);
        } else if (isShort) {
            shorts.push(video);
        } else {
            longForm.push(video);
        }
    });
    
    return { longForm, shorts, liveStreams };
};

export const getChannelPlaylists = async (channelId: string): Promise<Playlist[]> => {
    const allPlaylists: Playlist[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
        const url = new URL(`${API_BASE_URL}/playlists`);
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('channelId', channelId);
        url.searchParams.set('maxResults', '50');
        url.searchParams.set('key', YOUTUBE_API_KEY);
        if (nextPageToken) {
            url.searchParams.set('pageToken', nextPageToken);
        }

        const response = await fetch(url.toString());
        const data = await handleApiError(response);
        
        allPlaylists.push(...data.items);
        nextPageToken = data.nextPageToken;

    } while (nextPageToken && allPlaylists.length < 200); // Limit to 200 to avoid excessive API calls for huge channels

    return allPlaylists;
};

export const getVideoComments = async (videoId: string): Promise<CommentThread[]> => {
    const url = `${API_BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=30&key=${YOUTUBE_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await handleApiError(response);
        return data.items || [];
    } catch (error) {
        const err = error as Error;
        if (err.message.includes('disabled comments')) {
            return []; // Return empty array if comments are disabled, not an error
        }
        console.error("Failed to fetch comments:", err);
        throw err; // Re-throw other errors
    }
};