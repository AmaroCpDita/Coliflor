// ============================================================
// Nuestro Mundo — Beautiful SVG Renderers
// ============================================================
// Scalable, cozy 2.5D SVGs with soft shading and drop shadows.
// ============================================================

import React from 'react';

export interface RendererProps extends React.SVGProps<SVGSVGElement> {}

// --- Shared Elements ---
const DropShadow = () => (
  <ellipse cx="50" cy="92" rx="30" ry="8" fill="rgba(0,0,0,0.25)" />
);
const SmallDropShadow = () => (
  <ellipse cx="50" cy="92" rx="15" ry="5" fill="rgba(0,0,0,0.25)" />
);

// ============================================================
// TREES
// ============================================================
export const OakTreeRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <DropShadow />
    {/* Trunk */}
    <path d="M45 90 C 45 70, 42 60, 48 40 L 52 40 C 58 60, 55 70, 55 90 Z" fill="#704A33" />
    <path d="M48 90 C 48 70, 45 60, 50 40 L 52 40 C 58 60, 55 70, 55 90 Z" fill="#5A3A27" /> {/* Shading */}
    {/* Canopy Layers */}
    <g className="crown">
      <circle cx="35" cy="45" r="20" fill="#3D8249" />
      <circle cx="65" cy="45" r="20" fill="#316F3C" />
      <circle cx="50" cy="25" r="22" fill="#4B9C59" />
      <circle cx="45" cy="35" r="25" fill="#58B268" />
      {/* Highlights */}
      <circle cx="42" cy="28" r="10" fill="#75C783" opacity="0.6" />
      <circle cx="32" cy="40" r="8" fill="#75C783" opacity="0.6" />
    </g>
  </svg>
);

export const PineTreeRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <DropShadow />
    {/* Trunk */}
    <rect x="45" y="70" width="10" height="25" fill="#5C4033" />
    <rect x="50" y="70" width="5" height="25" fill="#4A332A" />
    {/* Leaves */}
    <g className="crown">
      <polygon points="50,10 20,50 80,50" fill="#2E6B4E" />
      <polygon points="50,10 50,50 80,50" fill="#24553D" />
      <polygon points="50,30 15,75 85,75" fill="#24553D" />
      <polygon points="50,30 50,75 85,75" fill="#1C422F" />
      {/* Snow/Highlight */}
      <polygon points="50,10 40,30 50,25" fill="#428C69" />
    </g>
  </svg>
);

export const BirchTreeRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <SmallDropShadow />
    {/* Trunk */}
    <rect x="46" y="30" width="8" height="65" fill="#EAEAEA" />
    <rect x="50" y="30" width="4" height="65" fill="#D3D3D3" />
    {/* Birch stripes */}
    <line x1="46" y1="50" x2="52" y2="52" stroke="#4A4A4A" strokeWidth="1.5" />
    <line x1="48" y1="65" x2="54" y2="63" stroke="#4A4A4A" strokeWidth="1.5" />
    <line x1="46" y1="80" x2="50" y2="82" stroke="#4A4A4A" strokeWidth="1.5" />
    {/* Canopy */}
    <g className="crown">
      <ellipse cx="50" cy="35" rx="25" ry="30" fill="#D4AF37" />
      <ellipse cx="55" cy="35" rx="15" ry="25" fill="#B89420" />
      <ellipse cx="45" cy="25" rx="10" ry="12" fill="#F0CD51" opacity="0.8" />
    </g>
  </svg>
);

// ============================================================
// FLOWERS & PLANTS
// ============================================================
export const FlowerRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <ellipse cx="50" cy="95" rx="10" ry="3" fill="rgba(0,0,0,0.2)" />
    <path d="M50 95 Q 55 60 50 40" fill="none" stroke="#68A063" strokeWidth="4" />
    <path d="M50 70 Q 40 60 35 65" fill="none" stroke="#68A063" strokeWidth="3" />
    <path d="M50 80 Q 60 70 65 75" fill="none" stroke="#68A063" strokeWidth="3" />
    {/* Petals */}
    <g className="flower-head">
      <circle cx="50" cy="30" r="15" fill="#FF7EB3" />
      <circle cx="35" cy="45" r="15" fill="#FF7EB3" />
      <circle cx="65" cy="45" r="15" fill="#FF7EB3" />
      <circle cx="40" cy="55" r="15" fill="#FF7EB3" />
      <circle cx="60" cy="55" r="15" fill="#FF7EB3" />
      <circle cx="50" cy="45" r="10" fill="#FFD700" />
    </g>
  </svg>
);

export const DaisyRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <ellipse cx="50" cy="95" rx="8" ry="2" fill="rgba(0,0,0,0.2)" />
    <path d="M50 95 Q 45 70 50 50" fill="none" stroke="#8FBC8F" strokeWidth="3" />
    <g className="flower-head" transform="translate(50, 45)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
        <ellipse key={deg} cx="0" cy="-12" rx="4" ry="12" fill="#FFFFFF" transform={`rotate(${deg})`} />
      ))}
      <circle cx="0" cy="0" r="6" fill="#FFA500" />
    </g>
  </svg>
);

export const RareOrchidRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <ellipse cx="50" cy="95" rx="12" ry="4" fill="rgba(0,0,0,0.3)" />
    <path d="M50 95 Q 60 60 45 35" fill="none" stroke="#3CB371" strokeWidth="3" />
    <g className="flower-head">
      <path d="M45 35 Q 20 20 40 10 Q 55 25 45 35" fill="#9370DB" />
      <path d="M45 35 Q 70 20 50 10 Q 35 25 45 35" fill="#8A2BE2" />
      <path d="M45 35 Q 30 60 55 50 Q 50 35 45 35" fill="#9932CC" />
      <circle cx="45" cy="30" r="4" fill="#00FFFF" />
      <circle cx="45" cy="30" r="1.5" fill="#FFF" />
    </g>
  </svg>
);

// ============================================================
// DECORATIONS & BUILDINGS
// ============================================================
export const TreehouseRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <DropShadow />
    {/* Giant Trunk */}
    <path d="M30 90 Q 35 50 25 10 L 75 10 Q 65 50 70 90 Z" fill="#6B442A" />
    <path d="M50 90 Q 55 50 50 10 L 75 10 Q 65 50 70 90 Z" fill="#52321D" />

    {/* Base Platform */}
    <rect x="15" y="55" width="70" height="8" rx="2" fill="#8B5A2B" />
    <rect x="15" y="60" width="70" height="3" fill="#633F1D" />

    {/* House */}
    <rect x="25" y="25" width="50" height="30" fill="#DEB887" />
    <rect x="50" y="25" width="25" height="30" fill="#C09F70" />

    {/* Roof */}
    <polygon points="15,25 50,5 85,25" fill="#A0522D" />
    <polygon points="50,5 50,25 85,25" fill="#803D20" />

    {/* Door */}
    <rect x="40" y="38" width="12" height="17" rx="3" fill="#5C3A21" />
    <circle cx="49" cy="48" r="1.5" fill="#FFD700" />

    {/* Window */}
    <rect x="60" y="35" width="10" height="10" fill="#87CEEB" />
    <rect x="60" y="35" width="10" height="10" fill="none" stroke="#5C3A21" strokeWidth="2" />
    <line x1="65" y1="35" x2="65" y2="45" stroke="#5C3A21" strokeWidth="2" />
    <line x1="60" y1="40" x2="70" y2="40" stroke="#5C3A21" strokeWidth="2" />

    {/* Ladder */}
    <rect x="25" y="63" width="2" height="27" fill="#8B5A2B" />
    <rect x="35" y="63" width="2" height="27" fill="#8B5A2B" />
    <line x1="25" y1="70" x2="35" y2="70" stroke="#8B5A2B" strokeWidth="2" />
    <line x1="25" y1="77" x2="35" y2="77" stroke="#8B5A2B" strokeWidth="2" />
    <line x1="25" y1="84" x2="35" y2="84" stroke="#8B5A2B" strokeWidth="2" />

    {/* Leaves overlay */}
    <g className="crown">
      <circle cx="20" cy="15" r="15" fill="#3D8249" />
      <circle cx="80" cy="15" r="18" fill="#316F3C" />
      <circle cx="35" cy="5" r="15" fill="#4B9C59" />
      <circle cx="65" cy="5" r="15" fill="#58B268" />
    </g>
  </svg>
);

export const FountainRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <DropShadow />
    {/* Base Basin */}
    <ellipse cx="50" cy="85" rx="35" ry="10" fill="#A9A9A9" />
    <ellipse cx="50" cy="82" rx="33" ry="8" fill="#4682B4" /> {/* Water */}
    <path d="M 15 85 Q 50 95 85 85 L 85 90 Q 50 100 15 90 Z" fill="#808080" />

    {/* Pillar */}
    <rect x="42" y="45" width="16" height="40" fill="#C0C0C0" />
    <rect x="50" y="45" width="8" height="40" fill="#A9A9A9" />

    {/* Top Basin */}
    <ellipse cx="50" cy="45" rx="20" ry="6" fill="#A9A9A9" />
    <ellipse cx="50" cy="43" rx="18" ry="4" fill="#4682B4" /> {/* Water */}
    <path d="M 30 45 Q 50 52 70 45 L 70 48 Q 50 55 30 48 Z" fill="#808080" />

    {/* Spout & Water Animation */}
    <path d="M 46 25 L 54 25 L 52 43 L 48 43 Z" fill="#C0C0C0" />
    <g className="water-spout">
      <path d="M 50 25 Q 35 15 35 43" fill="none" stroke="#87CEFA" strokeWidth="2" strokeDasharray="4 2" />
      <path d="M 50 25 Q 65 15 65 43" fill="none" stroke="#87CEFA" strokeWidth="2" strokeDasharray="4 2" />
      <path d="M 50 25 Q 50 15 50 43" fill="none" stroke="#E0FFFF" strokeWidth="3" strokeDasharray="6 3" />
    </g>
  </svg>
);

export const LanternRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <SmallDropShadow />
    {/* Post */}
    <rect x="46" y="20" width="8" height="75" fill="#3D3D3D" />
    <rect x="50" y="20" width="4" height="75" fill="#2B2B2B" />

    {/* Lamp Housing */}
    <polygon points="35,20 65,20 55,5 45,5" fill="#1A1A1A" />
    <rect x="35" y="20" width="30" height="25" fill="#4A4A4A" />
    <polygon points="35,45 65,45 55,55 45,55" fill="#1A1A1A" />

    {/* Glass / Glow */}
    <rect x="40" y="23" width="20" height="19" fill="#FFFACD" />
    <circle cx="50" cy="32" r="6" fill="#FFD700" className="lantern-glow" />
    <circle cx="50" cy="32" r="15" fill="#FFD700" opacity="0.3" className="lantern-glow-large" />
  </svg>
);

// ============================================================
// ANIMALS
// ============================================================
export const RabbitRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <SmallDropShadow />
    {/* Body */}
    <ellipse cx="50" cy="70" rx="20" ry="15" fill="#FFFFFF" />
    <ellipse cx="50" cy="75" rx="20" ry="10" fill="#E6E6E6" /> {/* Belly shadow */}

    {/* Head */}
    <circle cx="35" cy="60" r="12" fill="#FFFFFF" />
    <circle cx="35" cy="65" r="12" fill="#E6E6E6" /> {/* Head shadow */}

    {/* Ears */}
    <ellipse cx="28" cy="40" rx="4" ry="15" fill="#FFFFFF" transform="rotate(-15 28 40)" />
    <ellipse cx="28" cy="40" rx="2" ry="10" fill="#FFC0CB" transform="rotate(-15 28 40)" />
    <ellipse cx="40" cy="38" rx="4" ry="15" fill="#FFFFFF" transform="rotate(15 40 38)" />
    <ellipse cx="40" cy="38" rx="2" ry="10" fill="#FFC0CB" transform="rotate(15 40 38)" />

    {/* Eye & Nose */}
    <circle cx="30" cy="58" r="2" fill="#000" />
    <circle cx="25" cy="62" r="1.5" fill="#FFC0CB" />

    {/* Tail */}
    <circle cx="70" cy="65" r="6" fill="#FFFFFF" />
  </svg>
);

export const BirdRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <SmallDropShadow />
    {/* Legs */}
    <line x1="45" y1="75" x2="45" y2="90" stroke="#FFA500" strokeWidth="2" />
    <line x1="55" y1="75" x2="55" y2="90" stroke="#FFA500" strokeWidth="2" />
    <line x1="45" y1="90" x2="40" y2="92" stroke="#FFA500" strokeWidth="2" />
    <line x1="55" y1="90" x2="60" y2="92" stroke="#FFA500" strokeWidth="2" />

    {/* Body */}
    <ellipse cx="50" cy="60" rx="15" ry="12" fill="#87CEEB" />
    <ellipse cx="50" cy="64" rx="15" ry="8" fill="#5F9EA0" />

    {/* Wing */}
    <path d="M 45 55 Q 30 65 40 70 Q 60 70 55 55 Z" fill="#4682B4" />

    {/* Head */}
    <circle cx="60" cy="50" r="10" fill="#87CEEB" />
    <circle cx="62" cy="48" r="1.5" fill="#000" />

    {/* Beak */}
    <polygon points="68,48 78,51 68,54" fill="#FFA500" />

    {/* Tail */}
    <polygon points="35,60 15,55 20,65" fill="#4682B4" />
  </svg>
);

export const ButterflyRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g className="butterfly-anim">
      {/* Body */}
      <ellipse cx="50" cy="50" rx="2" ry="15" fill="#333" />

      {/* Wings Left */}
      <g className="wing-left" transform="origin 50 50">
        <path d="M 48 45 Q 10 10 20 45 Q 10 70 48 55 Z" fill="#FF69B4" opacity="0.9" />
        <path d="M 46 45 Q 20 25 25 45 Q 20 60 46 52 Z" fill="#FF1493" />
      </g>

      {/* Wings Right */}
      <g className="wing-right" transform="origin 50 50">
        <path d="M 52 45 Q 90 10 80 45 Q 90 70 52 55 Z" fill="#FF69B4" opacity="0.9" />
        <path d="M 54 45 Q 80 25 75 45 Q 80 60 54 52 Z" fill="#FF1493" />
      </g>

      {/* Antennae */}
      <path d="M 50 35 Q 45 25 40 25" fill="none" stroke="#333" strokeWidth="1" />
      <path d="M 50 35 Q 55 25 60 25" fill="none" stroke="#333" strokeWidth="1" />
    </g>
  </svg>
);

// ============================================================
// REGISTRY
// ============================================================
const renderers: Record<string, React.FC<RendererProps>> = {
  'oak_tree': OakTreeRenderer,
  'pine_tree': PineTreeRenderer,
  'birch_tree': BirchTreeRenderer,
  'basic_flower': FlowerRenderer,
  'daisy': DaisyRenderer,
  'rare_orchid': RareOrchidRenderer,
  'treehouse': TreehouseRenderer,
  'fountain': FountainRenderer,
  'lantern': LanternRenderer,
  'rabbit': RabbitRenderer,
  'bird': BirdRenderer,
  'butterfly': ButterflyRenderer,
  // Add simple fallbacks for missing ones
  'bush': (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <DropShadow />
      <circle cx="50" cy="55" r="35" fill="#4ade80" />
      <circle cx="35" cy="45" r="25" fill="#22c55e" />
      <circle cx="65" cy="65" r="20" fill="#16a34a" />
      <circle cx="65" cy="40" r="15" fill="#22c55e" />
    </svg>
  ),
  'stone_small': (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <DropShadow />
      <path d="M 20 80 Q 20 50 50 50 Q 80 50 80 80 Q 80 95 50 95 Q 20 95 20 80 Z" fill="#A9A9A9" />
      <path d="M 20 80 Q 20 60 50 60 Q 80 60 80 80 Q 80 95 50 95 Q 20 95 20 80 Z" fill="#808080" />
    </svg>
  ),
  'stone_bench': (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <DropShadow />
      <rect x="20" y="60" width="10" height="30" fill="#808080" />
      <rect x="70" y="60" width="10" height="30" fill="#808080" />
      <rect x="15" y="50" width="70" height="15" rx="3" fill="#A9A9A9" />
      <rect x="15" y="50" width="70" height="5" rx="3" fill="#D3D3D3" />
    </svg>
  ),
  'garden_arch': (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ellipse cx="25" cy="92" rx="10" ry="4" fill="rgba(0,0,0,0.25)" />
      <ellipse cx="75" cy="92" rx="10" ry="4" fill="rgba(0,0,0,0.25)" />
      <path d="M 25 90 L 25 40 Q 50 10 75 40 L 75 90" fill="none" stroke="#F5DEB3" strokeWidth="8" />
      <path d="M 25 90 L 25 40 Q 50 10 75 40 L 75 90" fill="none" stroke="#DEB887" strokeWidth="4" />
      {/* Vines */}
      <path d="M 20 80 Q 35 60 20 40 Q 30 20 50 15 Q 70 20 80 40 Q 65 60 80 80" fill="none" stroke="#228B22" strokeWidth="4" strokeDasharray="5 5" />
    </svg>
  ),
};

export const FallbackRenderer = (props: RendererProps) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="40" fill="pink" />
    <text x="50" y="55" fontSize="20" textAnchor="middle" fill="#fff">?</text>
  </svg>
);

export function getRenderer(key: string): React.FC<RendererProps> | undefined {
  return renderers[key];
}
