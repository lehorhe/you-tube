import type { AnalyzedVideo, Channel } from "../types";
import { formatNumber } from "../utils";

/**
 * Opens a new browser tab with the formatted analysis content, ready to be copied to Google Docs.
 * @param elementId The ID of the HTML element containing the content.
 * @param channelName The name of the channel for the document title.
 */
export const exportToGoogleDocs = (elementId: string, channelName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const content = element.innerHTML;
    const title = `Analiza Kanału: ${channelName}`;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 800px; margin: 40px auto; }
                        h3 { color: #1a73e8; }
                        h4 { color: #1a73e8; }
                        strong { font-weight: bold; }
                        em { font-style: italic; }
                        ul { padding-left: 20px; }
                        li { margin-bottom: 5px; }
                        .copy-notice { background-color: #e8f0fe; border: 1px solid #1a73e8; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <div class="copy-notice">
                        <h2>Gotowe do wklejenia!</h2>
                        <p>Skopiuj tę zawartość (naciśnij <b>Ctrl+A</b>, a następnie <b>Ctrl+C</b>) i wklej do nowego Dokumentu Google.</p>
                    </div>
                    <h1>${title}</h1>
                    ${content}
                </body>
            </html>
        `);
        newWindow.document.close();
    }
};

interface ExportChannel {
    channelData: Channel;
    channelAnalysis?: {
        summary: string;
        lectorSummary?: string;
    };
    videoAnalyses: AnalyzedVideo[];
}

const renderMarkdownToHTML = (text: string) => {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^(#+)\s(.*$)/gm, (match, hashes, content) => {
        const level = hashes.length;
        if (level <= 2) return `<h${level + 2}>${content}</h${level + 2}>`;
        return `<h4}>${content}</h4>`;
    });
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>').replace(/<\/ul>\s?<ul>/g, '');
    html = html.split(/\n\s*\n/).map(p => {
        if (p.trim().startsWith('<h') || p.trim().startsWith('<ul')) return p;
        if (p.trim() === '') return '';
        return `<p>${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');
    return html;
};


export const exportAnalysesToHTML = (
    analyses: ExportChannel[],
    allChannels: Channel[]
) => {

    const channelDetailsMap = new Map(allChannels.map(c => [c.id, c.snippet]));

    const bodyContent = analyses.map(analysis => {
        let channelHtml = `<div class="channel-section">
            <h1 class="channel-title">${analysis.channelData.snippet.title}</h1>`;

        if (analysis.channelAnalysis) {
            channelHtml += '<h2>Analiza Kanału</h2>';
            if (analysis.channelAnalysis.lectorSummary) {
                channelHtml += `<div class="lector-summary">
                    <h3>Streszczenie dla Lektora</h3>
                    <p><em>${analysis.channelAnalysis.lectorSummary}</em></p>
                </div>`;
            }
            channelHtml += `<div class="analysis-content">${renderMarkdownToHTML(analysis.channelAnalysis.summary)}</div>`;
        }

        if (analysis.videoAnalyses.length > 0) {
            channelHtml += '<h2 class="video-section-title">Analizy Materiałów Wideo</h2>';
            analysis.videoAnalyses.forEach(videoAnalysis => {
                const video = videoAnalysis.video;
                channelHtml += `<div class="video-analysis">
                    <h3>${video.snippet.title}</h3>
                    <p class="video-meta">Opublikowano: ${new Date(video.snippet.publishedAt).toLocaleString('pl-PL')}</p>
                    `;
                 if (videoAnalysis.lectorSummary) {
                    channelHtml += `<div class="lector-summary video-lector-summary">
                        <h4>Streszczenie dla Lektora</h4>
                        <p><em>${videoAnalysis.lectorSummary}</em></p>
                    </div>`;
                }
                channelHtml += `<div class="analysis-content">${renderMarkdownToHTML(videoAnalysis.summary)}</div>`;
                
                if (videoAnalysis.comments.length > 0) {
                    channelHtml += `<div class="comments-section">
                        <h4>Najpopularniejsze Komentarze</h4>`;
                    videoAnalysis.comments.forEach(commentThread => {
                        const comment = commentThread.snippet.topLevelComment.snippet;
                        channelHtml += `<div class="comment">
                            <p class="comment-author">${comment.authorDisplayName} (👍 ${formatNumber(comment.likeCount)})</p>
                            <p class="comment-text">${comment.textDisplay}</p>
                        </div>`;
                    });
                    channelHtml += `</div>`;
                }
                channelHtml += `</div>`;
            });
        }

        channelHtml += '</div>';
        return channelHtml;
    }).join('');


    const html = `
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <title>Eksport Analiz YouTube</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #e0e0e0; background-color: #1a1a1a; max-width: 900px; margin: 2rem auto; padding: 2rem; }
                .channel-section { margin-bottom: 4rem; padding-bottom: 2rem; border-bottom: 2px solid #444; }
                .channel-section:last-child { border-bottom: none; }
                .channel-title { font-size: 2.5rem; color: #FFAF2D; margin-bottom: 1.5rem; border-bottom: 1px solid #FFAF2D; padding-bottom: 0.5rem; }
                h2 { font-size: 1.8rem; color: #eee; margin-top: 2.5rem; margin-bottom: 1rem; }
                h3 { font-size: 1.4rem; color: #87CEEB; margin-top: 2rem; margin-bottom: 0.5rem; }
                h4 { font-size: 1.1rem; color: #87CEEB; margin-top: 1rem; margin-bottom: 0.5rem; }
                .analysis-content { background-color: #262626; padding: 1.5rem; border-radius: 8px; border: 1px solid #333; }
                p { margin-bottom: 1rem; }
                strong { color: #FFAF2D; }
                ul { list-style-type: '◆ '; padding-left: 20px; }
                li { margin-bottom: 0.5rem; }
                .lector-summary { background-color: #2c2c2c; border-left: 4px solid #FFAF2D; padding: 1rem 1.5rem; margin: 1.5rem 0; border-radius: 4px; }
                .video-lector-summary h4 { color: #ddd; }
                .video-analysis { margin-bottom: 2.5rem; padding-left: 1.5rem; border-left: 3px solid #555; }
                .video-meta { font-size: 0.9rem; color: #aaa; font-style: italic; }
                .comments-section { margin-top: 1.5rem; background-color: #222; padding: 1rem; border-radius: 6px; }
                .comment { border-bottom: 1px solid #444; padding: 0.8rem 0; }
                .comment:last-child { border-bottom: none; }
                .comment-author { font-weight: bold; color: #ccc; font-size: 0.9rem; }
                .comment-text { color: #ddd; margin-top: 0.3rem; }
            </style>
        </head>
        <body>
            ${bodyContent}
        </body>
        </html>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
    }
};