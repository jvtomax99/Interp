# Where this skill came from

- Taste skill by Senlin: https://github.com/senlindesign/taste-skill
- Copied 2026-11-10 from commit 6dce223 (SKILL.md, README.md, references/). The landing page images in its docs/ folder and its evals/ were left out.
- License: MIT, per the badge in its README. The repo has no LICENSE file of its own.
- It asks for the Playwright MCP server. In a cloud session, use the Playwright that is already installed instead: run references/extract.js in a Node script as `page.evaluate("(" + src.trim().replace(/;$/, "") + ")()")` (the file is one arrow function ending in a semicolon), and take the screenshots there. Tested 2026-11-10 on the Phillis site: it returned colours, fonts, spacing and the grid.
