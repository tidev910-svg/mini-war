# Mini War

Browser-only RTS using Vite, TypeScript, HTML/CSS, and Canvas 2D.

Hướng dẫn tải và chạy dự án (tiếng Việt): [docs/HUONG-DAN-CHAY-DU-AN.md](docs/HUONG-DAN-CHAY-DU-AN.md).

Start with pnpm install followed by pnpm dev. Create a static build with pnpm build and inspect it using pnpm preview.

Project layout:
- index.html: accessible game shell
- src/main.ts: simulation and browser input/network wiring
- src/style.css: base styles and Storybook strategy skin
- docs/: design documents and original standalone HTML baseline

The simulation is being migrated gradually to typed modules to preserve existing gameplay. Browser P2P still depends on PeerJS and external connectivity.
