# Mini War

Browser-only RTS using Vite, TypeScript, HTML/CSS, and Canvas 2D.

Hướng dẫn tải và chạy dự án (tiếng Việt): [docs/guides/HUONG-DAN-CHAY-DU-AN.md](docs/guides/HUONG-DAN-CHAY-DU-AN.md).

Start with pnpm install followed by pnpm dev. Create a static build with pnpm build and inspect it using pnpm preview.

Tests: `pnpm test` (unit tests, vitest + jsdom) and `pnpm smoke` (headless Chrome, needs `pnpm dev` running).

Project layout:
- index.html: game shell
- src/main.ts: entry point; src/config, core, map, sim, ai, net, render, ui: game modules by feature (see docs/architecture.md)
- src/style.css: Storybook theme
- tests/: unit tests; scripts/smoke/: browser smoke tests; scripts/start-game.bat: Windows launcher
- public/assets/: sprites used by the game; art/: source art; tools/: sprite build scripts
- docs/: feature documentation (Vietnamese), guides, decisions, backlog

Browser P2P still depends on PeerJS (loaded from a CDN) and external connectivity.
