import Parser from "rss-parser";

import { GoogleGenAI } from "@google/genai";

import { NextResponse } from "next/server";



const apiKey = process.env.GEMINI_API_KEY;



const ai = apiKey

  ? new GoogleGenAI({ apiKey })

  : null;



const parser = new Parser();



type SelectedStory = {

  title: string;

  source: string;

  publishedAt: string;

  description: string;

  url: string;

};



type Article = {

  title: string;

  source: string;

  publishedAt: string;

  description: string;

  url: string;

};



type Source = {

  id: string;

  title: string;

  source: string;

  publishedAt: string;

  url: string;

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



/* =========================================================

   TEXT HELPERS

   ========================================================= */



function cleanText(value: unknown): string {

  return String(value ?? "")

    .replace(/<[^>]*>/g, " ")

    .replace(/ /gi, " ")

    .replace(/&/gi, "&")

    .replace(/"/gi, '"')

    .replace(/'/gi, "'")

    .replace(/'/gi, "'")

    .replace(/\s+/g, " ")

    .trim();

}



function normalize(value: string): string {

  return cleanText(value)

    .toLowerCase()

    .replace(/[^\p{L}\p{N}\s-]/gu, " ")

    .replace(/\s+/g, " ")

    .trim();

}



function cleanTitle(value: unknown): string {

  return cleanText(value)

    .replace(/\s\|\sInshorts$/i, "")

    .replace(/\s-\sInshorts$/i, "")

    .replace(/\s\|\sGoogle News$/i, "")

    .replace(/\s-\sGoogle News$/i, "")

    .trim();

}



/* =========================================================

   SOURCE HELPERS

   ========================================================= */



function hostnameToName(

  url: string

): string {

  try {

    const hostname = new URL(url)

      .hostname

      .replace(/^www\./i, "")

      .replace(/^m\./i, "");

    if (hostname === "news.google.com" || hostname === "google.com" || hostname.endsWith(".google.com")) {
      return "";
    }



    const knownDomains: Record<

      string,

      string

    > = {

      "indianexpress.com":

        "The Indian Express",



      "economictimes.indiatimes.com":

        "The Economic Times",



      "economictimes.com":

        "The Economic Times",



      "business-standard.com":

        "Business Standard",



      "businessline.global":

        "BusinessLine",



      "thehindubusinessline.com":

        "BusinessLine",



      "news18.com":

        "News18",



      "ndtv.com":

        "NDTV",



      "ndtvprofit.com":

        "NDTV Profit",



      "moneycontrol.com":

        "Moneycontrol",



      "cnbctv18.com":

        "CNBC-TV18",



      "reuters.com":

        "Reuters",



      "livemint.com":

        "Mint",



      "mint.com":

        "Mint",



      "opindia.com":

        "OpIndia",



      "jpmorgan.com":

        "J.P. Morgan",



      "financialexpress.com":

        "Financial Express",



      "hindustantimes.com":

        "Hindustan Times",



      "thehindu.com":

        "The Hindu",



      "timesofindia.indiatimes.com":

        "The Times of India",



      "indiatoday.in":

        "India Today",



      "deccanherald.com":

        "Deccan Herald",



      "telegraphindia.com":

        "The Telegraph",



      "scroll.in":

        "Scroll.in",



      "firstpost.com":

        "Firstpost",



      "theprint.in":

        "ThePrint",



      "outlookindia.com":

        "Outlook India",

    };



    if (knownDomains[hostname]) {

      return knownDomains[hostname];

    }



    const parts = hostname.split(".");



    if (parts.length >= 2) {

      return parts[parts.length - 2]

        .split(/[-\_]/)

        .map(

          (word) =>

            word.charAt(0).toUpperCase() +

            word.slice(1)

        )

        .join(" ");

    }



    return hostname;

  } catch {

    return "";

  }

}



function isGenericSource(value: string): boolean {
  const source = cleanText(value).toLowerCase();

  return (
    source === "google" ||
    source === "google news" ||
    source === "google news rss" ||
    source === "news.google.com"
  );
}

function publisherFromTitle(value: unknown): string {
  const title = cleanText(value);

  if (!title) return "";

  const candidates = [
    title.match(/\s\|\s([^|]+)$/)?.[1],
    title.match(/\s[-–—]\s([^|–—-]+)$/)?.[1],
  ];

  for (const candidate of candidates) {
    const publisher = cleanText(candidate);

    if (
      publisher &&
      !isGenericSource(publisher) &&
      publisher.length <= 100
    ) {
      return publisher;
    }
  }

  return "";
}

function cleanSource(
  value: unknown,
  url: string,
  title?: unknown
): string {
  const source = cleanText(value)
    .replace(/\s\|\sGoogle News$/i, "")
    .replace(/\s-\sGoogle News$/i, "")
    .replace(/\s\|\sInshorts$/i, "")
    .replace(/\s-\sInshorts$/i, "")
    .trim();

  if (source && !isGenericSource(source)) {
    return source;
  }

  const fromTitle = publisherFromTitle(title);

  if (fromTitle) {
    return fromTitle;
  }

  const fromUrl = hostnameToName(url);

  if (fromUrl && !isGenericSource(fromUrl)) {
    return fromUrl;
  }

  return "Source unavailable";
}



function sameTitle(

  a: string,

  b: string

): boolean {

  return (

    normalize(

      cleanTitle(a)

    ) ===

    normalize(

      cleanTitle(b)

    )

  );

}



function dedupeArticles(

  articles: Article[]

): Article[] {

  const seen =

    new Set<string>();



  return articles.filter(

    (article) => {

      const key =

        normalize(article.title);



      if (

        !key ||

        seen.has(key)

      ) {

        return false;

      }



      seen.add(key);

      return true;

    }

  );

}



/* =========================================================

   GOOGLE NEWS SEARCH

   ========================================================= */



async function searchNews(

  query: string

): Promise<Article[]> {

  const rssUrl =

    `https://news.google.com/rss/search?q=${encodeURIComponent(

      query

    )}` +

    `&hl=en-IN&gl=IN&ceid=IN:en`;



  const response =

    await fetch(rssUrl, {

      cache: "no-store",

      headers: {

        Accept:

          "application/rss+xml, application/xml, text/xml",

      },

    });



  if (!response.ok) {

    throw new Error(

      `News search failed with HTTP ${response.status}.`

    );

  }



  const xml =

    await response.text();



  if (!xml.trim()) {

    throw new Error(

      "News search returned no data."

    );

  }



  const feed =

    await parser.parseString(

      xml

    );



  /*

   \* rss-parser normally exposes Google News'

   \* <source> as item.source.\_.

   \*

   \* We also inspect multiple possible shapes

   \* because Google News RSS responses can vary.

   */

  const articles: Article[] =

    (feed.items ?? [])

      .map((item: any) => {

        const url =

          cleanText(item?.link);



        if (!url) {

          return null;

        }



        const rawSource =

          item?.source?._ ??

          item?.source?.name ??

          item?.source?.title ??

          item?.source ??

          item?.creator ??

          item?.dcCreator ??

          "";



        return {

          title:

            cleanTitle(

              item?.title

            ),



          source:

            cleanSource(

              rawSource,

              url,

              item?.title

            ),



          publishedAt:

            cleanText(

              item?.isoDate ??

                item?.pubDate ??

                item?.published ??

                ""

            ),



          description:

            cleanText(

              item?.contentSnippet ??

                item?.content ??

                item?.description ??

                ""

            ),



          url,

        };

      })

      .filter(

        (

          article

        ): article is Article =>

          article !== null &&
article.title.length > 0 &&
article.url.length > 0

      );



  return dedupeArticles(

    articles

  ).slice(0, 15);

}



/* =========================================================

   STORY RELEVANCE

   ========================================================= */



const STOP_WORDS =

  new Set([

    "the",

    "a",

    "an",

    "and",

    "or",

    "for",

    "with",

    "from",

    "into",

    "about",

    "this",

    "that",

    "these",

    "those",

    "what",

    "when",

    "where",

    "why",

    "how",

    "who",

    "which",

    "is",

    "are",

    "was",

    "were",

    "be",

    "to",

    "of",

    "in",

    "on",

    "at",

    "by",

    "as",

    "it",

    "its",

    "their",

    "they",

    "them",

    "has",

    "have",

    "had",

    "will",

    "would",

    "could",

    "should",

    "said",

    "says",

  ]);



function getTerms(

  value: string

): string[] {

  return Array.from(

    new Set(

      normalize(value)

        .split(/\s+/)

        .filter(

          (term) =>

            term.length >= 3 &&

            !STOP_WORDS.has(term)

        )

    )

  );

}



function scoreSupportingArticle(

  article: Article,

  selected: SelectedStory

): number {

  const titleTerms =

    getTerms(

      selected.title

    );



  const descriptionTerms =

    getTerms(

      selected.description

    );



  const articleTitle =

    normalize(

      article.title

    );



  const articleDescription =

    normalize(

      article.description

    );



  let score = 0;



  /*

   \* Strong weight for title overlap.

   */

  for (const term of titleTerms) {

    if (

      articleTitle.includes(term)

    ) {

      score += 7;

    } else if (

      articleDescription.includes(

        term

      )

    ) {

      score += 2;

    }

  }



  /*

   \* Description overlap.

   */

  for (const term of descriptionTerms) {

    if (

      articleTitle.includes(term)

    ) {

      score += 4;

    } else if (

      articleDescription.includes(

        term

      )

    ) {

      score += 1;

    }

  }



  /*

   \* Same story / near-identical headline.

   */

  if (

    sameTitle(

      article.title,

      selected.title

    )

  ) {

    score += 30;

  }



  /*

   \* Same publication isn't independent

   \* corroboration.

   */

  if (

    normalize(

      article.source

    ) ===

    normalize(

      selected.source

    )

  ) {

    score -= 3;

  }



  return score;

}



/* =========================================================

   GEMINI

   ========================================================= */



function getStatus(

  error: any

): number | null {

  const values = [

    error?.status,

    error?.statusCode,

    error?.code,

    error?.response?.status,

    error?.response?.code,

  ];



  for (const value of values) {

    const number =

      Number(value);



    if (

      Number.isFinite(number) &&

      number > 0

    ) {

      return number;

    }

  }



  return null;

}



function getErrorMessage(

  error: any

): string {

  return (

    error?.message ||

    error?.error?.message ||

    "AI request failed."

  );

}



async function generateStory(

  topic: string,

  selectedStory: SelectedStory,

  articles: Article[],

  sources: Source[]

): Promise<StoryResult> {

  if (!ai) {

    throw new Error(

      "GEMINI_API_KEY is not configured."

    );

  }



  const sourceMaterial =

    articles

      .map(

        (article) => {

          const source =

            sources.find(

              (item) =>

                item.url ===

                article.url

            );



          return `

SOURCE ID: ${source?.id ?? "UNKNOWN"}



PUBLICATION:

${article.source}



TITLE:

${article.title}



DATE:

${article.publishedAt || "Unknown"}



URL:

${article.url}



DESCRIPTION:

${

  article.description ||

  "No description available."

}

`;

        }

      )

      .join(

        "\n-----------------------------\n"

      );



  const prompt = `

You are EIRA.



EIRA is an information product whose job is to

help a person UNDERSTAND a story, not merely

summarize it.



The user found this specific story:



TITLE:

${selectedStory.title}



SOURCE:

${selectedStory.source}



DATE:

${selectedStory.publishedAt || "Unknown"}



DESCRIPTION:

${selectedStory.description || "None"}



URL:

${selectedStory.url}



USER'S SEARCH TOPIC:

${topic}



The user clicked:



"Understand this story"



Therefore THIS story is the primary subject.



Do not replace it with a generic overview of

the search topic.



The additional sources below exist to help you

verify the story, add context, explain the

mechanism, or show what remains uncertain.



\==================================================

THE EIRA STANDARD

\==================================================



A bad result says:



"Experts highlighted the importance of continued

investment and structural reforms."



A good result says:



"Here is the specific thing happening.

Here is what it means.

Here is the piece the headline leaves out.

Here is the number, mechanism, comparison,

or connection that makes it understandable.

Here is what we still cannot conclude."



The reader should have at least ONE genuine

"oh, now I get it" moment.



\==================================================

CONTENT RULES

\==================================================



1. Use ONLY information supported by the supplied

   sources.



2. You may perform simple arithmetic or logical

   reasoning using numbers and facts explicitly

   contained in the sources.



3. Do NOT introduce outside facts.



4. Do NOT invent people, companies, numbers,

   dates, events, causes, consequences, or quotes.



5. Do NOT turn a person's statement into an

   established fact.



6. Clearly distinguish:

   \- what happened

   \- what someone said

   \- what the reporting establishes

   \- what remains uncertain



7. Multiple articles repeating the same statement

   are NOT automatically independent confirmation.



8. Do not include a related story just because

   it contains the same keyword.



9. Do not drift into a general topic explainer.



10. Every section must directly help the reader

    understand THIS story.



\==================================================

HEADLINE

\==================================================



Do NOT copy the original headline.



Create a headline that captures the most

interesting underlying idea.



The headline should make the reader think:



"Okay, I want to understand that."



Avoid clickbait.



\==================================================

DECK

\==================================================



One sentence.



Explain the actual development without

repeating the headline.



\==================================================

HOOK

\==================================================



2-4 sentences.



Give the reader the first useful insight.



Do not merely repeat the deck.



\==================================================

STORY SECTIONS

\==================================================



Create 3 to 5 sections.



Do NOT use the same fixed headings for every story.



Choose headings based on the story.



Possible patterns:



"What the headline leaves out"



"Why this number matters"



"What has to happen for this to work"



"Why this is happening now"



"The claim versus the evidence"



"What remains unclear"



But only use them when appropriate.



Each section should answer a natural question

a curious reader would ask next.



The explanation should generally move through:



WHAT HAPPENED

↓

WHAT DOES IT ACTUALLY MEAN?

↓

WHAT DOES THE HEADLINE LEAVE OUT?

↓

WHY NOW / WHAT HAS TO HAPPEN?

↓

WHAT IS KNOWN AND UNKNOWN?



Do not mechanically include every step.



\==================================================

NO GENERIC AI PROSE

\==================================================



Avoid phrases like:



"highlights the importance"



"underscores the need"



"rapidly evolving landscape"



"strong structural execution"



"significant implications"



"moving forward"



"key stakeholders"



"amid growing uncertainty"



"the broader ecosystem"



unless the specific wording is genuinely necessary.



Replace vague language with concrete explanation.



\==================================================

SOURCES

\==================================================



Use only the supplied source IDs.



Attach source IDs to sections containing factual

claims.



Do not attach every source to every section.



Use the smallest useful set of sources.



\==================================================

TAKEAWAY

\==================================================



The takeaway should be one useful insight.



It should NOT simply restate the story.



The reader should remember something after

leaving the page.



\==================================================

OUTPUT

\==================================================



Return ONLY valid JSON.



Use exactly this structure:



{

  "mode": "story",

  "headline": "EIRA headline",

  "deck": "One sentence.",

  "hook": "Short useful opening.",

  "sections": [

    {

      "heading": "Specific story heading",

      "paragraphs": [

        "Paragraph one.",

        "Paragraph two."

      ],

      "sourceIds": ["S1"]

    }

  ],

  "bottomLine": "One useful insight."

}



SOURCE MATERIAL:



${sourceMaterial}

`;



  const models = [

    "gemini-3.6-flash",

    "gemini-3.5-flash-lite",

  ];



  let lastError: unknown =

    null;



  for (const model of models) {

    for (

      let attempt = 0;

      attempt < 2;

      attempt++

    ) {

      try {

        const response =

          await ai.models.generateContent(

            {

              model,

              contents: prompt,

              config: {

                temperature: 0.35,

                responseMimeType:

                  "application/json",

              },

            }

          );



        const raw =

          response.text?.trim();



        if (!raw) {

          throw new Error(

            "Gemini returned an empty response."

          );

        }



        let parsed: any;



        try {

          parsed =

            JSON.parse(raw);

        } catch {

          const start =

            raw.indexOf("{");



          const end =

            raw.lastIndexOf("}");



          if (

            start === -1 ||

            end === -1

          ) {

            throw new Error(

              "Gemini returned invalid JSON."

            );

          }



          parsed =

            JSON.parse(

              raw.slice(

                start,

                end + 1

              )

            );

        }



        if (

          !parsed ||

          typeof parsed !==

            "object" ||

          typeof parsed.headline !==

            "string" ||

          typeof parsed.deck !==

            "string" ||

          typeof parsed.hook !==

            "string" ||

          !Array.isArray(

            parsed.sections

          ) ||

          typeof parsed.bottomLine !==

            "string"

        ) {

          throw new Error(

            "Gemini returned an incomplete story."

          );

        }



        const validSourceIds =

          new Set(

            sources.map(

              (source) =>

                source.id

            )

          );



        const sections: StorySection[] =

          parsed.sections

            .filter(

              (section: any) =>

                section &&

                typeof section.heading ===

                  "string" &&

                Array.isArray(

                  section.paragraphs

                )

            )

            .map(

              (

                section: any

              ) => ({

                heading:

                  cleanText(

                    section.heading

                  ),



                paragraphs:

                  section.paragraphs

                    .filter(

                      (

                        paragraph: any

                      ) =>

                        typeof paragraph ===

                        "string"

                    )

                    .map(

                      (

                        paragraph: string

                      ) =>

                        cleanText(

                          paragraph

                        )

                    )

                    .filter(Boolean)

                    .slice(0, 4),



                sourceIds:

                  Array.isArray(

                    section.sourceIds

                  )

                    ? section.sourceIds

                        .filter(

                          (

                            id: any

                          ) =>

                            typeof id ===

                            "string"

                        )

                        .filter(

                          (

                            id: string

                          ) =>

                            validSourceIds.has(

                              id

                            )

                        )

                    : [],

              })

            )

            .filter(

              (

                section: StorySection

              ) =>

                section.heading.length >

                  0 &&

                section.paragraphs

                  .length > 0

            )

            .slice(0, 5);



        if (!sections.length) {

          throw new Error(

            "Gemini returned no usable sections."

          );

        }



        return {

          mode: "story",



          headline:

            cleanText(

              parsed.headline

            ),



          deck:

            cleanText(

              parsed.deck

            ),



          hook:

            cleanText(

              parsed.hook

            ),



          sections,



          bottomLine:

            cleanText(

              parsed.bottomLine

            ),

        };

      } catch (error) {

        lastError = error;



        console.error(

          `EIRA story generation failed using ${model}:`,

          error

        );



        const status =

          getStatus(error);



        if (status === 429) {

          break;

        }



        if (

          status === 500 ||

          status === 502 ||

          status === 503 ||

          status === 504

        ) {

          if (

            attempt === 0

          ) {

            await new Promise(

              (resolve) =>

                setTimeout(

                  resolve,

                  1000

                )

            );



            continue;

          }

        }



        break;

      }

    }

  }



  const status =

    getStatus(lastError);



  if (status === 429) {

    throw new Error(

      "EIRA's AI service has reached its current usage limit."

    );

  }



  if (

    status === 500 ||

    status === 502 ||

    status === 503 ||

    status === 504

  ) {

    throw new Error(

      "EIRA's AI service is temporarily busy. Please try again."

    );

  }



  throw new Error(

    getErrorMessage(

      lastError

    )

  );

}



/* =========================================================

   MAIN STORY API

   ========================================================= */



export async function POST(

  request: Request

) {

  try {

    const body =

      await request.json();



    const topic =

      typeof body?.topic ===

      "string"

        ? body.topic.trim()

        : "";



    const rawSelected =

      body?.selectedStory;



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



    if (

      !rawSelected ||

      typeof rawSelected !==

        "object"

    ) {

      return NextResponse.json(

        {

          error:

            "No story was selected.",

        },

        {

          status: 400,

        }

      );

    }



    const selectedStory: SelectedStory =

      {

        title:

          cleanTitle(

            rawSelected.title

          ),



        source:

          cleanSource(

            rawSelected.source,

            rawSelected.url || "",

            rawSelected.title

          ),



        publishedAt:

          cleanText(

            rawSelected.publishedAt

          ),



        description:

          cleanText(

            rawSelected.description

          ),



        url:

          cleanText(

            rawSelected.url

          ),

      };



    if (

      !selectedStory.title ||

      !selectedStory.url

    ) {

      return NextResponse.json(

        {

          error:

            "The selected story is missing required information.",

        },

        {

          status: 400,

        }

      );

    }



    /* -----------------------------------------------------

       SEARCH THE EXACT STORY FIRST

       ----------------------------------------------------- */



    let exactArticles =

      await searchNews(

        `"${selectedStory.title}"`

      );



    /*

     \* Find the actual publisher for the

     \* selected story.

     \*

     \* This fixes the "GOOGLE" problem when

     \* Explore passed Google as the source.

     */

    const matchingArticle =

      exactArticles.find(

        (article) =>

          sameTitle(

            article.title,

            selectedStory.title

          )

      );



    if (matchingArticle) {

      selectedStory.source =

        cleanSource(

          matchingArticle.source,

          matchingArticle.url,

          matchingArticle.title

        );



      if (

        !selectedStory.publishedAt &&

        matchingArticle.publishedAt

      ) {

        selectedStory.publishedAt =

          matchingArticle.publishedAt;

      }



      if (

        !selectedStory.description &&

        matchingArticle.description

      ) {

        selectedStory.description =

          matchingArticle.description;

      }

    }



    /* -----------------------------------------------------

       TOPIC FALLBACK

       ----------------------------------------------------- */



    let topicArticles: Article[] =

      [];



    if (

      exactArticles.length < 4

    ) {

      topicArticles =

        await searchNews(

          topic

        );

    }



    const allArticles =

      dedupeArticles([

        ...exactArticles,

        ...topicArticles,

      ]);



    /* -----------------------------------------------------

       SUPPORTING SOURCES

       ----------------------------------------------------- */



    const supportingArticles =

      allArticles

        .filter(

          (article) =>

            !sameTitle(

              article.title,

              selectedStory.title

            )

        )

        .map(

          (article) => ({

            article,

            score:

              scoreSupportingArticle(

                article,

                selectedStory

              ),

          })

        )

        .filter(

          (item) =>

            item.score >= 8

        )

        .sort(

          (a, b) =>

            b.score - a.score

        )

        .slice(0, 4)

        .map(

          (item) =>

            item.article

        );



    /*

     \* Selected story is ALWAYS first.

     */

    const selectedArticle: Article =

      {

        title:

          selectedStory.title,



        source:

          selectedStory.source,



        publishedAt:

          selectedStory.publishedAt,



        description:

          selectedStory.description,



        url:

          selectedStory.url,

      };



    const finalArticles =

      dedupeArticles([

        selectedArticle,

        ...supportingArticles,

      ]).slice(0, 5);



    if (

      finalArticles.length === 0

    ) {

      return NextResponse.json(

        {

          error:

            "EIRA couldn't find enough reporting for this story.",

        },

        {

          status: 404,

        }

      );

    }



    /* -----------------------------------------------------

       SOURCES

       ----------------------------------------------------- */



    const sources: Source[] =

      finalArticles.map(

        (

          article,

          index

        ) => ({

          id:

            `S${index + 1}`,



          title:

            article.title,



          source:

            cleanSource(

              article.source,

              article.url,

              article.title

            ),



          publishedAt:

            article.publishedAt,



          url:

            article.url,

        })

      );



    /* -----------------------------------------------------

       GENERATE STORY

       ----------------------------------------------------- */



    const result =

      await generateStory(

        topic,

        selectedStory,

        finalArticles,

        sources

      );



    return NextResponse.json(

      {

        result,

        sources,

        selectedStory,

      },

      {

        status: 200,

      }

    );

  } catch (error) {

    console.error(

      "EIRA Story API error:",

      error

    );



    return NextResponse.json(

      {

        error:

          error instanceof Error

            ? error.message

            : "EIRA couldn't build this story.",

      },

      {

        status: 500,

      }

    );

  }

}
