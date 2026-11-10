# Cleanup audit

Report only. Don't delete or change anything. Only run this between phases, with no unfinished work.

1. Run tools first instead of reading every file: for JavaScript/TypeScript, npx knip and npx depcheck (npx, so nothing gets installed); for other languages, the closest equivalent.
2. Use Haiku subagents to check what the tools flag, plus: duplicate logic, unused UI components, overly complicated code, and files that look abandoned.
3. For every item, check it isn't used in a way scanners miss: loaded by name at runtime, asset file paths, routes, database collections, or config.
4. Code only. Never suggest deleting database data or collections. Redundant database or API calls go to the "Later" list in SPEC.md as real changes, not cleanup.
5. Write findings to docs/CLEANUP.md as numbered items. For each: what it is, why it's not needed, what removing it improves, and a risk level (low, medium, high). Skip items already listed. Remove items marked done.
6. At the top of docs/CLEANUP.md, update the line "Last audit: [today's date], after phase [number]."
7. Show me the top 5 by impact in plain words, then buttons: "Clean up the low-risk ones" (recommended), "Pick individually," or "Just keep the report."
