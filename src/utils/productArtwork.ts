export type BotanicalVesselType =
  | 'serum'
  | 'cleanser'
  | 'toothpaste'
  | 'coffee'
  | 'soap'
  | 'toner'
  | 'shampoo'
  | 'oil'
  | 'cream'
  | 'elixir'
  | 'cereal'
  | 'cocoa'
  | 'hero'
  | 'editorial';

export function createStudioProductDataUri(params: {
  vessel: BotanicalVesselType;
  labelTitle: string;
  labelSubtitle: string;
  volume?: string;
  accentHex?: string;
  bgTone?: 'ivory' | 'sage' | 'forest' | 'stone';
}): string {
  const {
    vessel,
    labelTitle,
    labelSubtitle,
    volume = '150ml',
    accentHex = '#C6A76A',
    bgTone = 'ivory',
  } = params;

  const palettes = {
    ivory: { bg1: '#F8F6EF', bg2: '#EAE4D3', stone: '#DFD8C5', shadow: '#C9C0AA' },
    sage: { bg1: '#EEF2EC', bg2: '#D5E0D0', stone: '#C3D0BD', shadow: '#AAB9A3' },
    forest: { bg1: '#173D32', bg2: '#0F2921', stone: '#245B45', shadow: '#091B15' },
    stone: { bg1: '#F3EFE6', bg2: '#E2DAC9', stone: '#D2C8B3', shadow: '#B8AD96' },
  };

  const p = palettes[bgTone] || palettes.ivory;
  const safeTitle = labelTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeSub = labelSubtitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeVol = volume.replace(/&/g, '&amp;');

  let vesselMarkup = '';

  if (vessel === 'serum' || vessel === 'oil' || vessel === 'elixir' || vessel === 'toner') {
    vesselMarkup = `
      <!-- Amber/Emerald Glass Bottle -->
      <rect x="355" y="135" width="90" height="36" rx="8" fill="#252B27" />
      <rect x="342" y="170" width="116" height="24" rx="4" fill="${accentHex}" />
      <rect x="372" y="102" width="56" height="38" rx="26" fill="#252B27" />
      <path d="M315 235 C315 202, 342 194, 342 194 L458 194 C458 194, 485 202, 485 235 L485 450 C485 466, 472 476, 456 476 L344 476 C328 476, 315 466, 315 450 Z" fill="url(#bottleGlass)" stroke="${accentHex}" stroke-width="1.5" />
      <rect x="327" y="258" width="146" height="165" rx="4" fill="#F8F6EF" opacity="0.96" />
      <rect x="333" y="264" width="134" height="153" rx="2" fill="none" stroke="${accentHex}" stroke-width="1" opacity="0.7" />
      <text x="400" y="294" text-anchor="middle" font-family="Georgia, serif" font-size="10" letter-spacing="2.5" fill="#173D32" font-weight="bold">DXN ORGANIC</text>
      <line x1="355" y1="306" x2="445" y2="306" stroke="${accentHex}" stroke-width="1" />
      <text x="400" y="334" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#252B27" font-weight="bold">${safeTitle}</text>
      <text x="400" y="356" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#245B45">${safeSub}</text>
      <text x="400" y="400" text-anchor="middle" font-family="monospace" font-size="10" fill="#5A655E">${safeVol}</text>
    `;
  } else if (vessel === 'cleanser' || vessel === 'toothpaste' || vessel === 'shampoo') {
    vesselMarkup = `
      <!-- Botanical Soft-Touch Tube / Pump -->
      <path d="M295 160 L505 160 L478 430 L322 430 Z" fill="url(#bottleGlass)" stroke="${accentHex}" stroke-width="1.5" />
      <rect x="293" y="148" width="214" height="16" rx="3" fill="${accentHex}" />
      <rect x="342" y="430" width="116" height="46" rx="6" fill="#F8F6EF" stroke="#D2C8B3" stroke-width="1.5" />
      <rect x="322" y="210" width="156" height="175" rx="6" fill="#F8F6EF" opacity="0.96" />
      <text x="400" y="244" text-anchor="middle" font-family="Georgia, serif" font-size="10" letter-spacing="2.5" fill="#173D32" font-weight="bold">DXN BOTANICAL</text>
      <line x1="350" y1="256" x2="450" y2="256" stroke="${accentHex}" stroke-width="1" />
      <text x="400" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="11.5" fill="#252B27" font-weight="bold">${safeTitle}</text>
      <text x="400" y="314" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#245B45">${safeSub}</text>
      <text x="400" y="362" text-anchor="middle" font-family="monospace" font-size="10" fill="#5A655E">${safeVol}</text>
    `;
  } else if (vessel === 'coffee' || vessel === 'cereal' || vessel === 'cocoa') {
    vesselMarkup = `
      <!-- Artisanal Standing Kraft/Forest Pouch & Ceramic Cup -->
      <path d="M265 155 C265 142, 275 135, 290 135 L470 135 C485 135, 495 142, 495 155 L510 465 C510 474, 502 478, 490 478 L270 478 C258 478, 250 474, 250 465 Z" fill="url(#bottleGlass)" stroke="${accentHex}" stroke-width="1.5" />
      <line x1="262" y1="168" x2="498" y2="168" stroke="${accentHex}" stroke-width="1.5" stroke-dasharray="4 3" />
      <rect x="285" y="205" width="190" height="215" rx="6" fill="#F8F6EF" opacity="0.97" />
      <rect x="293" y="213" width="174" height="199" rx="3" fill="none" stroke="${accentHex}" stroke-width="1" />
      <text x="380" y="248" text-anchor="middle" font-family="Georgia, serif" font-size="10" letter-spacing="2.5" fill="#173D32" font-weight="bold">DXN WELLNESS</text>
      <line x1="325" y1="262" x2="435" y2="262" stroke="${accentHex}" stroke-width="1" />
      <text x="380" y="298" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#252B27" font-weight="bold">${safeTitle}</text>
      <text x="380" y="322" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#245B45">${safeSub}</text>
      <text x="380" y="388" text-anchor="middle" font-family="monospace" font-size="10" fill="#5A655E">${safeVol}</text>
      <!-- Ceramic Cup beside pouch -->
      <path d="M465 385 L565 385 L555 468 C553 475, 545 478, 535 478 L495 478 C485 478, 477 475, 475 468 Z" fill="#F8F6EF" stroke="#D2C8B3" stroke-width="2" />
      <path d="M562 402 C585 402, 585 445, 558 445" fill="none" stroke="#F8F6EF" stroke-width="8" />
      <ellipse cx="515" cy="385" rx="50" ry="9" fill="#3B2314" stroke="#C6A76A" stroke-width="1.5" />
    `;
  } else {
    vesselMarkup = `
      <!-- Apothecary Glass Jar / Box Set -->
      <rect x="275" y="225" width="250" height="42" rx="8" fill="#252B27" />
      <rect x="282" y="263" width="236" height="12" fill="${accentHex}" />
      <rect x="265" y="275" width="270" height="200" rx="18" fill="url(#bottleGlass)" stroke="${accentHex}" stroke-width="1.5" />
      <rect x="295" y="302" width="210" height="145" rx="6" fill="#F8F6EF" opacity="0.96" />
      <text x="400" y="335" text-anchor="middle" font-family="Georgia, serif" font-size="10" letter-spacing="2.5" fill="#173D32" font-weight="bold">DXN ORGANIC POINT</text>
      <line x1="340" y1="347" x2="460" y2="347" stroke="${accentHex}" stroke-width="1" />
      <text x="400" y="378" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#252B27" font-weight="bold">${safeTitle}</text>
      <text x="400" y="400" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#245B45">${safeSub}</text>
      <text x="400" y="432" text-anchor="middle" font-family="monospace" font-size="10" fill="#5A655E">${safeVol}</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.bg1}" />
        <stop offset="100%" stop-color="${p.bg2}" />
      </linearGradient>
      <linearGradient id="bottleGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#123128" />
        <stop offset="28%" stop-color="#245B45" />
        <stop offset="70%" stop-color="#173D32" />
        <stop offset="100%" stop-color="#0D241D" />
      </linearGradient>
      <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#EFECE4" />
        <stop offset="55%" stop-color="${p.stone}" />
        <stop offset="100%" stop-color="${p.shadow}" />
      </linearGradient>
    </defs>

    <!-- Studio Canvas -->
    <rect width="800" height="600" fill="url(#bgGrad)" />

    <!-- Architectural Sunlight Shadow Ray -->
    <polygon points="0,0 360,0 680,600 0,600" fill="#FFFFFF" opacity="0.28" />

    <!-- Soft Botanical Halo & Leaf Silhouettes -->
    <circle cx="400" cy="300" r="210" fill="#A8B9A0" opacity="0.18" />
    <path d="M210 440 C160 360, 190 250, 275 220 C245 300, 250 380, 290 445 Z" fill="#245B45" opacity="0.22" />
    <path d="M590 435 C640 350, 610 240, 520 215 C550 295, 540 375, 505 440 Z" fill="#173D32" opacity="0.18" />

    <!-- Travertine Stone Pedestal -->
    <ellipse cx="400" cy="482" rx="220" ry="26" fill="#EFECE4" />
    <path d="M180 482 L620 482 L620 538 C620 552, 521 564, 400 564 C279 564, 180 552, 180 538 Z" fill="url(#pedestalGrad)" />
    <ellipse cx="400" cy="482" rx="220" ry="26" fill="none" stroke="${accentHex}" stroke-width="1" opacity="0.45" />

    ${vesselMarkup}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
