// ============================================================
// Nuestro Mundo — Secret Garden Terrain
// ============================================================
// Renders the base terrain layer (grass, path, small pond)
// using scalable SVG for the Jardín Secreto.
// ============================================================

import React from 'react';

export default function SecretGardenTerrain() {
  return (
    <div
      className="terrain-container"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '80%',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMax slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* Base Grass */}
        <rect width="1000" height="800" fill="#75C783" />

        {/* Grass Variations (patches) */}
        <path d="M -100 200 Q 200 100 400 350 T 1100 250 L 1100 800 L -100 800 Z" fill="#68A063" />
        <path d="M -100 450 Q 150 350 300 550 T 900 400 L 1100 500 L 1100 800 L -100 800 Z" fill="#58B268" />

        {/* Dirt Path */}
        <path d="M 200 -50 Q 350 300 300 500 T 150 850 L 400 850 Q 550 550 450 350 T 350 -50 Z" fill="#DEB887" />
        <path d="M 220 -50 Q 360 290 320 490 T 180 850 L 370 850 Q 520 560 420 340 T 330 -50 Z" fill="#CBA06B" /> {/* Path shading */}

        {/* Small Pond */}
        <ellipse cx="800" cy="550" rx="150" ry="70" fill="#4682B4" />
        <ellipse cx="800" cy="550" rx="140" ry="60" fill="#5F9EA0" />
        <ellipse cx="780" cy="530" rx="120" ry="50" fill="#87CEEB" />

        {/* Water ripples */}
        <path d="M 700 520 Q 750 500 850 530" fill="none" stroke="#E0FFFF" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <path d="M 750 560 Q 820 580 900 550" fill="none" stroke="#E0FFFF" strokeWidth="4" strokeLinecap="round" opacity="0.4" />

        {/* Terrain details */}
        <ellipse cx="250" cy="250" rx="12" ry="6" fill="#A9A9A9" />
        <ellipse cx="270" cy="260" rx="8" ry="4" fill="#808080" />

        <ellipse cx="450" cy="650" rx="15" ry="7" fill="#A9A9A9" />
        <ellipse cx="430" cy="660" rx="10" ry="5" fill="#808080" />

        {/* Grass tufts around pond */}
        <path d="M 640 540 Q 630 510 650 500 Q 645 520 640 540" fill="#316F3C" />
        <path d="M 655 550 Q 645 520 665 510 Q 660 530 655 550" fill="#3D8249" />
        <path d="M 940 520 Q 960 490 945 480 Q 950 500 940 520" fill="#316F3C" />
      </svg>
    </div>
  );
}
