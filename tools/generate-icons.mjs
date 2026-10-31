#!/usr/bin/env node
import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'static', 'icons');
await mkdir(outDir, { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4FB3E8"/>
      <stop offset="1" stop-color="#9BDCF7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#sky)"/>
  <circle cx="408" cy="96" r="46" fill="#FFC93C"/>
  <circle cx="408" cy="96" r="60" fill="#FFC93C" opacity="0.22"/>
  <g fill="#FFF6E3" opacity="0.94">
    <ellipse cx="104" cy="126" rx="48" ry="20"/>
    <ellipse cx="80" cy="112" rx="24" ry="22"/>
    <ellipse cx="120" cy="110" rx="20" ry="18"/>
    <ellipse cx="360" cy="168" rx="40" ry="16"/>
    <ellipse cx="342" cy="156" rx="18" ry="16"/>
  </g>
  <path d="M0 356 C 120 330, 300 330, 512 372 L512 512 L0 512 Z" fill="#7CC242"/>
  <path d="M0 420 C 150 390, 310 360, 512 392 L512 512 L0 512 Z" fill="#4E8F2A" opacity="0.35"/>
  <path d="M-40 470 C 120 448, 290 386, 552 296" fill="none" stroke="#6B6F76" stroke-width="102" stroke-linecap="round"/>
  <path d="M-40 470 C 120 448, 290 386, 552 296" fill="none" stroke="#FFF6E3" stroke-width="9" stroke-dasharray="26 32" stroke-linecap="round"/>
  <g transform="translate(188 300) rotate(-12)">
    <ellipse cx="52" cy="94" rx="70" ry="13" fill="rgba(38,49,60,0.20)"/>
    <circle cx="10" cy="70" r="9" fill="#3B82D6" stroke="#26313C" stroke-width="5"/>
    <circle cx="34" cy="58" r="9" fill="#3B82D6" stroke="#26313C" stroke-width="5"/>
    <rect x="0" y="44" width="116" height="36" rx="18" fill="#3B82D6" stroke="#26313C" stroke-width="6"/>
    <rect x="22" y="20" width="70" height="34" rx="14" fill="#FFF6E3" stroke="#26313C" stroke-width="6"/>
    <rect x="30" y="26" width="54" height="17" rx="8" fill="#26313C" opacity="0.85"/>
    <circle cx="26" cy="82" r="14" fill="#26313C"/>
    <circle cx="26" cy="82" r="5" fill="#FFF6E3"/>
    <circle cx="92" cy="82" r="14" fill="#26313C"/>
    <circle cx="92" cy="82" r="5" fill="#FFF6E3"/>
    <circle cx="46" cy="33" r="3.5" fill="#26313C"/>
    <circle cx="68" cy="33" r="3.5" fill="#26313C"/>
    <path d="M52 40 Q57 44 62 40" fill="none" stroke="#26313C" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g transform="translate(386 224)">
    <ellipse cx="0" cy="0" rx="30" ry="37" fill="#E8433F" stroke="#26313C" stroke-width="6"/>
    <ellipse cx="-9" cy="-12" rx="6" ry="10" fill="#FFF6E3" opacity="0.55" transform="rotate(-24 -9 -12)"/>
    <path d="M-7 35 L0 49 L7 35" fill="#FFF6E3" stroke="#26313C" stroke-width="4"/>
    <path d="M0 48 C -8 62, 10 64, 2 78" fill="none" stroke="#26313C" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

await writeFile(path.join(outDir, 'icon.svg'), svg);

for (const size of [32, 180, 192, 512]) {
	const png = new Resvg(svg, {
		fitTo: { mode: 'width', value: size },
		background: '#7EC8F2'
	})
		.render()
		.asPng();
	const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
	await writeFile(path.join(outDir, name), png);
	console.log(`icons/${name}`);
}
