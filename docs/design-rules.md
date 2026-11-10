# Design rules
DESIGN.md in the repo root holds this site's look. This file explains how to make and use it. For buying fonts, icons, photos, or templates, follow docs/assets.md.

## 1. Making DESIGN.md
If DESIGN.md doesn't exist yet:
1. Ask me whether I want to buy a template or UI kit for this site. Show me the best free and paid options per docs/assets.md.
2. If I buy a template, build DESIGN.md from the template first. It's the base.
3. Ask me for 1 to 3 websites whose look I like. Run the taste skill on each and save its output in docs/design/. If there's a template, use these only for extra touches. If there's no template, combine them into the base.
4. DESIGN.md covers colors, fonts, spacing, rounded corners, shadows, and the main page parts (header, buttons, cards, footer).
5. Show me a short summary and one sample page before using it everywhere.

### Getting the taste skill
If the taste skill (by Senlin, the one that analyzes a website from a URL) isn't in .claude/skills/taste/, get it from PASTE_LINK_HERE and save it there so it stays with the project. If you can't download it, ask me for the skill file. If it can't open a browser, ask me to install a browser tool (like Playwright) with buttons, recommended option first.

## 2. Using DESIGN.md
- The analyzed sites are inspiration, not something to copy. Keep the feel, layout ideas, and spacing.
- Use this project's own brand colors, logo, name, and images. Never leave another company's name, logo, or signature brand color in the finished site.
- If a page needs something DESIGN.md doesn't cover, design it to match and add it to DESIGN.md.
- Keep colors, fonts, and spacing in one place (CSS variables or a theme file) so the whole site changes from one spot.
