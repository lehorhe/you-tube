import { GoogleGenAI } from "@google/genai";
import type { Channel, Video, CommentThread } from '../types';

// FIX: Initialize the GoogleGenAI client according to the guidelines.
// The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const formatVideosForPrompt = (videos: Video[]) => {
    if (videos.length === 0) return 'Brak filmów w tym okresie.';
    // Limit to top 20 most popular videos to keep the prompt concise and within token limits.
    return videos
        .slice(0, 20)
        .map(v => `- "${v.snippet.title}" (Wyświetlenia: ${v.statistics.viewCount}, Polubienia: ${v.statistics.likeCount}, Komentarze: ${v.statistics.commentCount})`)
        .join('\n');
};

/**
 * Generates a comprehensive summary for a YouTube channel, either standalone or in comparison to a competitor.
 */
export const generateChannelSummary = async (
    mainChannel: Channel,
    mainVideos: { longForm: Video[], shorts: Video[], liveStreams: Video[] },
    competitorChannel?: Channel,
    competitorVideos?: { longForm: Video[], shorts: Video[], liveStreams: Video[] }
): Promise<string> => {
    let prompt = '';
    const allMainVideos = [...mainVideos.longForm, ...mainVideos.shorts, ...mainVideos.liveStreams];
    
    if (competitorChannel && competitorVideos) {
        // Comparative analysis prompt
        const allCompetitorVideos = [...competitorVideos.longForm, ...competitorVideos.shorts, ...competitorVideos.liveStreams];
        prompt = `
Jesteś ekspertem od analizy kanałów YouTube dla polskiego medium informacyjnego Radio Wnet. Twoim zadaniem jest przeprowadzenie szczegółowej analizy porównawczej kanału Radio Wnet z kanałem konkurencyjnym. Analiza powinna być napisana w języku polskim, w profesjonalnym, ale przystępnym tonie, używając formatowania Markdown.

**Kanał Główny (Radio Wnet):**
- Nazwa: ${mainChannel.snippet.title}
- Subskrybenci: ${mainChannel.statistics.subscriberCount}
- Łączna liczba filmów: ${mainChannel.statistics.videoCount}
- Łączna liczba wyświetleń: ${mainChannel.statistics.viewCount}

**Najpopularniejsze materiały kanału Radio Wnet w analizowanym okresie:**
${formatVideosForPrompt(allMainVideos)}

**Kanał Konkurencyjny:**
- Nazwa: ${competitorChannel.snippet.title}
- Subskrybenci: ${competitorChannel.statistics.subscriberCount}
- Łączna liczba filmów: ${competitorChannel.statistics.videoCount}
- Łączna liczba wyświetleń: ${competitorChannel.statistics.viewCount}

**Najpopularniejsze materiały kanału Konkurencyjnego w analizowanym okresie:**
${formatVideosForPrompt(allCompetitorVideos)}

**Twoje zadania:**

1.  **Podsumowanie i Kluczowe Wnioski (Executive Summary):** Rozpocznij od zwięzłego podsumowania (2-3 zdania), które wskazuje na główne różnice i podobieństwa oraz najważniejszy wniosek z porównania.
2.  **Analiza Mocnych Stron Konkurenta:** Zidentyfikuj i opisz 3-4 kluczowe mocne strony kanału konkurencyjnego. Co robią lepiej lub inaczej niż Radio Wnet? Analizuj tematykę, formaty, częstotliwość publikacji, tytuły, miniatury (na podstawie tytułów) i zaangażowanie.
3.  **Analiza Słabych Stron Konkurenta:** Wskaż 2-3 potencjalne słabości lub obszary do poprawy u konkurenta. Gdzie Radio Wnet ma przewagę?
4.  **Rekomendacje dla Radia Wnet:** Na podstawie analizy, sformułuj 3-5 konkretnych, praktycznych rekomendacji dla kanału Radio Wnet. Co Radio Wnet może zaadaptować, czego unikać, a co robić, aby zwiększyć swoją konkurencyjność? Rekomendacje powinny być umotywowane danymi i obserwacjami.
5.  **Potencjalne Zagrożenia i Szanse:** Zidentyfikuj jedno kluczowe zagrożenie ze strony konkurenta i jedną największą szansę dla Radia Wnet, która wyłania się z tego porównania.

**Formatowanie:** Użyj Markdown. Stosuj nagłówki (np. ##), pogrubienia (**), listy punktowane (-) dla przejrzystości.
`;
    } else {
        // Single channel analysis prompt
        prompt = `
Jesteś ekspertem od analizy kanałów YouTube dla polskiego medium informacyjnego Radio Wnet. Twoim zadaniem jest przeprowadzenie szczegółowej analizy kanału. Analiza powinna być napisana w języku polskim, w profesjonalnym, ale przystępnym tonie, używając formatowania Markdown.

**Analizowany Kanał:**
- Nazwa: ${mainChannel.snippet.title}
- Subskrybenci: ${mainChannel.statistics.subscriberCount}
- Łączna liczba filmów: ${mainChannel.statistics.videoCount}
- Łączna liczba wyświetleń: ${mainChannel.statistics.viewCount}

**Najpopularniejsze materiały w analizowanym okresie:**
${formatVideosForPrompt(allMainVideos)}

**Twoje zadania:**

1.  **Podsumowanie i Kluczowe Wnioski (Executive Summary):** Rozpocznij od zwięzłego podsumowania (2-3 zdania) ogólnej kondycji kanału w badanym okresie. Co się wyróżnia? Jaki jest główny trend?
2.  **Analiza Contentu:**
    *   **Tematyka:** Jakie tematy dominują? Czy są jakieś "gorące" tematy, które generują ponadprzeciętne zaangażowanie?
    *   **Formaty:** Jakie formaty wideo (np. wywiady, relacje, programy studyjne, shorty) osiągają najlepsze wyniki?
    *   **Największe Sukcesy:** Wskaż 2-3 materiały, które były największymi sukcesami i wyjaśnij, dlaczego (np. "trafiony" temat, gość, chwytliwy tytuł).
    *   **Niewykorzystany Potencjał:** Wskaż 1-2 materiały, które miały niższe wyniki, niż można by się spodziewać. Spróbuj zdiagnozować przyczynę.
3.  **Rekomendacje:** Na podstawie analizy, sformułuj 3-5 konkretnych, praktycznych rekomendacji dla kanału. Co warto kontynuować, co zmienić, a co zacząć robić, aby zwiększyć zasięgi i zaangażowanie?
4.  **Szanse i Zagrożenia:** Zidentyfikuj jedną największą szansę (np. nowy format, seria, trend) i jedno kluczowe zagrożenie (np. spadek zainteresowania danym tematem, rosnąca konkurencja w niszy) dla kanału w najbliższej przyszłości.

**Formatowanie:** Użyj Markdown. Stosuj nagłówki (np. ##), pogrubienia (**), listy punktowane (-) dla przejrzystości.
`;
    }

    // FIX: Use ai.models.generateContent according to guidelines
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    
    // FIX: Extract text output using response.text
    return response.text;
};

/**
 * Generates a detailed summary for a single YouTube video, including an analysis of comments.
 */
export const generateVideoSummary = async (video: Video, comments: CommentThread[]): Promise<string> => {
    const commentsForPrompt = comments.length > 0
        ? comments
            .slice(0, 30)
            .map(c => `- "${c.snippet.topLevelComment.snippet.textDisplay.replace(/\n/g, ' ').substring(0, 150)}..." (Polubienia: ${c.snippet.topLevelComment.snippet.likeCount})`)
            .join('\n')
        : 'Brak komentarzy do analizy.';
        
    const prompt = `
Jesteś ekspertem-analitykiem mediów dla polskiego medium informacyjnego. Twoim zadaniem jest dogłębna analiza pojedynczego materiału wideo z YouTube. Analiza musi być w języku polskim, obiektywna, oparta na danych i sformułowana w formie raportu w formacie Markdown.

**Analizowany Materiał Wideo:**
- **Tytuł:** ${video.snippet.title}
- **Opis (fragment):** ${video.snippet.description.substring(0, 200)}...
- **Statystyki:**
  - Wyświetlenia: ${video.statistics.viewCount}
  - Polubienia: ${video.statistics.likeCount}
  - Komentarze: ${video.statistics.commentCount}

**Reprezentatywne Komentarze Widzów (najbardziej trafne):**
${commentsForPrompt}

**Twoje zadania:**

1.  **Streszczenie Tematyki i Głównego Przekazu:** W 2-3 zdaniach streść, o czym jest ten materiał. Jaka jest główna teza lub poruszany problem?
2.  **Analiza Reakcji Widzów (na podstawie komentarzy):**
    *   **Główny Sentyment:** Jaki jest ogólny odbiór materiału przez komentujących (pozytywny, negatywny, mieszany, polaryzujący)?
    *   **Kluczowe Wątki w Dyskusji:** Zidentyfikuj 2-3 główne tematy lub argumenty, które pojawiają się w komentarzach. Co najbardziej poruszyło widzów?
    *   **Cytaty lub Parafrazy:** Przytocz 1-2 cytaty lub parafrazy komentarzy, które najlepiej oddają nastroje publiczności.
3.  **Ocena Potencjału Viralowego i Mocnych Stron:**
    *   Co sprawiło, że ten materiał odniósł sukces (lub porażkę)? Analizuj tytuł, temat, gości, kontrowersyjność.
    *   Czy materiał miał potencjał, by stać się viralem? Dlaczego tak/nie?
4.  **Rekomendacja:** Krótka rekomendacja dla redakcji: Czy warto tworzyć więcej podobnych treści? Jeśli tak, co można w nich ulepszyć, bazując na reakcjach widzów?

**Formatowanie:** Użyj Markdown. Stosuj nagłówki (np. ##), pogrubienia (**), listy punktowane (-) dla przejrzystości.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    
    return response.text;
};

/**
 * Generates a concise, spoken-word summary from a detailed analysis text.
 */
export const generateLectorSummary = async (fullAnalysis: string): Promise<string> => {
    if (!fullAnalysis || !fullAnalysis.trim()) {
        return "Brak analizy do streszczenia.";
    }

    const prompt = `
Jesteś redaktorem przygotowującym materiały dla lektora w radiu informacyjnym. Otrzymałeś szczegółową analizę (poniżej). Twoim zadaniem jest stworzenie na jej podstawie BARDZO krótkiego, zwięzłego streszczenia (maksymalnie 2-3 zdania, ok. 25-40 słów). Streszczenie musi uchwycić absolutnie najważniejszy wniosek lub kluczową rekomendację z całej analizy. Powinno być napisane prostym, mówionym językiem, gotowym do przeczytania na antenie.

**Pełna Analiza:**
---
${fullAnalysis}
---

**Twoje zadanie:** Wygeneruj tylko i wyłącznie tekst streszczenia dla lektora. Bez żadnych dodatkowych nagłówków czy wstępów.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.2,
        },
    });

    return response.text.trim();
};


/**
 * Integrates new insights from a single video analysis into an existing channel summary.
 */
export const updateChannelSummaryWithVideoInsights = async (
    currentSummary: string,
    videoInsight: string
): Promise<string> => {
    const prompt = `
Jesteś edytorem AI, którego zadaniem jest inteligentne zaktualizowanie istniejącego raportu analitycznego o nowe informacje. Poniżej znajduje się główna analiza kanału oraz nowa, szczegółowa analiza jednego z materiałów wideo z tego kanału.

Twoim zadaniem jest zintegrowanie wniosków z analizy wideo z główną analizą kanału. Nie przepisuj wszystkiego. Zamiast tego, zidentyfikuj, gdzie wnioski z analizy wideo mogą wzbogacić, potwierdzić lub zakwestionować wnioski z analizy ogólnej.

**Główna Analiza Kanału:**
---
${currentSummary}
---

**Nowe Wnioski z Analizy Konkretnego Wideo:**
---
${videoInsight}
---

**Instrukcje:**
1.  **Zachowaj Strukturę:** Utrzymaj oryginalną strukturę (nagłówki, sekcje) głównej analizy.
2.  **Wzbogać, Nie Zastępuj:** Dodaj nowe informacje w odpowiednich sekcjach. Na przykład, jeśli analiza wideo pokazuje sukces konkretnego formatu, dodaj zdanie o tym w sekcji "Analiza Contentu" lub "Rekomendacje" w głównej analizie.
3.  **Bądź Subtelny:** Integracja powinna być płynna. Używaj sformułowań takich jak "Dobrym przykładem jest materiał [tytuł], który...", "Potwierdza to analiza filmu [tytuł], gdzie widzowie..."
4.  **Nie Dodawaj Nowych Sekcji:** Nie twórz osobnej sekcji dla analizy wideo. Informacje z niej mają stać się częścią istniejących sekcji.
5.  **Zwróć Pełny, Zaktualizowany Raport:** Twoim wynikiem końcowym powinien być kompletny, zaktualizowany tekst głównej analizy, zawierający już nowe wnioski.

**Wygeneruj zaktualizowaną, pełną analizę kanału.**
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    
    return response.text;
};

/**
 * Generates a changelog by comparing an old summary with a new, updated one.
 */
export const generateUpdateChangelog = async (oldSummary: string, newSummary: string): Promise<string> => {
    const prompt = `
Jesteś asystentem AI, który pomaga analitykowi zrozumieć, co zmieniło się w raporcie po dodaniu nowych danych. Poniżej znajdują się dwie wersje tego samego raportu: "stara" i "nowa" (zaktualizowana o szczegółową analizę jednego wideo).

Twoim zadaniem jest wygenerowanie krótkiej, zwięzłej listy zmian (changelog) w formacie Markdown, która podsumowuje najważniejsze dodane informacje. Skup się na **NOWYCH WNIOSKACH**, a nie na kosmetycznych zmianach w sformułowaniach.

**Stara Wersja Raportu:**
---
${oldSummary}
---

**Nowa Wersja Raportu:**
---
${newSummary}
---

**Przykład, jak powinien wyglądać wynik:**
**Analiza została wzbogacona o:**
* **Konkretny przykład sukcesu:** Wskazano, że film "Tytuł filmu" jest świetnym przykładem angażującego formatu wywiadu.
* **Pogłębione zrozumienie reakcji widzów:** Dodano wniosek, że widzowie szczególnie cenią sobie dogłębne analizy, co widać w komentarzach pod nowym materiałem.
* **Udoskonalona rekomendacja:** Wzmocniono rekomendację dotyczącą [temat], podając konkretny dowód na jej słuszność.

**Wygeneruj listę zmian, zaczynając od pogrubionego nagłówka. Używaj gwiazdek (*) dla punktów listy.**
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
};

/**
 * Refines an existing analysis based on a user's text command.
 */
export const refineAnalysis = async (currentAnalysis: string, command: string): Promise<string> => {
    const prompt = `
Jesteś asystentem AI, który pomaga analitykowi mediów w pracy nad raportem. Poniżej znajduje się aktualna wersja raportu oraz polecenie od analityka, które dotyczy modyfikacji tego raportu.

Twoim zadaniem jest zastosowanie się do polecenia i wygenerowanie **nowej, pełnej wersji raportu**, która uwzględnia wprowadzone zmiany.

**Aktualny Raport:**
---
${currentAnalysis}
---

**Polecenie od Analityka:**
---
"${command}"
---

**Instrukcje:**
1.  Dokładnie przeanalizuj polecenie.
2.  Zmodyfikuj raport zgodnie z poleceniem. Może to oznaczać dodanie nowej sekcji, przeredagowanie istniejącej, skupienie się na innym aspekcie, skrócenie lub rozwinięcie jakiejś części.
3.  Zachowaj profesjonalny ton i formatowanie Markdown.
4.  Twoim wynikiem końcowym musi być **cały, zaktualizowany raport**, a nie tylko zmieniony fragment.

**Wygeneruj zaktualizowaną, pełną wersję raportu.**
`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    
    return response.text;
};