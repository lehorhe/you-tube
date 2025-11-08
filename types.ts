export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}

export interface Thumbnails {
    default: Thumbnail;
    medium: Thumbnail;
    high: Thumbnail;
}

export interface ChannelStatistics {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
}

export interface ChannelSnippet {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: Thumbnails;
}

export interface ChannelBrandingSettings {
    image?: {
        bannerExternalUrl?: string;
    };
}

export interface Channel {
    id: string;
    snippet: ChannelSnippet;
    statistics: ChannelStatistics;
    brandingSettings: ChannelBrandingSettings;
}

export interface VideoStatistics {
    viewCount: string;
    likeCount: string;
    commentCount: string;
}

export interface VideoSnippet {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: Thumbnails;
    channelTitle: string;
}

export interface VideoContentDetails {
    duration: string;
}

export interface LiveStreamingDetails {
    actualStartTime?: string;
    actualEndTime?: string;
    scheduledStartTime?: string;
}

export interface Video {
    id: string;
    snippet: VideoSnippet;
    statistics: VideoStatistics;
    contentDetails: VideoContentDetails;
    liveStreamingDetails?: LiveStreamingDetails;
}

export interface CommentSnippet {
    authorDisplayName: string;
    authorProfileImageUrl: string;
    textDisplay: string;
    likeCount: number;
    publishedAt: string;
}

export interface TopLevelComment {
    snippet: CommentSnippet;
}

export interface CommentThread {
    id: string;
    snippet: {
        topLevelComment: TopLevelComment;
    };
}

export interface AnalyzedVideo {
    video: Video;
    summary: string;
    lectorSummary: string;
    comments: CommentThread[];
}

export interface PlaylistSnippet {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: Thumbnails;
}

export interface Playlist {
    id: string;
    snippet: PlaylistSnippet;
}

// New type for storing analysis results
export interface AnalysisResult {
    id: string;
    channelData: Channel;
    playlists: Playlist[];
    videoData: { longForm: Video[], shorts: Video[], liveStreams: Video[] };
    aiSummary: string;
    lectorSummary?: string;
    startDate: string;
    endDate: string;
    isComparative: boolean;
    channelName: string;
    integratedVideoIds: string[];
    analyzedVideos?: { [videoId: string]: AnalyzedVideo };
    estimatedRevenue: {
        longForm: number;
        shorts: number;
        liveStreams: number;
        total: number;
    };
}