import { getAudio, saveAudio, sha256 } from './audioCacheService';

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - a good general-purpose voice
// Use the NON-STREAMING endpoint and explicitly request the output format for maximum reliability, as recommended by the docs.
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;

/**
 * Gets audio data from cache or generates it using ElevenLabs API.
 * @param text The text to convert to speech.
 * @param apiKey Your ElevenLabs API key.
 * @returns A promise that resolves with the ArrayBuffer of the audio data.
 */
export const getAudioData = async (
    text: string,
    apiKey: string,
): Promise<ArrayBuffer> => {
    // Sanitize text to remove common markdown characters that might interfere
    const sanitizedText = text.replace(/[*_#`]/g, '');

    const textId = await sha256(sanitizedText);
    const cachedAudio = await getAudio(textId);

    if (cachedAudio) {
        console.log("Returning audio from cache.");
        return cachedAudio;
    }
    
    console.log("Fetching audio from ElevenLabs API (non-streaming).");
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
            'Accept': 'audio/mpeg', // Explicitly request MPEG audio
        },
        body: JSON.stringify({
            text: sanitizedText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                // DEPRECATED: similarity_boost: 0.75,
                // NEW, RECOMMENDED PARAMS FOR V2 MODELS:
                style: 0.5,
                use_speaker_boost: true,
            },
        }),
    });

    if (!response.ok) {
        // The error response might not be JSON. Try to parse but have a fallback.
        try {
            const errorData = await response.json();
            throw new Error(`ElevenLabs API Error: ${errorData.detail?.message || JSON.stringify(errorData)}`);
        } catch (e) {
             throw new Error(`ElevenLabs API Error: ${response.status} ${response.statusText}`);
        }
    }

    // The non-streaming endpoint returns the audio file directly as a buffer.
    const arrayBuffer = await response.arrayBuffer();

    await saveAudio(textId, arrayBuffer);
    console.log("Audio saved to cache.");

    return arrayBuffer;
};