export type EiraLanguage = 'en' | 'ta' | 'hi';

const LANGUAGE_NAMES: Record<Exclude<EiraLanguage, 'en'>, string> = {
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

async function translateStrings(strings: string[], language: EiraLanguage): Promise<string[]> {
  if (language === 'en' || strings.length === 0) return strings;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return strings;

  const model = process.env.EIRA_TRANSLATION_MODEL || 'gemini-3.5-flash-lite';
  const target = LANGUAGE_NAMES[language];

  const prompt = `Translate the following EIRA editorial strings into ${target}.

Rules:
- Return exactly one translated string for every input string, in the same order.
- Preserve the meaning and factual nuance. Do not add information.
- Use natural, fluent ${target} suitable for a modern news/information product.
- Do not transliterate English when a natural ${target} term exists.
- Keep proper names, organizations, places, product names, acronyms, numbers and dates accurate.
- Do not translate URLs or source/publisher names if they appear inside a string.
- Do not summarize or shorten.

INPUT:
${JSON.stringify(strings)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('EIRA translation request failed:', response.status);
      return strings;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed) || parsed.length !== strings.length || parsed.some((item) => typeof item !== 'string')) {
      return strings;
    }

    return parsed.map((item: string, index: number) => item.trim() || strings[index]);
  } catch (error) {
    console.error('EIRA translation error:', error);
    return strings;
  }
}

export async function translateHomeStories<T extends { title: string; description: string }>(stories: T[], language: EiraLanguage): Promise<T[]> {
  if (language === 'en' || stories.length === 0) return stories;
  const inputs = stories.flatMap((story) => [story.title, story.description]);
  const translated = await translateStrings(inputs, language);
  return stories.map((story, index) => ({
    ...story,
    title: translated[index * 2] || story.title,
    description: translated[index * 2 + 1] || story.description,
  }));
}

export async function translateExploreResults<T extends {
  title: string;
  summary: string;
  sources: Array<{ name: string; title: string; [key: string]: unknown }>;
}>(results: T[], language: EiraLanguage): Promise<T[]> {
  if (language === 'en' || results.length === 0) return results;
  const inputs: string[] = [];
  const positions: Array<{ result: number; source?: number; field: 'title' | 'summary' | 'sourceTitle' }> = [];

  results.forEach((result, resultIndex) => {
    inputs.push(result.title);
    positions.push({ result: resultIndex, field: 'title' });
    inputs.push(result.summary);
    positions.push({ result: resultIndex, field: 'summary' });
    result.sources.forEach((source, sourceIndex) => {
      inputs.push(source.title);
      positions.push({ result: resultIndex, source: sourceIndex, field: 'sourceTitle' });
    });
  });

  const translated = await translateStrings(inputs, language);
  const output = results.map((result) => ({ ...result, sources: result.sources.map((source) => ({ ...source })) }));

  positions.forEach((position, index) => {
    const value = translated[index];
    if (!value) return;
    if (position.field === 'title') output[position.result].title = value;
    else if (position.field === 'summary') output[position.result].summary = value;
    else if (position.source !== undefined) output[position.result].sources[position.source].title = value;
  });

  return output;
}

export async function translateStoryResult<T extends {
  headline: string;
  deck: string;
  hook: string;
  sections: Array<{ heading: string; paragraphs: string[]; [key: string]: unknown }>;
  bottomLine: string;
}>(result: T, language: EiraLanguage): Promise<T> {
  if (language === 'en') return result;
  const inputs: string[] = [
    result.headline,
    result.deck,
    result.hook,
    result.bottomLine,
    ...(Array.isArray((result as any).confirmed) ? (result as any).confirmed : []),
    ...(Array.isArray((result as any).openQuestions) ? (result as any).openQuestions : []),
  ];
  const positions: Array<{ section?: number; paragraph?: number; list?: 'confirmed' | 'openQuestions'; listIndex?: number; field: 'headline' | 'deck' | 'hook' | 'bottomLine' | 'heading' | 'paragraph' | 'list' }> = [
    { field: 'headline' }, { field: 'deck' }, { field: 'hook' }, { field: 'bottomLine' },
  ];

  if (Array.isArray((result as any).confirmed)) {
    (result as any).confirmed.forEach((_item: string, index: number) => {
      positions.push({ field: 'list', list: 'confirmed', listIndex: index });
    });
  }

  if (Array.isArray((result as any).openQuestions)) {
    (result as any).openQuestions.forEach((_item: string, index: number) => {
      positions.push({ field: 'list', list: 'openQuestions', listIndex: index });
    });
  }

  result.sections.forEach((section, sectionIndex) => {
    inputs.push(section.heading);
    positions.push({ section: sectionIndex, field: 'heading' });
    section.paragraphs.forEach((paragraph, paragraphIndex) => {
      inputs.push(paragraph);
      positions.push({ section: sectionIndex, paragraph: paragraphIndex, field: 'paragraph' });
    });
  });

  const translated = await translateStrings(inputs, language);
  const output = {
    ...result,
    sections: result.sections.map((section) => ({ ...section, paragraphs: [...section.paragraphs] })),
  } as T;

  positions.forEach((position, index) => {
    const value = translated[index];
    if (!value) return;
    if (position.field === 'headline') output.headline = value;
    else if (position.field === 'deck') output.deck = value;
    else if (position.field === 'hook') output.hook = value;
    else if (position.field === 'bottomLine') output.bottomLine = value;
    else if (position.field === 'list' && position.list === 'confirmed' && position.listIndex !== undefined) {
      (output as any).confirmed[position.listIndex] = value;
    }
    else if (position.field === 'list' && position.list === 'openQuestions' && position.listIndex !== undefined) {
      (output as any).openQuestions[position.listIndex] = value;
    }
    else if (position.section !== undefined && position.field === 'heading') output.sections[position.section].heading = value;
    else if (position.section !== undefined && position.paragraph !== undefined) output.sections[position.section].paragraphs[position.paragraph] = value;
  });

  return output;
}

export async function translateCatchUpResult<T extends {
  shortVersion: string;
  whatChanged: Array<{ text: string; [key: string]: unknown }>;
  confirmed: Array<{ text: string; [key: string]: unknown }>;
  reported: Array<{ text: string; [key: string]: unknown }>;
  uncertain: Array<{ text: string; [key: string]: unknown }>;
  whyItMatters: string;
  whatToWatch: string[];
}>(result: T, language: EiraLanguage): Promise<T> {
  if (language === 'en') return result;
  const inputs = [
    result.shortVersion,
    ...result.whatChanged.map((item) => item.text),
    ...result.confirmed.map((item) => item.text),
    ...result.reported.map((item) => item.text),
    ...result.uncertain.map((item) => item.text),
    result.whyItMatters,
    ...result.whatToWatch,
  ];
  const translated = await translateStrings(inputs, language);
  let cursor = 0;
  const output = {
    ...result,
    whatChanged: result.whatChanged.map((item) => ({ ...item })),
    confirmed: result.confirmed.map((item) => ({ ...item })),
    reported: result.reported.map((item) => ({ ...item })),
    uncertain: result.uncertain.map((item) => ({ ...item })),
    whatToWatch: [...result.whatToWatch],
  } as T;

  output.shortVersion = translated[cursor++] || result.shortVersion;
  for (const item of output.whatChanged) item.text = translated[cursor++] || item.text;
  for (const item of output.confirmed) item.text = translated[cursor++] || item.text;
  for (const item of output.reported) item.text = translated[cursor++] || item.text;
  for (const item of output.uncertain) item.text = translated[cursor++] || item.text;
  output.whyItMatters = translated[cursor++] || result.whyItMatters;
  output.whatToWatch = output.whatToWatch.map((item) => translated[cursor++] || item);

  return output;
}
