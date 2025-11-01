import { GoogleGenAI } from "@google/genai";
import type { Channel, Video, CommentThread } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

type VideoCollection = { longForm: Video[], shorts: Video[], liveStreams: Video[] };

const formatVideoList = (videos: Video[], count: number, recent = false): string => {
    if (videos.length === 0) return "Brak filmów w tej kategorii w wybranym zakresie.";

    const sortedVideos = recent
        ? [...videos].sort((a, b) => new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime())
        : videos; 

    return sortedVideos
        .slice(0, count)
        .map(video => `- "${video.snippet.title}" z ${parseInt(video.statistics.viewCount).toLocaleString()} wyświetleniami.`)
        .join('\n');
};

const calculateAverage = (items: Video[]): string => {
    if (items.length === 0) return '0';
    const totalViews = items.reduce((sum, video) => sum + parseInt(video.statistics.viewCount), 0);
    return Math.round(totalViews / items.length).toLocaleString();
};

const formatChannelDataForPrompt = (
    channel: Channel,
    videos: VideoCollection
): string => {
    const { longForm, shorts, liveStreams } = videos;
    return `
- Nazwa: ${channel.snippet.title}
- Opis Kanału: ${channel.snippet.description}
- Data Założenia: ${new Date(channel.snippet.publishedAt).toLocaleDateString('pl-PL')}
- Subskrybenci: ${parseInt(channel.statistics.subscriberCount).toLocaleString()}
- Łączne Wyświetlenia: ${parseInt(channel.statistics.viewCount).toLocaleString()}
- Łączna Liczba Filmów (VOD): ${parseInt(channel.statistics.videoCount).toLocaleString()}

**Dane o Wynikach Treści (Content Performance Data):**

*Filmy Długometrażowe (Long-Form Videos):*
- Łączna liczba w zakresie dat: ${longForm.length}
- Średnia wyświetleń: ${calculateAverage(longForm)}
- Najpopularniejsze filmy (Top Performing):
${formatVideoList(longForm, 5)}
- Ostatnie filmy (Recent):
${formatVideoList(longForm, 5, true)}

*Shorts:*
- Łączna liczba w zakresie dat: ${shorts.length}
- Średnia wyświetleń: ${calculateAverage(shorts)}
- Najpopularniejsze Shorts (Top Performing):
${formatVideoList(shorts, 5)}

*Transmisje na Żywo (Live Streams):*
- Łączna liczba w zakresie dat: ${liveStreams.length}
- Średnia wyświetleń (powtórek): ${calculateAverage(liveStreams)}
- Najpopularniejsze transmisje (Top Performing):
${formatVideoList(liveStreams, 5)}
`;
};

export const generateChannelSummary = async (
    channel: Channel, 
    videos: VideoCollection,
    competitorChannel?: Channel,
    competitorVideos?: VideoCollection
): Promise<string> => {
    const model = 'gemini-2.5-flash';
    let prompt: string;

    if (competitorChannel && competitorVideos) {
        // Comparative Analysis Prompt
        prompt = `
Jesteś głównym strategiem ds. treści wideo i analitykiem w multimedialnej organizacji informacyjnej Radio Wnet. Twoim zadaniem jest przygotowanie analizy porównawczej (benchmarku) kanału Radio Wnet względem kluczowego konkurenta na rynku. Raport jest przeznaczony dla zespołu YouTube (Lech, Konrad, Ksenia, Łukasz, Kaśka) na ich środowe kolegium.

Raport musi być wnikliwy, strategiczny i napisany przystępnym językiem. Celem jest wyciągnięcie konkretnych wniosków i lekcji dla Radia Wnet z analizy działań konkurenta.

Przeanalizuj poniższe, rozbudowane dane obu kanałów i przedstaw zwięzłe, kompleksowe podsumowanie w dobrze sformatowanym Markdown. Skup się na strategiach, które Radio Wnet może zaadaptować lub których powinno unikać.

Podsumowanie powinno zawierać:

**🎯 Podsumowanie i Główne Wnioski (Executive Summary):**
*   Kto "wygrał" analizowany okres pod względem kluczowych wskaźników (wyświetlenia, dynamika)? Jaka jest główna różnica w strategiach obu kanałów, widoczna w danych?
*   Jaka jest jedna, kluczowa lekcja dla Radia Wnet płynąca z analizy konkurenta w tym okresie?

**📊 Porównanie Strategii Treści (Content Strategy Benchmark):**
*   **Filmy Długometrażowe:** Porównaj najpopularniejsze materiały obu kanałów. Jakie tematy/formaty przyniosły sukces konkurentowi? Czy są to tematy, które Radio Wnet pominęło? Jaki jest stosunek treści newsowych do evergreen u konkurencji w porównaniu do Radia Wnet?
*   **Shorts:** Jaką strategię Shorts stosuje konkurent? (np. szybkie newsy, fragmenty wywiadów, viralowe trendy). Jak efektywna jest w porównaniu do strategii Radia Wnet? Co możemy zaadaptować?
*   **Transmisje na Żywo:** Porównaj wyniki i formaty transmisji. Czy konkurent organizuje dedykowane wydarzenia live, które angażują widownię inaczej niż retransmisje Radia Wnet?

**📈 Analiza Tematów i Zaangażowania:**
*   Zidentyfikuj filary tematyczne, które przyniosły konkurentowi największy sukces. Czy pokrywają się one z tematyką Radia Wnet, czy też konkurent odkrył nową, angażującą niszę?
*   Gdzie widać większe zaangażowanie (komentarze, lajki w stosunku do wyświetleń) i dlaczego?

**💡 Lekcje i Rekomendacje dla Radia Wnet (Actionable Insights):**
*   Na podstawie analizy, wymień 2-3 konkretne, strategiczne możliwości dla Radia Wnet. (np. "Konkurent odniósł sukces formatem 'X', powinniśmy przetestować naszą wersję", "Ich podejście do tytułów generuje wyższy CTR, przeanalizujmy je").
*   Zaproponuj 3 konkretne pomysły na treści dla Radia Wnet, inspirowane sukcesami konkurenta, ale dostosowane do profilu i misji Radia Wnet.
    *   1 pomysł na film długometrażowy.
    *   1 pomysł na serię Shorts.
    *   1 pomysł na ulepszenie/nowy format transmisji na żywo.

**🔗 Wnioski do Koordynacji (Dla Adama, Filipa, Kuby):**
*   Które elementy strategii konkurenta powinny być przedyskutowane na kolegium koordynacyjnym w kontekście Portalu i social mediów? Czy ich treści wideo są lepiej zintegrowane z innymi platformami?

---
**DANE KANAŁU ANALIZOWANEGO (RADIO WNET):**
${formatChannelDataForPrompt(channel, videos)}
---
**DANE KANAŁU PORÓWNAWCZEGO (BENCHMARK):**
${formatChannelDataForPrompt(competitorChannel, competitorVideos)}
---

Proszę, rozpocznij analizę porównawczą na potrzeby kolegium.
`;
    } else {
        // Original Single Channel Analysis Prompt
        prompt = `
Jesteś głównym strategiem ds. treści wideo i analitykiem w multimedialnej organizacji informacyjnej Radio Wnet. Twoim zadaniem jest przygotowanie cotygodniowego raportu analitycznego dla zespołu YouTube (Lech, Konrad, Ksenia, Łukasz, Kaśka) na ich środowe kolegium.

Raport musi być głęboko analityczny, ale napisany przystępnym językiem, gotowym do dyskusji. Musi uwzględniać nową strategię organizacji, skupioną wokół centralnego Portalu i koordynacji dystrybucji (zarządzanej przez Adama).

Przeanalizuj poniższe, rozbudowane dane kanału YouTube i przedstaw zwięzłe, wnikliwe i kompleksowe podsumowanie w dobrze sformatowanym Markdown. Skup się na strategiach specyficznych dla kanału informacyjnego w ekosystemie radiowo-portalowym.

Podsumowanie powinno zawierać:

🧬 **Podsumowanie i Witalność Kanału (Executive Summary):**
* Wysokopoziomowa ocena ogólnej kondycji kanału (wzrost subskrybentów, wyświetleń) w kontekście ostatnich działań i nowej struktury.
* Jakie jest tempo wzrostu? Czy ostatnie zmiany (np. wprowadzenie portalu) miały już jakiś mierzalny wpływ na ruch z YouTube?

📊 **Analiza Strategii Treści (Radio vs. YouTube-First):**
* **Filmy Długometrażowe (Long-Form):**
    * Które formaty dominują pod względem wyników: materiały "Radio-First" (treści z anteny od Hani) czy "YouTube-First" (dedykowane videocasty)?
    * Analiza Top Performing Videos: Czy sukces wynika z newsów "breaking news" (reaktywność), czy z dogłębnych analiz (evergreen)? Jakie tematy/goście są "samograjami"?
* **Shorts:**
    * Jaka jest rola Shorts? (Szybkie newsy, zapowiedzi, fragmenty z radia/portalu).
    * Ocena Top Performing Shorts: Co przyciąga widzów? Czy efektywnie promują dłuższe treści lub portal?
* **Transmisje na Żywo (Live Streams):**
    * Jaka jest rola transmisji? (Głównie retransmisja radia, czy dedykowane wydarzenia YT?).
    * Analiza Top Performing Live Streams: Które programy lub wydarzenia "na żywo" generują największe zaangażowanie i czas oglądania?

📈 **Analiza Tematów i Zaangażowania:**
* Identyfikacja kluczowych filarów tematycznych (np. polityka, gospodarka, kultura), które generują największe zaangażowanie.
* Gdzie dyskusja (komentarze) jest najbardziej ożywiona? Czy pokrywa się to z materiałami "Radio-First" czy "YouTube-First"?

🎯 **Punkty do Dyskusji (Wnioski dla Zespołu YouTube):**
* Na podstawie danych, jakie 2-3 strategiczne możliwości stoją przed zespołem YouTube w nadchodzącym tygodniu? (np. "Podwojenie formatu X", "Testowanie nowej pory publikacji dla Y").
* Zaproponuj 3 konkretne, kreatywne pomysły na treści (w różnych formatach), które prawdopodobnie zarezonują z publicznością:
    * 1 pomysł na film długometrażowy (np. nowa seria YouTube-First lub adaptacja audycji radiowej).
    * 1 pomysł na serię Shorts (np. bazująca na popularnym temacie z radia).
    * 1 pomysł na transmisję na żywo (np. Q&A z autorem audycji).

🔗 **Rekomendacje do Koordynacji (Dla Adama i Filipa):**
* Które z analizowanych, najlepiej działających treści powinny być mocniej promowane przez Adama i Kubę Węgrzyna na social mediach (X, FB, IG, TikTok)?
* Które materiały wideo mają największy potencjał do obudowania artykułem na Portalu przez Filipa (i odwrotnie - które artykuły z portalu powinny stać się materiałem wideo)?
* Jakie wnioski zespół YouTube powinien przedstawić na kolegium koordynacyjnym po Poranku Wnet?

---
**Dane Kanału (Channel Data):**
${formatChannelDataForPrompt(channel, videos)}
---

Proszę, rozpocznij kompleksową analizę na potrzeby kolegium.
`;
    }

    try {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating channel summary with Gemini:", error);
        throw new Error("Failed to generate AI summary. The API call may have failed.");
    }
};

export const generateVideoSummary = async (
    video: Video,
    comments: CommentThread[]
): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const topComments = comments.slice(0, 10).map(comment => 
        `- (👍 ${comment.snippet.topLevelComment.snippet.likeCount}) "${comment.snippet.topLevelComment.snippet.textDisplay}"`
    ).join('\n');

    const prompt = `
        Jesteś analitykiem w zespole YouTube Radia Wnet (Lech, Konrad, Ksenia, Łukasz, Kaśka). Twoim zadaniem jest przygotowanie zwięzłej "karty analizy" dla pojedynczego materiału wideo na nadchodzące środowe kolegium redakcyjne.

    Analiza musi być szybka, wnikliwa i zawierać konkretne rekomendacje do dyskusji.

    Przeanalizuj poniższe dane i przedstaw ocenę w formacie Markdown, dzieląc ją na cztery kluczowe sekcje:

    **📝 Podsumowanie i Kategoryzacja Treści:**
    * Na podstawie tytułu i opisu, streść w 1-2 zdaniach, o czym jest ten materiał.
    * **Zidentyfikuj typ materiału:** Czy jest to "Radio-First" (treść z anteny radiowej od Hani), "YouTube-First" (dedykowany videocast), czy "Live Stream" (transmisja/retransmisja)?

    **🚀 Analiza Wyników i Zaangażowania:**
    * Oceń wyniki (wyświetlenia, polubienia, komentarze) w kontekście typu materiału (patrz wyżej). Czy radzi sobie lepiej/gorzej niż średnia dla tej kategorii?
    * Oblicz wskaźnik zaangażowania (Engagement Rate) **dokładnie według wzoru**: \`(Polubienia + Komentarze) / Wyświetlenia * 100%\`. Pokaż obliczenia.
    * Zinterpretuj wynik ER (np. "Wskaźnik X% jest wysoki jak na materiał 'Radio-First', co sugeruje, że temat mocno rezonuje z widownią YT").
    * Zidentyfikuj potencjalne przyczyny sukcesu (lub porażki): aktualność, gość, chwytliwy tytuł, **dobre wsparcie promocyjne na Portalu/social mediach (Kuba/Adam)**?

    **💬 Sentyment Społeczności (Analiza Komentarzy):**
    * Jaki jest ogólny sentyment widzów (pozytywny, negatywny, merytoryczna dyskusja, polaryzacja)?
    * Zidentyfikuj 1-2 kluczowe tematy lub pytania, które powtarzają się w komentarzach.
    * **Co z komentarzy jest użytecznym feedbackiem** dla autora audycji (do przekazania Hani) lub dla zespołu produkcyjnego (Asi i Szymona)?

    💡 **Rekomendacja dla Zespołu (Co Dalej?):**
    * Na podstawie tej analizy, co rekomendujesz? (Wybierz jedną lub dwie opcje):
        * (Do Adama/Filipa): "Zaproponować mocniejszą promocję na Portalu/SM".
        * (Do Zespołu YT): "Stworzyć serię Shorts z najlepszymi fragmentami".
        * (Do Zespołu YT/Rádia): "Kontynuować ten temat / Zaprosić tego gościa ponownie".
        * (Do Zespołu YT): "Zastosować podobny format/tytuł w przyszłości".
        * (Inne): "Brak działań, materiał osiągnął swój potencjał".

    ---
    **Dane Materiału Wideo:**
    - Tytuł: "${video.snippet.title}"
    - Opis: "${video.snippet.description.substring(0, 500)}..."
    - Data publikacji: ${new Date(video.snippet.publishedAt).toLocaleString('pl-PL')}
    - Wyświetlenia: ${parseInt(video.statistics.viewCount).toLocaleString()}
    - Polubienia: ${parseInt(video.statistics.likeCount).toLocaleString()}
    - Komentarze: ${parseInt(video.statistics.commentCount).toLocaleString()}

    **Najpopularniejsze Komentarze:**
    ${topComments.length > 0 ? topComments : "Brak komentarzy do analizy."}
    ---

    Proszę, rozpocznij analizę tego konkretnego materiału wideo.
    `;

     try {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating video summary with Gemini:", error);
        throw new Error("Failed to generate AI summary for the video.");
    }
}

export const updateChannelSummaryWithVideoInsights = async (
    originalSummary: string,
    videoAnalysis: string
): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const prompt = `
        Jesteś analitykiem-strategiem w Radiu Wnet. Twoim zadaniem jest pogłębienie istniejącej analizy kanału o nowe, szczegółowe dane dotyczące jednego z kluczowych materiałów wideo.

        Poniżej znajduje się **istniejąca, ogólna analiza kanału** oraz nowa, **szczegółowa analiza jednego wideo**.

        Twoje zadanie:
        1.  **Zintegruj wnioski** z analizy wideo z ogólną analizą kanału. Nie dołączaj po prostu nowej analizy na końcu. Zamiast tego, **wzbogać i zaktualizuj** odpowiednie sekcje oryginalnej analizy, aby odzwierciedlały nową wiedzę.
        2.  Szczególnie zwróć uwagę, czy szczegółowa analiza wideo potwierdza, zaprzecza, czy może uzupełnia wnioski z ogólnej analizy.
        3.  Jeśli analiza wideo dostarcza konkretnego przykładu na poparcie ogólnego trendu zidentyfikowanego w analizie kanału, **wyraźnie to zaznacz** (np. "Doskonałym przykładem naszego sukcesu w formacie X jest materiał Y, którego szczegółowa analiza pokazuje...").
        4.  Zachowaj oryginalną strukturę i formatowanie Markdown. Wynik powinien wyglądać jak ulepszona wersja oryginalnej analizy, a nie dwa oddzielne dokumenty.

        ---
        **ISTNIEJĄCA ANALIZA KANAŁU (DO AKTUALIZACJI):**
        ---
        ${originalSummary}
        ---
        **NOWA, SZCZEGÓŁOWA ANALIZA WIDEO (DO ZINTEGROWANIA):**
        ---
        ${videoAnalysis}
        ---

        Proszę, przedstaw zaktualizowaną i wzbogaconą analizę kanału.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error updating channel summary with Gemini:", error);
        throw new Error("Failed to update AI summary with video insights.");
    }
};

export const generateUpdateChangelog = async (
    oldSummary: string,
    newSummary: string
): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const prompt = `
        Jesteś asystentem AI, którego zadaniem jest informowanie użytkownika o zmianach w analizie.
        Porównaj poniższą STARĄ i NOWĄ wersję analizy kanału YouTube. Zidentyfikuj, jakie kluczowe, **nowe wnioski** zostały dodane do NOWEJ wersji, bazując na szczegółowej analizie konkretnego filmu.

        Twoje zadanie:
        - Stwórz bardzo zwięzłą, 1-2 punktową listę w Markdown, która podsumowuje najważniejsze nowe informacje.
        - Skup się wyłącznie na tym, co zostało dodane lub pogłębione. Nie opisuj, co pozostało bez zmian.
        - Użyj języka, który jasno pokazuje, że analiza została "wzbogacona o nowe detale".

        Przykład:
        *   Szczegółowa analiza filmu "X" potwierdziła, że nasza strategia dotycząca gości specjalnych przynosi ponadprzeciętne zaangażowanie.
        *   Dodano nową rekomendację dotyczącą tworzenia serii Shorts z najciekawszych fragmentów wywiadów, co było bezpośrednim wnioskiem z analizy komentarzy pod filmem.

        ---
        **STARA ANALIZA:**
        ---
        ${oldSummary}
        ---
        **NOWA, WZBOGACONA ANALIZA:**
        ---
        ${newSummary}
        ---

        Proszę, wygeneruj krótkie podsumowanie zmian.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating update changelog with Gemini:", error);
        throw new Error("Failed to generate update changelog.");
    }
};

export const generateLectorSummary = async (fullAnalysis: string): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const prompt = `
        Jesteś lektorem i redaktorem w Radiu Wnet, przygotowującym krótkie, dynamiczne "intro" do podcastu analitycznego. Twoim zadaniem jest przeczytanie poniższej, szczegółowej analizy kanału YouTube i stworzenie na jej podstawie zwięzłego, 2-3 akapitowego streszczenia.

        **Kryteria:**
        - **Format:** Tekst mówiony, angażujący, jak zapowiedź w radiu.
        - **Cel:** Uchwycenie najważniejszych wniosków i rekomendacji z pełnej analizy.
        - **Długość:** Maksymalnie 150 słów. To kluczowe, streszczenie musi być krótkie.
        - **Styl:** Profesjonalny, ale przystępny. Używaj zwrotów takich jak "Co z tego wynika?", "Kluczowa lekcja to...", "W skrócie...".

        **PEŁNA ANALIZA (MATERIAŁ ŹRÓDŁOWY):**
        ---
        ${fullAnalysis}
        ---

        Proszę, przygotuj teraz krótkie, mówione podsumowanie tej analizy.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating lector summary with Gemini:", error);
        throw new Error("Failed to generate lector summary.");
    }
};