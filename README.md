# Zoom Town

A portrait-first 3D toy-town racer for children aged 5–7. The car drives itself, the child steers, pops balloons, and boosts. Nobody loses; stars unlock the four animal drivers.

## Run

```sh
pnpm install
pnpm dev --host 127.0.0.1 --port 4180
```

Open the portrait viewport at `http://127.0.0.1:4180/`. The game is designed for a phone in portrait; desktop shows a centred portrait column.

## Commands

```sh
pnpm check        # svelte-check + TypeScript
pnpm build        # static build into build/
pnpm preview      # serve the production build
pnpm test:unit    # Vitest
pnpm test:e2e     # Playwright (portrait flow)
pnpm lint         # Prettier check
pnpm format       # Prettier write
pnpm audio        # regenerate voice/SFX/music with the local studio
pnpm icons        # regenerate PWA icons from the inline SVG
```

## Audio

All audio is generated locally and committed under `static/audio`; the game never uses browser speech synthesis and never fetches audio from a third party at runtime.

- Voices: Qwen3-TTS via `../music-sfx-voice-studio` (`/voice`), Italian and English.
- Music and organic SFX: Stable Audio 3 via the same studio (`/music`, `/sfx/text`).
- Clicks, beeps, rail and bump: the studio's procedural `/sfx` presets.

`pnpm audio --voices`, `--sfx`, `--music`, or `--all --force` regenerates the assets. The studio API must be running at `127.0.0.1:7910`; its token is read from `../music-sfx-voice-studio/data/token`.

## Docs

- [`GLOSSARY.md`](GLOSSARY.md) — the shared language.
- [`ART-STYLE.md`](ART-STYLE.md) — palette, shapes, lighting, motion, HUD.
- [`docs/SPEC.md`](docs/SPEC.md) — screens, rules, track, save schema, acceptance tests.
- [`docs/adr/`](docs/adr/) — stack, portrait-only, no-loss design, code-built art and locally generated audio.

## Deploy

`pnpm build` writes a static site to `build/`. Serve it with Cloudflare Workers static assets (Wrangler) or any static host with SPA fallback. The PWA manifest is portrait-only and the service worker precaches the shell and audio for offline play after the first load.
