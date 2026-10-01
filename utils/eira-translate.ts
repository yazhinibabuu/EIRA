export type EiraLanguage = 'en' | 'ta' | 'hi';

const LANGUAGE_NAMES: Record<'ta' | 'hi', string> = {
  ta: 'Tamil',
  hi: 'Hindi',
};

function isLanguage(value: string | null | undefined): value is EiraLanguage {
  return value === 'en' || value === 'ta' || value === 'hi';
}

export function getLanguageFromRequest(request: Request): EiraLanguage {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)eira\.language=(en|ta|hi)(?:;|$)/);

  return isLanguage(match?.[1]) ? match[1] : 'en';
}

async function translateStrings(
  strings: string[],
  language: EiraLanguage
): Promise<string[]> {
  if (language === 'en' || strings.length === 0) {
    return strings;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return strings;
  }

  const model =
    process.env.EIRA_TRANSLATION_MODEL || 'gemini-3.5-flash-lite';

  const targetLanguage = LANGUAGE_NAMES[language];

  const prompt = `
Translate the following EIRA news content into ${targetLanguage}.

Rules:
- Preserve the exact meaning.
- Do not summarize.
- Do not add information.
- Keep people's names, organization names, places and product names accurate.
- Preserve numbers, dates and percentages.
- Do not translate URLs.
- Do not translate source/publication names unless naturally required.
- Return exactly the same number of strings in the same order.
- Return ONLY the JSON array of translated strings.

Content:
${JSON.stringify(strings)}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'ARRAY',
              items: {
                type: 'STRING',
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      return strings;
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('') || '';

    if (!text) {
      return strings;
    }

    const translated = JSON.parse(text);

    if (
      !Array.isArray(translated) ||
      translated.length !== strings.length
    ) {
      return strings;
    }

    return translated.map((value, index) =>
      typeof value === 'string' && value.trim()
        ? value
        : strings[index]
    );
  } catch {
    return strings;
  }
}

export async function translateHomeStories(
  stories: any[],
  language: EiraLanguage
) {
  if (language === 'en' || !stories.length) {
    return stories;
  }

  const strings: string[] = [];

  for (const story of stories) {
    strings.push(story.title || '');
    strings.push(story.description || '');
  }

  const translated = await translateStrings(strings, language);

  return stories.map((story, index) => ({
    ...story,
    title: translated[index * 2] || story.title,
    description: translated[index * 2 + 1] || story.description,
  }));
}

export async function translateExploreResults(
  results: any[],
  language: EiraLanguage
) {
  if (language === 'en' || !results.length) {
    return results;
  }

  const strings: string[] = [];

  for (const result of results) {
    strings.push(result.title || '');
    strings.push(result.summary || '');

    if (Array.isArray(result.sources)) {
      for (const source of result.sources) {
        strings.push(source.title || '');
      }
    }
  }

  const translated = await translateStrings(strings, language);

  let index = 0;

  return results.map((result) => {
    const next = {
      ...result,
      title: translated[index++] || result.title,
      summary: translated[index++] || result.summary,
    };

    if (Array.isArray(result.sources)) {
      next.sources = result.sources.map((source: any) => ({
        ...source,
        title: translated[index++] || source.title,
      }));
    }

    return next;
  });
}

export async function translateStoryResult(
  result: any,
  language: EiraLanguage
) {
  if (language === 'en' || !result) {
    return result;
  }

  const fields = [
    'title',
    'summary',
    'whyItMatters',
    'whatHappened',
    'whatToKnow',
    'context',
    'whatNext',
  ];

  const existing = fields.map((field) => result[field] || '');

  const translated = await translateStrings(existing, language);

  const output = { ...result };

  fields.forEach((field, index) => {
    if (result[field]) {
      output[field] = translated[index] || result[field];
    }
  });

  return output;
}

export async function translateCatchUpResult(
  result: any,
  language: EiraLanguage
) {
  if (language === 'en' || !result) {
    return result;
  }

  return translateStoryResult(result, language);
}