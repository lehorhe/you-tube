// This tells TypeScript that these variables are loaded globally from the <script> tags in index.html
declare const jspdf: any;
declare const html2canvas: any;

/**
 * Exports the content of a given HTML element to a PDF file.
 * @param elementId The ID of the HTML element to export.
 * @param channelName The name of the channel for the filename.
 */
export const exportToPdf = async (elementId: string, channelName: string) => {
    const { jsPDF } = jspdf;
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found.`);
        return;
    }

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#1a1a1a', // Corresponds to wnet-dark
            scale: 2, // Higher scale for better quality
        });
        const imgData = canvas.toDataURL('image/png');
        
        // A4 dimensions in points: 595.28 x 841.89
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        
        const contentWidth = pdfWidth - 40; // with some margin
        const contentHeight = contentWidth / ratio;

        pdf.addImage(imgData, 'PNG', 20, 20, contentWidth, contentHeight);

        const fileName = `analiza_${channelName.replace(/ /g, '_')}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error("Error generating PDF:", error);
    }
};

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

/**
 * Copies the analysis (in Markdown format) to the clipboard for pasting into Slack.
 * @param markdownContent The raw markdown string of the summary.
 */
export const sendToSlack = (markdownContent: string) => {
    if (!navigator.clipboard) {
        console.error("Clipboard API not available.");
        return;
    }
    navigator.clipboard.writeText(markdownContent).then(() => {
        console.log("Copied to clipboard for Slack!");
    }).catch(err => {
        console.error("Failed to copy text for Slack:", err);
    });
};
