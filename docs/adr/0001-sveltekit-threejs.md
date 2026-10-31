# SvelteKit static shell with Three.js for the 3D scene

**Status:** accepted · 2026-10-31

Zoom Town is the first 3D game in the playground, and the existing kids projects already use SvelteKit with a static adapter, PWA conventions, and file-based routing. We chose SvelteKit 3 + adapter-static for the app shell, menus, HUD, save handling, and deployment, with Three.js owning a single WebGL canvas and all game rendering. Svelte is the right tool for the UI and state; Three.js is the smallest, most familiar 3D runtime and has no opinion about the app shell. We rejected plain Vite + Three.js (loses the house routing/PWA/i18n patterns), React Three Fiber (introduces a second frontend ecosystem), and Babylon.js (heavier and a different mental model) because none of them buy us anything for a one-track arcade game.
