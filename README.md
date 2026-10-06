EIRA HOME PIPELINE FIX — 05 OCT 2026

Replace these two files in the current EIRA project:

1. route(3).ts
   -> your current Home API route (/api/home)
2. eira-translate.ts
   -> your current translation utility

WHAT THIS FIX CHANGES
- Adds a dedicated Technology editorial category.
- Retrieves Tamil Nadu, India and World news by editorial beat instead of one giant global ranking.
- Reserves topic coverage before filling remaining slots by score.
- Translates only the stories that Home actually renders (3 regional + 3 India + 2 World).
- Adds a 6-hour in-process translation cache for repeated language switches.
- Improves Tamil translation instructions for natural news-style Tamil.
- Raises the normal Home freshness window from 36h to 48h.
- Adds a bounded 72h emergency pool so a transient feed timestamp problem does not create an empty Home.
- Reduces Home retrieval from roughly 28 Google News queries to 19.
- Adds 5-minute shared-cache headers with stale-while-revalidate.

IMPORTANT
This does not change the Home visual design. Do not replace the Home page yet.
First replace these two backend files, run the app, and verify the API/Home feed.

RUN
npm run dev

Then open:
/api/home?region=Tamil%20Nadu&lang=en
/api/home?region=Tamil%20Nadu&lang=ta
/api/home?region=Tamil%20Nadu&lang=hi

The JSON should contain non-empty regional, india and world arrays when current reporting exists.

After that, test the UI in this order:
English -> Tamil -> Hindi -> English
Home -> refresh -> Home again

Do NOT change Gemini model names or unrelated UI files during this test.
