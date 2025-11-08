import { GoogleGenAI } from "@google/genai";
import type { Channel, Video, CommentThread, Playlist, AnalysisResult } from '../types';
import {
    getChannelSummaryPrompt,
    getVideoSummaryPrompt,
    getLectorSummaryPrompt,
    getUpdateChannelSummaryPrompt,
    getUpdateChangelogPrompt,
    getRefineAnalysisPrompt
} from './promptTemplates';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODELS = {
    pro: 'gemini-2.5-pro',
    flash: 'gemini-2.5-flash',
};

/**
 * Centralna funkcja do wywoływania API Gemini z obsługą błędów.
 * @param model Nazwa modelu do użycia.
 * @param prompt Tekst zapytania do modelu.
 * @param config Opcjonalna konfiguracja dla zapytania.
 * @returns Odpowiedź tekstowa od modelu.
 */
const callGeminiApi = async (model: string, prompt: string, config?: object): Promise<string> => {
    try {
        if (!prompt || !prompt.trim()) {
            console.warn("Próba wywołania API Gemini z pustym promptem. Operacja przerwana.");
            return "";
        }

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            ...(config && { config }),
        });
        
        const text = response.text;
        if (!text) {
            throw new Error("API zwróciło pustą odpowiedź tekstową.");
        }
        return text;

    } catch (error) {
        console.error(`Błąd podczas wywoływania API Gemini z modelem ${model}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd";
        throw new Error(`Nie udało się wygenerować treści z API Gemini: ${errorMessage}`);
    }
};

/**
 * Generates a comprehensive summary for a YouTube channel, either standalone or in comparison to a competitor.
 */
export const generateChannelSummary = async (
    mainChannel: Channel,
    mainVideos: { longForm: Video[], shorts: Video[], liveStreams: Video[] },
    mainPlaylists: Playlist[],
    startDate: string,
    endDate: string,
    mainRevenue: AnalysisResult['estimatedRevenue'],
    competitorChannel?: Channel,
    competitorVideos?: { longForm: Video[], shorts: Video[], liveStreams: Video[] },
    competitorPlaylists?: Playlist[],
    competitorRevenue?: AnalysisResult['estimatedRevenue']
): Promise<string> => {
    const prompt = getChannelSummaryPrompt(
        mainChannel, mainVideos, mainPlaylists, startDate, endDate, mainRevenue,
        competitorChannel, competitorVideos, competitorPlaylists, competitorRevenue
    );
    return callGeminiApi(MODELS.pro, prompt);
};

/**
 * Generates a detailed summary for a single YouTube video, including an analysis of comments.
 */
export const generateVideoSummary = async (video: Video, comments: CommentThread[]): Promise<string> => {
    const prompt = getVideoSummaryPrompt(video, comments);
    return callGeminiApi(MODELS.pro, prompt);
};

/**
 * Generates a concise, spoken-word summary from a detailed analysis text.
 */
export const generateLectorSummary = async (fullAnalysis: string): Promise<string> => {
    if (!fullAnalysis || !fullAnalysis.trim()) {
        return "Brak analizy do streszczenia.";
    }
    const prompt = getLectorSummaryPrompt(fullAnalysis);
    return callGeminiApi(MODELS.flash, prompt, { temperature: 0.2 });
};


/**
 * Integrates new insights from a single video analysis into an existing channel summary.
 */
export const updateChannelSummaryWithVideoInsights = async (
    currentSummary: string,
    videoInsight: string
): Promise<string> => {
    const prompt = getUpdateChannelSummaryPrompt(currentSummary, videoInsight);
    return callGeminiApi(MODELS.pro, prompt);
};

/**
 * Generates a changelog by comparing an old summary with a new, updated one.
 */
export const generateUpdateChangelog = async (oldSummary: string, newSummary: string): Promise<string> => {
    const prompt = getUpdateChangelogPrompt(oldSummary, newSummary);
    return callGeminiApi(MODELS.flash, prompt);
};

/**
 * Refines an existing analysis based on a user's text command.
 */
export const refineAnalysis = async (currentAnalysis: string, command: string): Promise<string> => {
    const prompt = getRefineAnalysisPrompt(currentAnalysis, command);
    return callGeminiApi(MODELS.pro, prompt);
};
