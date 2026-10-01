import * as RSSParserModule from "rss-parser";

import { GoogleGenAI } from "@google/genai";

import { NextResponse } from "next/server";
import { getLanguageFromRequest, translateCatchUpResult, translateStoryResult } from '@/utils/eira-translate'



const GEMINI_API_KEY = process.env.GEMINI_API_KEY;



if (!GEMINI_API_KEY) {

  console.warn("GEMINI_API_KEY is not configured.");

}



const ai = GEMINI_API_KEY

  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })

  : null;



const Parser =
  (RSSParserModule as any).default ??
  (RSSParserModule as any).Parser;

if (!Parser) {
  throw new Error("rss-parser could not be loaded.");
}

const parser = new Parser();



type Article = {

  title: string;

  link: string;

  description: string;

  publishedAt: string;

  source: string;

};



type SelectedStory = {

  title: string;

  source: string;

  publishedAt?: string;

  description?: string;

  url: string;

};



type EvidenceItem = {

  id: string;

  title: string;

  url: string;

  source: string;

  publishedAt: string;

};



type StorySection = {

  heading: string;

  paragraphs: string[];

  sourceIds: string[];

};



type StoryResult = {

  mode: "story";

  headline: string;

  deck: string;

  hook: string;

  sections: StorySection[];

  bottomLine: string;

};



type CatchUpEvidenceItem = {

  text: string;

  sourceIds: number[];

};

type CatchUpResult = {

  mode: "catchup";

  shortVersion: string;

  whatChanged: CatchUpEvidenceItem[];

  confirmed: CatchUpEvidenceItem[];

  reported: CatchUpEvidenceItem[];

  uncertain: CatchUpEvidenceItem[];

  whyItMatters: string;

  whatToWatch: string[];

};



const STOP_WORDS = new Set([

  "the",

  "a",

  "an",

  "and",

  "or",

  "but",

  "for",

  "with",

  "from",

  "into",

  "about",

  "after",

  "before",

  "over",

  "under",

  "this",

  "that",

  "these",

  "those",

  "their",

  "they",

  "them",

  "have",

  "has",

  "had",

  "will",

  "would",

  "could",

  "should",

  "been",

  "being",

  "are",

  "was",

  "were",

  "is",

  "of",

  "to",

  "in",

  "on",

  "at",

  "by",

  "as",

  "it",

  "its",

  "be",

  "not",

  "than",

  "more",

  "less",

  "also",

  "can",

  "may",

  "might",

  "how",

  "what",

  "why",

  "when",

  "where",

  "who",

  "which",

]);



const TERM_GROUPS: string[][] = [

  [

    "india",

    "indian",

    "new delhi",

    "delhi",

    "government",

    "minister",

    "ministry",

  ],

  [

    "semiconductor",

    "semiconductors",

    "chip",

    "chips",

    "fab",

    "fabs",

    "foundry",

    "manufacturing",

  ],

  [

    "cyber",

    "cybersecurity",

    "cyberattack",

    "cyberattacks",

    "digital security",

    "hack",

    "hacking",

    "ransomware",

  ],

  [

    "technology",

    "tech",

    "ai",

    "artificial intelligence",

    "software",

    "data",

  ],

  [

    "business",

    "company",

    "companies",

    "market",

    "markets",

    "investment",

    "investments",

  ],

  [

    "trade",

    "tariff",

    "tariffs",

    "export",

    "exports",

    "import",

    "imports",

    "deal",

    "talks",

    "negotiation",

    "negotiations",

  ],

];



function cleanText(value: unknown): string {

  return String(value ?? "")

    .replace(/<[^>]*>/g, " ")

    .replace(/\s+/g, " ")

    .trim();

}



function normalizeText(value: string): string {

  return cleanText(value)

    .toLowerCase()

    .replace(/[^\p{L}\p{N}\s-]/gu, " ")

    .replace(/\s+/g, " ")

    .trim();

}



function tokenize(value: string): string[] {

  return normalizeText(value)

    .split(/\s+/)

    .filter(

      (word) =>

        word.length >= 3 &&

        !STOP_WORDS.has(word) &&

        !/^\d+$/.test(word)

    );

}



function unique<T>(items: T[]): T[] {

  return Array.from(new Set(items));

}



function hostnameToName(url: string): string {

  try {

    const host = new URL(url).hostname

      .replace(/^www\./, "")

      .replace(/^m\./, "");



    const parts = host.split(".");



    if (parts.length >= 2) {

      const name = parts[parts.length - 2];



      return name

        .split(/[-\_]/g)

        .map(

          (word) =>

            word.charAt(0).toUpperCase() + word.slice(1)

        )

        .join(" ");

    }



    return host;

  } catch {

    return "";

  }

}



function cleanSourceName(

  value: unknown,

  url = ""

): string {

  let source = cleanText(value);



  source = source

    .replace(/\s\|\sInshorts\.*$/i, "")

    .replace(/\s-\sInshorts\.*$/i, "")

    .replace(/\s\|\sGoogle News\.*$/i, "")

    .replace(/\s-\sGoogle News\.*$/i, "")

    .trim();



  if (

    !source ||

    source.toLowerCase() === "unknown source"

  ) {

    source = hostnameToName(url);

  }



  if (!source) {

    return "";

  }



  return source;

}



function cleanArticleTitle(title: string): string {

  return cleanText(title)

    .replace(/\s\|\sInshorts\.*$/i, "")

    .replace(/\s-\sInshorts\.*$/i, "")

    .replace(/\s\|\sGoogle News\.*$/i, "")

    .replace(/\s-\sGoogle News\.*$/i, "")

    .trim();

}



function cleanDescription(

  description: string

): string {

  return cleanText(description)

    .replace(/\s\|\sInshorts\.*$/i, "")

    .replace(/\s-\sInshorts\.*$/i, "")

    .trim();

}



function articleFromItem(item: any): Article | null {

  const link = cleanText(item?.link);



  if (!link) {

    return null;

  }



  const rawSource =

    item?.source?._ ??

    item?.source?.name ??

    item?.source?.title ??

    item?.creator ??

    item?.dcCreator ??

    "";



  const source = cleanSourceName(rawSource, link);



  return {

    title: cleanArticleTitle(item?.title ?? ""),

    link,

    description: cleanDescription(

      item?.contentSnippet ??

        item?.content ??

        item?.description ??

        ""

    ),

    publishedAt: cleanText(

      item?.isoDate ??

        item?.pubDate ??

        item?.published ??

        ""

    ),

    source,

  };

}



function getTopicTerms(topic: string): string[] {

  return unique(tokenize(topic));

}



function scoreTopicRelevance(

  article: Article,

  topic: string

): number {

  const topicTerms = getTopicTerms(topic);



  if (!topicTerms.length) {

    return 0;

  }



  const title = normalizeText(article.title);

  const description = normalizeText(

    article.description

  );



  const combined = `${title} ${description}`;



  let score = 0;



  for (const term of topicTerms) {

    if (title.includes(term)) {

      score += 6;

    } else if (description.includes(term)) {

      score += 2;

    }

  }



  const normalizedTopic = normalizeText(topic);



  if (

    normalizedTopic.length > 4 &&

    title.includes(normalizedTopic)

  ) {

    score += 12;

  }



  for (const group of TERM_GROUPS) {

    const topicHits = group.filter((term) =>

      normalizedTopic.includes(term)

    );



    const articleHits = group.filter((term) =>

      combined.includes(term)

    );



    if (

      topicHits.length &&

      articleHits.length

    ) {

      score += 4;

    }

  }



  return score;

}



function scoreStoryRelevance(

  article: Article,

  selectedStory: SelectedStory

): number {

  const selectedTitle = normalizeText(

    selectedStory.title

  );



  const articleTitle = normalizeText(

    article.title

  );



  const articleDescription = normalizeText(

    article.description

  );



  const selectedTerms = unique([

    ...tokenize(selectedStory.title),

    ...tokenize(selectedStory.description ?? ""),

  ]);



  let score = 0;



  // Very strong signal: exact headline match.

  if (

    selectedTitle.length > 20 &&

    articleTitle.includes(selectedTitle)

  ) {

    score += 40;

  }



  // Shared meaningful title terms.

  for (const term of tokenize(

    selectedStory.title

  )) {

    if (articleTitle.includes(term)) {

      score += 7;

    } else if (

      articleDescription.includes(term)

    ) {

      score += 2;

    }

  }



  // Shared description terms.

  for (const term of tokenize(

    selectedStory.description ?? ""

  )) {

    if (articleTitle.includes(term)) {

      score += 4;

    } else if (

      articleDescription.includes(term)

    ) {

      score += 1;

    }

  }



  // Shared two-word phrases from headline.

  const titleTokens = tokenize(

    selectedStory.title

  );



  for (

    let i = 0;

    i < titleTokens.length - 1;

    i++

  ) {

    const phrase = `${titleTokens[i]} ${titleTokens[i + 1]}`;



    if (articleTitle.includes(phrase)) {

      score += 8;

    }

  }



  // Penalize broad topic-only matches.

  const topicLikeHits = selectedTerms.filter(

    (term) => articleTitle.includes(term)

  ).length;



  if (

    selectedTerms.length >= 5 &&

    topicLikeHits <= 1

  ) {

    score -= 8;

  }



  // Prefer another publication as corroboration.

  const selectedSource = normalizeText(

    selectedStory.source

  );



  const articleSource = normalizeText(

    article.source

  );



  if (

    selectedSource &&

    articleSource &&

    selectedSource === articleSource

  ) {

    score -= 3;

  }



  return score;

}



function dedupeArticles(

  articles: Article[]

): Article[] {

  const seen = new Set<string>();



  return articles.filter((article) => {

    const key = normalizeText(

      `${article.title}|${article.link}`

    );



    if (!key || seen.has(key)) {

      return false;

    }



    seen.add(key);



    return true;

  });

}



function buildCatchUpSearchQueries(topic: string): string[] {
  const normalized = normalizeText(topic);
  const terms = getTopicTerms(topic);
  const queries: string[] = [];

  const add = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    const key = normalizeText(clean);
    if (!queries.some((query) => normalizeText(query) === key)) queries.push(clean);
  };

  add(`${topic} when:14d`);

  const isKpop = normalized.includes("k pop") || normalized.includes("kpop") || normalized.includes("korean pop");
  const isAI = normalized === "ai" || normalized.includes("artificial intelligence");
  const isSemiconductor = normalized.includes("semiconductor") || normalized.includes("chip industry") || normalized.includes("chip manufacturing");

  if (isKpop) {
    add(`${topic} music industry when:14d`);
    add(`${topic} artists charts when:14d`);
    add(`${topic} concerts agencies when:14d`);
    add(`${topic} business entertainment when:14d`);
  } else if (isAI) {
    add(`${topic} companies products when:14d`);
    add(`${topic} research models when:14d`);
    add(`${topic} regulation copyright when:14d`);
    add(`${topic} business workforce when:14d`);
  } else if (isSemiconductor) {
    add(`${topic} companies manufacturing when:14d`);
    add(`${topic} investment fabs when:14d`);
    add(`${topic} supply chain policy when:14d`);
  } else if (terms.length <= 2) {
    add(`${topic} business when:14d`);
    add(`${topic} government when:14d`);
    add(`${topic} industry when:14d`);
  }

  return queries.slice(0, 5);
}

function articleSimilarity(a: Article, b: Article): number {
  const aTerms = new Set(tokenize(a.title));
  const bTerms = new Set(tokenize(b.title));
  if (!aTerms.size || !bTerms.size) return 0;
  let overlap = 0;
  for (const term of aTerms) if (bTerms.has(term)) overlap++;
  return overlap / Math.max(1, Math.min(aTerms.size, bTerms.size));
}

function sortByFreshnessAndRelevance(

  articles: Article[],

  topic: string

): Article[] {

  const now = Date.now();



  return [...articles].sort((a, b) => {

    const scoreA = scoreTopicRelevance(

      a,

      topic

    );



    const scoreB = scoreTopicRelevance(

      b,

      topic

    );



    const dateA = Date.parse(

      a.publishedAt || ""

    );



    const dateB = Date.parse(

      b.publishedAt || ""

    );



    const freshnessA =

      Number.isFinite(dateA)

        ? Math.max(

            0,

            10 -

              (now - dateA) /

                86400000

          )

        : 0;



    const freshnessB =

      Number.isFinite(dateB)

        ? Math.max(

            0,

            10 -

              (now - dateB) /

                86400000

          )

        : 0;



    return (

      scoreB +

      freshnessB * 0.5 -

      (scoreA + freshnessA * 0.5)

    );

  });

}



function selectStorySources(

  articles: Article[],

  selectedStory: SelectedStory,

  topic: string

): Article[] {

  const candidates = articles

    .filter(

      (article) =>

        article.link !==

          selectedStory.url &&

        normalizeText(article.title) !==

          normalizeText(

            selectedStory.title

          )

    )

    .map((article) => {

      const storyScore =

        scoreStoryRelevance(

          article,

          selectedStory

        );



      const topicScore =

        scoreTopicRelevance(

          article,

          topic

        );



      return {

        article,

        score:

          storyScore * 3 +

          topicScore,

        storyScore,

      };

    })

    .filter(

      (item) => item.storyScore >= 8

    )

    .sort(

      (a, b) =>

        b.score - a.score

    );



  const selected: Article[] = [];

  const usedSources = new Set<string>();



  for (const candidate of candidates) {

    const source = normalizeText(

      candidate.article.source

    );



    if (

      source &&

      usedSources.has(source)

    ) {

      continue;

    }



    selected.push(

      candidate.article

    );



    if (source) {

      usedSources.add(source);

    }



    if (selected.length >= 4) {

      break;

    }

  }



  return selected;

}



function buildSourceMaterial(

  articles: Article[],

  sources: EvidenceItem[]

): string {

  return articles

    .map((article) => {

      const matchingSource =

        sources.find(

          (source) =>

            source.url === article.link

        );



      const id =

        matchingSource?.id ??

        "UNKNOWN";



      return [

        `SOURCE ID: ${id}`,

        `PUBLICATION: ${

          article.source || "Unknown"

        }`,

        `TITLE: ${article.title}`,

        `DATE: ${

          article.publishedAt ||

          "Unknown"

        }`,

        `URL: ${article.link}`,

        `DESCRIPTION: ${

          article.description ||

          "No description available."

        }`,

      ].join("\n");

    })

    .join("\n\n---\n\n");

}



function getGeminiStatusCode(

  error: any

): number | null {

  const candidates = [

    error?.status,

    error?.statusCode,

    error?.response?.status,

    error?.error?.status,

  ];



  for (const candidate of candidates) {

    const numeric = Number(candidate);



    if (Number.isFinite(numeric)) {

      return numeric;

    }

  }



  return null;

}



function getGeminiErrorMessage(

  error: any

): string {

  return cleanText(

    error?.message ??

      error?.error?.message ??

      error?.response?.data?.error

        ?.message ??

      "Gemini request failed."

  );

}



function isRetryableGeminiError(

  error: any

): boolean {

  const status =

    getGeminiStatusCode(error);



  if (

    status === 429 ||

    status === 503 ||

    status === 500

  ) {

    return true;

  }



  const message =

    getGeminiErrorMessage(

      error

    ).toLowerCase();



  return (

    message.includes("overloaded") ||

    message.includes(

      "temporarily unavailable"

    ) ||

    message.includes("timeout") ||

    message.includes("rate limit")

  );

}



function sleep(

  ms: number

): Promise<void> {

  return new Promise(

    (resolve) =>

      setTimeout(resolve, ms)

  );

}



async function generateGeminiWithFallback(

  prompt: string

): Promise<string> {

  if (!ai) {

    throw new Error(

      "Gemini API key is not configured."

    );

  }



  const models = [

    "gemini-3.6-flash",

    "gemini-3.5-flash-lite",

  ];



  let lastError: unknown = null;



  for (const model of models) {

    for (

      let attempt = 0;

      attempt < 2;

      attempt++

    ) {

      try {

        const response =

          await ai.models.generateContent({

            model,

            contents: prompt,

            config: {

              temperature: 0.45,

            },

          });



        const text =

          response.text?.trim();



        if (!text) {

          throw new Error(

            "Gemini returned an empty response."

          );

        }



        return text;

      } catch (error) {

        lastError = error;



        const status =

          getGeminiStatusCode(

            error

          );



        // Don't repeatedly retry quota errors.

        if (status === 429) {

          break;

        }



        if (

          !isRetryableGeminiError(

            error

          )

        ) {

          break;

        }



        if (attempt === 0) {

          await sleep(900);

        }

      }

    }

  }



  throw (

    lastError ??

    new Error(

      "Gemini request failed."

    )

  );

}



function extractJson(

  text: string

): string {

  const cleaned = text

    .replace(

      /^```json\s*/i,

      ""

    )

    .replace(

      /^```\s*/i,

      ""

    )

    .replace(

      /\s\*```$/i,

      ""

    )

    .trim();



  const firstBrace =

    cleaned.indexOf("{");



  const lastBrace =

    cleaned.lastIndexOf("}");



  if (

    firstBrace >= 0 &&

    lastBrace > firstBrace

  ) {

    return cleaned.slice(

      firstBrace,

      lastBrace + 1

    );

  }



  return cleaned;

}



function validateStoryResult(

  value: any

): StoryResult {

  if (

    !value ||

    typeof value !== "object" ||

    typeof value.headline !==

      "string" ||

    typeof value.deck !==

      "string" ||

    typeof value.hook !==

      "string" ||

    !Array.isArray(

      value.sections

    ) ||

    typeof value.bottomLine !==

      "string"

  ) {

    throw new Error(

      "Invalid story response from Gemini."

    );

  }



  const sections: StorySection[] =

    value.sections

      .filter(

        (section: any) =>

          section &&

          typeof section.heading ===

            "string" &&

          Array.isArray(

            section.paragraphs

          )

      )

      .map((section: any) => ({

        heading:

          cleanText(

            section.heading

          ),

        paragraphs:

          section.paragraphs

            .filter(

              (p: any) =>

                typeof p ===

                "string"

            )

            .map(

              (p: string) =>

                cleanText(p)

            )

            .filter(Boolean)

            .slice(0, 4),

        sourceIds:

          Array.isArray(

            section.sourceIds

          )

            ? section.sourceIds

                .filter(

                  (id: any) =>

                    typeof id ===

                    "string"

                )

                .map(

                  (id: string) =>

                    id.trim()

                )

                .filter(Boolean)

            : [],

      }))

      .filter(

        (section: StorySection) =>

          section.paragraphs

            .length > 0

      )

      .slice(0, 6);



  if (!sections.length) {

    throw new Error(

      "Story response contains no usable sections."

    );

  }



  return {

    mode: "story",

    headline:

      cleanText(

        value.headline

      ),

    deck:

      cleanText(value.deck),

    hook:

      cleanText(value.hook),

    sections,

    bottomLine:

      cleanText(

        value.bottomLine

      ),

  };

}



function validateCatchUpResult(

  value: any,

  sourceCount: number

): CatchUpResult {

  if (

    !value ||

    typeof value !== "object" ||

    typeof value.shortVersion !== "string" ||

    !Array.isArray(value.whatChanged) ||

    !Array.isArray(value.confirmed) ||

    !Array.isArray(value.reported) ||

    !Array.isArray(value.uncertain) ||

    typeof value.whyItMatters !== "string" ||

    !Array.isArray(value.whatToWatch)

  ) {

    throw new Error("Invalid catch-up response from Gemini.");

  }



  function normalizeSourceIds(sourceIds: unknown): number[] {

    if (!Array.isArray(sourceIds)) return [];

    return Array.from(new Set(

      sourceIds

        .map((id: unknown) => {

          if (typeof id === "number" && Number.isInteger(id)) return id;

          if (typeof id === "string") {

            const value = id.trim();

            const match = value.match(/^S(\d+)$/i);

            if (match) return Number(match[1]);

            if (/^\d+$/.test(value)) return Number(value);

          }

          return null;

        })

        .filter((id): id is number =>

          typeof id === "number" &&

          Number.isInteger(id) &&

          id >= 1 &&

          id <= sourceCount

        )

    ));

  }



  function normalizeEvidenceItems(

    items: unknown,

    limit: number

  ): CatchUpEvidenceItem[] {

    if (!Array.isArray(items)) return [];

    return items

      .filter((item: unknown) =>

        item &&

        typeof item === "object" &&

        typeof (item as any).text === "string" &&

        Array.isArray((item as any).sourceIds)

      )

      .map((item: any) => ({

        text: cleanText(item.text),

        sourceIds: normalizeSourceIds(item.sourceIds),

      }))

      .filter((item) =>

        item.text.length > 0 &&

        item.sourceIds.length > 0

      )

      .slice(0, limit);

  }



  return {

    mode: "catchup",

    shortVersion: cleanText(value.shortVersion),

    whatChanged: normalizeEvidenceItems(value.whatChanged, 3),

    confirmed: normalizeEvidenceItems(value.confirmed, 3),

    reported: normalizeEvidenceItems(value.reported, 2),

    uncertain: normalizeEvidenceItems(value.uncertain, 2),

    whyItMatters: cleanText(value.whyItMatters),

    whatToWatch: value.whatToWatch

      .filter((x: any) => typeof x === "string")

      .map((x: string) => cleanText(x))

      .filter(Boolean)

      .slice(0, 5),

  };

}


async function generateStoryAnswer(

  topic: string,

  selectedStory: SelectedStory,

  articles: Article[],

  sources: EvidenceItem[]

): Promise<StoryResult> {

  const sourceMaterial =

    buildSourceMaterial(

      articles,

      sources

    );



  const prompt = `

You are the editorial explanation engine for EIRA.



EIRA is NOT a news summarizer.



EIRA exists to make people genuinely understand

interesting things happening in the world.



The reader has already clicked on THIS SPECIFIC STORY.



Your job is to explain THIS STORY.



Do NOT turn this into a generic explainer

about the broader topic.



TOPIC:

${topic}



SELECTED STORY:



TITLE:

${selectedStory.title}



PUBLICATION:

${selectedStory.source}



DATE:

${selectedStory.publishedAt || "Unknown"}



URL:

${selectedStory.url}



DESCRIPTION:

${selectedStory.description || "None"}



SUPPORTING REPORTING:



${sourceMaterial}



EDITORIAL RULES:



1\. The selected story is the primary subject.



2\. Do not drift into a generic explanation

   of the topic.



3\. Do not simply rewrite the source article.



4\. Do not copy the source headline.



5\. EIRA's headline should reveal the interesting

   idea behind the story while remaining factual.



6\. The reader should learn something that is

   NOT obvious from the original headline.



7\. Explain the underlying mechanism or connection

   when the reader needs it.



8\. Every section should answer a natural question

   a curious reader would ask.



9\. Do not invent facts.



10\. Do not use outside knowledge that is not

    supported by the supplied reporting.



11\. Distinguish clearly between:

    \- established facts

    \- statements by officials or companies

    \- claims being reported

    \- things that remain unknown



12\. An official statement is NOT automatically

    independent confirmation of the underlying claim.



13\. If the story is a warning, distinguish:

    "someone warned this could happen"

    from

    "this has actually happened."



14\. Do not include supporting articles merely

    because they are about the same industry.



15\. Supporting sources must genuinely help explain

    THIS specific story.



16\. Do not repeat the same idea in:

    \- headline

    \- deck

    \- hook

    \- sections

    \- takeaway



17\. Avoid generic AI phrases such as:

    "This is significant because..."

    "It remains to be seen..."

    "The development highlights..."

    unless absolutely necessary.



18\. Do not use filler.



19\. Use 3 to 5 sections.



20\. Section headings must be specific to THIS story.



21\. Do not force generic sections such as:

    "Why It Matters"

    if a more useful heading exists.



22\. The explanation should have a clear progression:



    WHAT HAPPENED

        ↓

    WHY IS THIS INTERESTING?

        ↓

    WHAT DOES THE HEADLINE NOT EXPLAIN?

        ↓

    WHY IS THIS HAPPENING NOW?

        ↓

    WHAT IS FACT / CLAIM / UNKNOWN?

        ↓

    WHAT SHOULD I REMEMBER?



23\. If a section is unnecessary,

    leave it out.



24\. The final takeaway must contain an actual

    insight, not a generic conclusion.



25\. The final result should feel like a smart editor

    explaining something to an intelligent person.



The reader should finish thinking:



"I understand what actually happened."



"I understand why it matters."



"I understand the part the headline didn't tell me."



NOT:



"I just read a shorter version of the article."



OUTPUT ONLY VALID JSON.



Return exactly:



{

  "mode": "story",

  "headline": "EIRA's factual but insightful headline",

  "deck": "One sentence explaining what this story is really about.",

  "hook": "A short opening that creates curiosity and gives the first important insight.",

  "sections": [

    {

      "heading": "Story-specific heading",

      "paragraphs": [

        "Paragraph 1",

        "Paragraph 2"

      ],

      "sourceIds": ["S1"]

    }

  ],

  "bottomLine": "The one important insight the reader should remember."

}



SOURCE RULES:



Only use source IDs that actually exist.



If a paragraph contains a factual claim,

attach the relevant source ID.



Do not attach every source to every paragraph.



Do not cite unrelated sources.



Use the minimum number of sources necessary.



Keep paragraphs concise but substantive.

`;



  const raw =

    await generateGeminiWithFallback(

      prompt

    );



  const parsed =

    JSON.parse(

      extractJson(raw)

    );



  const result =

    validateStoryResult(

      parsed

    );



  const validSourceIds =

    new Set(

      sources.map(

        (source) =>

          source.id

      )

    );



  result.sections =

    result.sections.map(

      (section) => ({

        ...section,

        sourceIds:

          section.sourceIds.filter(

            (id) =>

              validSourceIds.has(

                id

              )

          ),

      })

    );



  return result;

}




function articleAgeInDays(article: Article): number | null {
  const timestamp = Date.parse(article.publishedAt || "");

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const age = (Date.now() - timestamp) / 86400000;

  if (age < 0) {
    return 0;
  }

  return age;
}

function titlePhrases(article: Article): string[] {
  const tokens = tokenize(article.title);
  const phrases: string[] = [];

  for (let i = 0; i < tokens.length - 1; i++) {
    phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  return unique(phrases);
}

function dominantStoryPhrases(articles: Article[]): Set<string> {
  const counts = new Map<string, number>();

  for (const article of articles) {
    for (const phrase of titlePhrases(article)) {
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count >= 3)
      .map(([phrase]) => phrase)
  );
}

function storyClusterOverlap(article: Article, selected: Article[]): number {
  const phrases = new Set(titlePhrases(article));
  if (!phrases.size || !selected.length) return 0;

  return Math.max(
    ...selected.map((item) => {
      const other = new Set(titlePhrases(item));
      let overlap = 0;
      for (const phrase of phrases) {
        if (other.has(phrase)) overlap++;
      }
      return overlap;
    })
  );
}

function selectCatchUpArticles(
  articles: Article[],
  topic: string
): Article[] {
  const sorted = sortByFreshnessAndRelevance(articles, topic);
  const recent14 = sorted.filter((article) => {
    const age = articleAgeInDays(article);
    return age !== null && age <= 14;
  });
  const recent30 = sorted.filter((article) => {
    const age = articleAgeInDays(article);
    return age !== null && age <= 30;
  });

  const pool =
    recent14.length >= 6
      ? recent14
      : recent30.length >= 6
        ? recent30
        : sorted;

  const relevant = pool.filter(
    (article) => scoreTopicRelevance(article, topic) >= 2
  );
  const candidates = relevant.length >= 3 ? relevant : pool;
  const broadTopic = getTopicTerms(topic).length <= 4;
  const repeatedPhrases = dominantStoryPhrases(candidates);

  const selected: Article[] = [];
  const selectedSources = new Set<string>();

  while (selected.length < 4 && candidates.length) {
    let best: Article | null = null;
    let bestScore = -Infinity;

    for (const article of candidates) {
      if (selected.includes(article)) continue;

      const source = normalizeText(article.source);
      const relevance = scoreTopicRelevance(article, topic);
      const age = articleAgeInDays(article);
      const freshness = age === null ? 0 : Math.max(0, 10 - age * 0.5);
      const maxSimilarity = selected.length
        ? Math.max(...selected.map((item) => articleSimilarity(article, item)))
        : 0;
      const clusterOverlap = storyClusterOverlap(article, selected);

      // For broad topics, never let several articles about the same
      // franchise/product/person/event fill the answer.
      if (broadTopic && clusterOverlap >= 2) continue;

      const repeatedPhraseHits = titlePhrases(article).filter((phrase) =>
        repeatedPhrases.has(phrase)
      ).length;

      const noveltyBonus = 16 * (1 - maxSimilarity);
      const sourceBonus = source && !selectedSources.has(source) ? 7 : -8;
      const clusterPenalty = broadTopic
        ? repeatedPhraseHits * 8
        : repeatedPhraseHits * 4;

      const score =
        relevance * 2 +
        freshness +
        noveltyBonus +
        sourceBonus -
        clusterPenalty;

      if (score > bestScore) {
        bestScore = score;
        best = article;
      }
    }

    if (!best) break;

    selected.push(best);
    const source = normalizeText(best.source);
    if (source) selectedSources.add(source);
  }

  return selected.length > 0 ? selected : sorted.slice(0, 4);
}

async function generateCatchUpAnswer(

  topic: string,

  articles: Article[],

  sources: EvidenceItem[]

): Promise<CatchUpResult> {

  const sourceMaterial =

    buildSourceMaterial(

      articles,

      sources

    );



  const currentDate =
    new Date().toISOString().slice(0, 10);

  const prompt = `

You are the EIRA Catch Me Up editorial engine.

EIRA is NOT a news feed and NOT an article-by-article summarizer.

EIRA's job is to help a reader understand the main thing
happening around a topic right now, using a small amount of
high-quality current reporting.

CURRENT DATE:
${currentDate}

TOPIC:
${topic}

REPORTING:
${sourceMaterial}

EDITORIAL GOAL:

First identify the 2-3 dominant developments or themes that
actually explain what is happening around this topic now.

Then build one coherent explanation around those developments.

Do NOT produce a list of unrelated stories just because they
contain the same keyword.

Do NOT mention a person, company, lawsuit, product, or event
unless it materially helps explain the topic.

BROAD-TOPIC RULE:
If the topic is broad (for example "K-pop", "AI", or "semiconductors"),
do NOT let one franchise, company, artist, product, lawsuit, or viral story
stand in for the entire topic. Prefer distinct developments across the topic.
A single entity can be used for one development, but repeated coverage of
the same entity should not become multiple developments.

If several supplied sources are all about the same franchise, product,
artist, company, lawsuit, or event, treat them as ONE development even if
the headlines are different. Do not use multiple outlets covering that same
story to fill the remaining development slots. Prefer another distinct
story from the topic, or return fewer developments if no distinct story is
supported by the reporting.

If the current reporting is genuinely dominated by one story, say so clearly
instead of pretending that story represents the entire topic.

If the reporting is fragmented, say that the picture is
fragmented rather than stitching unrelated stories together.

For a broad topic, the presence of one highly visible entertainment,
celebrity, franchise, product, or viral story does NOT mean that story is
the topic itself. Treat it as one current development and look for other
independent developments in the supplied reporting.

The "shortVersion" must be a genuine synthesis:
it should answer "What is actually going on?" in 2-3 sentences.

"WhatChanged" is for the 2-3 most important recent developments.
These must be distinct developments, not one item per source.

"Confirmed" is for facts or events directly established by
the supplied reporting.

"Reported" is for important claims or developments that are
being reported but are not independently established.

"Uncertain" is for the most important unresolved question(s).
Do not fill this section with generic uncertainty.

"whyItMatters" should explain the practical consequence of
the main development, not simply repeat the shortVersion.

"whatToWatch" should contain at most 2 concrete future
developments that could materially change the picture.

FRESHNESS:

The supplied reporting has already been filtered toward recent
coverage. Prefer recent developments. Do not revive old stories
just because they are interesting. Older material should only
be used when it is necessary context.

EVIDENCE RULES:

- Do not invent information.
- Do not treat an official statement as independent confirmation
  of the underlying claim.
- Multiple outlets repeating the same statement do not
  automatically make the underlying claim confirmed.
- Keep reported claims separate from confirmed facts.
- Every evidence item MUST contain at least one valid sourceId.
- Use only source IDs supplied below.
- Do not repeat the same proposition across sections.
- Keep every evidence item concise.
- If there is not enough evidence for a section, return [].

SOURCE IDs:
- Every evidence item MUST include sourceIds.
- Use only the supplied IDs, such as "S1", "S2", "S3".
- Never invent a source ID.

OUTPUT ONLY VALID JSON:

{
  "mode": "catchup",

  "shortVersion": "A coherent 2-3 sentence synthesis of what is happening now.",

  "whatChanged": [
    {
      "text": "The most important recent development.",
      "sourceIds": ["S1", "S2"]
    }
  ],

  "confirmed": [
    {
      "text": "A fact or event directly established by the supplied reporting.",
      "sourceIds": ["S1"]
    }
  ],

  "reported": [
    {
      "text": "An important claim or development that remains reported rather than independently established.",
      "sourceIds": ["S2"]
    }
  ],

  "uncertain": [
    {
      "text": "The most important unresolved question.",
      "sourceIds": ["S1", "S3"]
    }
  ],

  "whyItMatters": "A concrete explanation of why the main development matters.",

  "whatToWatch": [
    "A concrete next development that could materially change the picture."
  ]
}

LIMITS:

- whatChanged: maximum 3
- confirmed: maximum 3
- reported: maximum 2
- uncertain: maximum 2
- whatToWatch: maximum 2

QUALITY CHECK BEFORE RETURNING:

1. Does the answer describe a coherent picture rather than a list
   of unrelated articles?
2. Does every evidence item have a valid source ID?
3. Are the most recent developments doing most of the work?
4. Are reported claims clearly separated from confirmed facts?
5. Is the unresolved question genuinely useful?
6. Could a reader understand the topic without opening all the sources?
7. Have you removed duplicate ideas?

`;



  const raw =

    await generateGeminiWithFallback(

      prompt

    );



  return validateCatchUpResult(

    JSON.parse(

      extractJson(raw)

    ),

    sources.length

  );

}



async function fetchGoogleNews(

  query: string

): Promise<Article[]> {

  const encoded =

    encodeURIComponent(query);



  const rssUrl =

    `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;



  const feed =

    await parser.parseURL(

      rssUrl

    );



  const articles =

    (feed.items ?? [])

      .map(articleFromItem)

      .filter(
  (
    article: Article | null | undefined
  ): article is Article =>
    Boolean(article)
)

      .filter(
  (article: Article) =>
    article.title.length > 0
)



  return dedupeArticles(

    articles

  );

}



function createSources(

  articles: Article[]

): EvidenceItem[] {

  return articles.map(

    (article, index) => ({

      id: `S${index + 1}`,

      title: article.title,

      url: article.link,

      source:

        cleanSourceName(

          article.source,

          article.link

        ) || "Source",

      publishedAt:

        article.publishedAt,

    })

  );

}



function selectedStoryAsArticle(

  selectedStory: SelectedStory

): Article {

  return {

    title: cleanArticleTitle(

      selectedStory.title

    ),

    link: selectedStory.url,

    description:

      cleanDescription(

        selectedStory.description ??

          ""

      ),

    publishedAt:

      selectedStory.publishedAt ??

      "",

    source:

      cleanSourceName(

        selectedStory.source,

        selectedStory.url

      ) || "Source",

  };

}



export async function POST(

  request: Request

) {

  try {

    const language = getLanguageFromRequest(request);

    const body =

      await request.json();



    const topic =

      typeof body?.topic ===

      "string"

        ? body.topic.trim()

        : "";



    const selectedStory:

      | SelectedStory

      | null =

      body?.selectedStory &&

      typeof body.selectedStory ===

        "object"

        ? {

            title: cleanText(

              body.selectedStory

                .title

            ),

            source: cleanText(

              body.selectedStory

                .source

            ),

            publishedAt:

              cleanText(

                body.selectedStory

                  .publishedAt

              ),

            description:

              cleanText(

                body.selectedStory

                  .description

              ),

            url: cleanText(

              body.selectedStory

                .url

            ),

          }

        : null;



    if (!topic) {

      return NextResponse.json(

        {

          error:

            "A topic is required.",

        },

        {

          status: 400,

        }

      );

    }



    /*

     * ==========================================

     * STORY MODE

     * ==========================================

     *

     * Used by /story.

     *

     * We search using the exact story headline

     * + topic so supporting reporting is much

     * more likely to be about THIS development.

     */



    if (

      selectedStory?.title &&

      selectedStory?.url

    ) {

      const titleQuery =

        cleanArticleTitle(

          selectedStory.title

        );



      const searchQuery =

        `"${titleQuery}" ${topic}`.slice(

          0,

          240

        );



      let articles =

        await fetchGoogleNews(

          searchQuery

        );



      /*

       * If the exact-title search returns too

       * little reporting, use the broader topic

       * as a fallback.

       */



      if (

        articles.length < 3

      ) {

        const fallbackArticles =

          await fetchGoogleNews(

            topic

          );



        articles =

          dedupeArticles([

            ...articles,

            ...fallbackArticles,

          ]);

      }



      const selectedArticle =

        selectedStoryAsArticle(

          selectedStory

        );



      const storySources =

        selectStorySources(

          articles,

          selectedStory,

          topic

        );



      /*

       * Selected story ALWAYS comes first.

       * Only genuinely relevant supporting

       * articles are added after it.

       */



      const finalArticles =

        dedupeArticles([

          selectedArticle,

          ...storySources,

        ]).slice(0, 5);



      const sources =

        createSources(

          finalArticles

        );



      const result =

        await generateStoryAnswer(

          topic,

          selectedStory,

          finalArticles,

          sources

        );

      const translatedResult =
        await translateStoryResult(result, language);

      return NextResponse.json({

        result: translatedResult,

        sources,

        selectedStory,

      });

    }



    /*

     * ==========================================

     * CATCH ME UP MODE

     * ==========================================

     *

     * Used by /catch-up.

     *

     * This remains separate so the existing

     * Catch Me Up page continues to work.

     */



    const searchQueries = buildCatchUpSearchQueries(topic);

    const searchResults = await Promise.allSettled(
      searchQueries.map((query) => fetchGoogleNews(query))
    );

    let articles = dedupeArticles(
      searchResults.flatMap((result) =>
        result.status === "fulfilled" ? result.value : []
      )
    );

    if (articles.length < 4) {
      const fallbackArticles = await fetchGoogleNews(topic);
      articles = dedupeArticles([
        ...articles,
        ...fallbackArticles,
      ]);
    }



    const finalArticles =

      selectCatchUpArticles(

        articles,

        topic

      );



    const sources =

      createSources(

        finalArticles

      );



    const result =

      await generateCatchUpAnswer(

        topic,

        finalArticles,

        sources

      );



    const translatedResult =
      await translateCatchUpResult(result, language);

    const catchUpSources =

      sources.map((source, index) => ({

        ...source,

        id: index + 1,

      }));

    return NextResponse.json({

      result: translatedResult,

      sources: catchUpSources,

    });

  } catch (error: any) {

    console.error(

      "EIRA Catch Up API error:",

      error

    );



    const status =

      getGeminiStatusCode(

        error

      );



    return NextResponse.json(

      {

        error:

          status === 429

            ? "EIRA has temporarily reached its AI request limit. Please try again shortly."

            : status === 503

              ? "EIRA's AI service is temporarily busy. Please try again shortly."

              : cleanText(

                  error?.message ||

                    "Something went wrong while generating the explanation."

                ),

      },

      {

        status:

          status === 429 ||

          status === 503

            ? status

            : 500,

      }

    );

  }

}
