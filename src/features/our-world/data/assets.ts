// ============================================================
// Nuestro Mundo — Asset Registry
// ============================================================
// Centralized manifest for all visual assets. Decouples logic
// from presentation. Supports SVG, WebP, PNG, etc.
// ============================================================

import { optimizedArtwork } from './optimized-artwork';

export type AssetSourceType = 'svg' | 'img';

export interface AssetShadow {
  type: 'ellipse';
  rx: number; // in World Units
  ry: number; // in World Units
  color: string;
  offsetY: number; // in World Units relative to anchor
}

export interface AssetDef {
  id: string;
  sourceType: AssetSourceType;
  /** URL for 'img' or component key for 'svg' */
  source: string;
  originalSource?: string;
  thumbnail?: string;

  /** Base width in World Units (WU) */
  width: number;
  /** Base height in World Units (WU) */
  height: number;

  /** Anchor X point (0 to 1). 0.5 = center */
  anchorX: number;
  /** Anchor Y point (0 to 1). 1.0 = bottom (feet/base) */
  anchorY: number;

  /** CSS animation profile (e.g., 'tree_sway_soft', 'flower_bob') */
  animationProfile?: string;

  /** Specific shadow configuration */
  shadow?: AssetShadow;

  /** Custom Z-index offset if this object needs to render slightly behind/in front of others at same Y */
  zOffset?: number;
  /** Light positions within the sprite, with radii in world units. */
  lights?: Array<{ x: number; y: number; radius: number; core: number; color?: string;
    /** Local spill onto the ground: world-unit radius/depth, brightness and forward offset. */
    ground?: { radius: number; depth: number; intensity: number; offsetY?: number } }>;
  fireflies?: Array<{ x: number; y: number }>;
}

// ------------------------------------------------------------
// ASSET MANIFEST
// ------------------------------------------------------------
// World Scale Concept:
// The world is e.g. 2000x2000 WU.
// A house might be 400 WU wide. A rabbit 60 WU wide.
// All positions are scaled to these units.

export const ASSET_REGISTRY: Record<string, AssetDef> = {
  // --- TREES ---
  'oak_tree': {
    id: 'oak_tree_asset',
    sourceType: 'img',
    source: '/assets/world/oak-v3.png',
    width: 380,
    height: 570,
    anchorX: 0.5,
    anchorY: 0.95,
    animationProfile: 'tree_sway_soft',
    shadow: { type: 'ellipse', rx: 80, ry: 12, color: 'rgba(24,45,20,0.22)', offsetY: 0 }
  },
  'pine_tree': {
    id: 'pine_tree_asset',
    sourceType: 'img',
    source: '/assets/world/pine-tree-v1.png',
    width: 300,
    height: 450,
    anchorX: 0.5,
    anchorY: 0.95,
    animationProfile: 'tree_sway_soft',
    shadow: { type: 'ellipse', rx: 60, ry: 15, color: 'rgba(0,0,0,0.25)', offsetY: 0 }
  },
  'birch_tree': {
    id: 'birch_tree_asset',
    sourceType: 'img',
    source: '/assets/world/birch-tree-v1.png',
    width: 310,
    height: 465,
    anchorX: 0.5,
    anchorY: 0.95,
    animationProfile: 'tree_sway_soft',
    shadow: { type: 'ellipse', rx: 60, ry: 15, color: 'rgba(0,0,0,0.25)', offsetY: 0 }
  },
  'willow_tree': {
    id: 'willow_tree_asset',
    sourceType: 'img',
    source: '/assets/world/sauce.png',
    width: 350,
    height: 350,
    anchorX: 0.5,
    anchorY: 0.95,
    animationProfile: 'tree_sway_soft',
    shadow: { type: 'ellipse', rx: 80, ry: 20, color: 'rgba(0,0,0,0.4)', offsetY: 0 }
  },

  // --- BUILDINGS & STRUCTURES ---
  'treehouse': {
    id: 'treehouse_asset',
    sourceType: 'img',
    source: '/assets/world/treehouse-v2.png',
    width: 566,
    height: 809,
    anchorX: 0.5,
    anchorY: 0.97,
    shadow: { type: 'ellipse', rx: 110, ry: 18, color: 'rgba(24,45,20,0.22)', offsetY: 0 },
    zOffset: -10,
    lights: [
      { x: 0.616, y: 0.425, radius: 80, core: 22, ground: { radius: 100, depth: 75, intensity: .20, offsetY: 18 } },
      { x: 0.44, y: 0.505, radius: 90, core: 25, ground: { radius: 115, depth: 85, intensity: .24, offsetY: 20 } },
      { x: 0.234, y: 0.388, radius: 85, core: 20, ground: { radius: 95, depth: 70, intensity: .18, offsetY: 15 } },
    ]
  },
  'fountain': {
    id: 'fountain_asset',
    sourceType: 'img',
    source: '/assets/world/fountain-v2.png',
    width: 265,
    height: 156,
    anchorX: 0.5,
    anchorY: 0.9,
    shadow: { type: 'ellipse', rx: 70, ry: 10, color: 'rgba(24,45,20,0.2)', offsetY: 0 }
  },
  'garden_arch': {
    id: 'garden_arch_asset',
    sourceType: 'img',
    source: '/assets/world/garden-arch-v1.png',
    width: 300,
    height: 353,
    anchorX: 0.5,
    anchorY: 0.95,
    shadow: { type: 'ellipse', rx: 140, ry: 20, color: 'rgba(0,0,0,0.2)', offsetY: 0 }
  },

  // --- DECORATIONS ---
  'wooden_bench': {
    id: 'wooden_bench_asset',
    sourceType: 'img',
    source: '/assets/world/wooden-bench-v1.png',
    width: 220,
    height: 138,
    anchorX: 0.5,
    anchorY: 0.9,
    shadow: { type: 'ellipse', rx: 80, ry: 20, color: 'rgba(0,0,0,0.25)', offsetY: 0 }
  },
  'lantern': {
    id: 'lantern_asset',
    sourceType: 'img',
    source: '/assets/world/lantern-v2.png',
    width: 152,
    height: 270,
    anchorX: 0.4,
    anchorY: 0.94,
    animationProfile: 'lantern_glow',
    shadow: { type: 'ellipse', rx: 40, ry: 15, color: 'rgba(0,0,0,0.35)', offsetY: 0 },
    lights: [{ x: 0.725, y: 0.35, radius: 100, core: 20, ground: { radius: 145, depth: 105, intensity: .52, offsetY: 12 } }]
  },
  'stone_small': {
    id: 'stone_small_asset',
    sourceType: 'img',
    source: '/assets/world/stone-small-v1.png',
    width: 75,
    height: 47,
    anchorX: 0.5,
    anchorY: 0.9,
    shadow: { type: 'ellipse', rx: 25, ry: 8, color: 'rgba(0,0,0,0.2)', offsetY: 0 },
    zOffset: -2
  },

  // --- FLOWERS & PLANTS ---
  'bush': {
    id: 'bush_asset',
    sourceType: 'img',
    source: '/assets/world/bush-v1.png',
    width: 170,
    height: 126,
    anchorX: 0.5,
    anchorY: 0.9,
    animationProfile: 'sway',
    shadow: { type: 'ellipse', rx: 60, ry: 15, color: 'rgba(0,0,0,0.2)', offsetY: 0 },
    zOffset: -2
  },
  'basic_flower': {
    id: 'basic_flower_asset',
    sourceType: 'img',
    source: '/assets/world/basic-flower-v1.png',
    width: 70,
    height: 84,
    anchorX: 0.5,
    anchorY: 0.95,
    animationProfile: 'flower_bob',
    shadow: { type: 'ellipse', rx: 15, ry: 5, color: 'rgba(0,0,0,0.2)', offsetY: 0 }
  },
  'daisy': {
    id: 'daisy_asset',
    sourceType: 'img',
    source: '/assets/world/daisy-v1.png',
    width: 70,
    height: 69,
    anchorX: 0.5,
    anchorY: 0.95,
    animationProfile: 'flower_bob',
    shadow: { type: 'ellipse', rx: 12, ry: 4, color: 'rgba(0,0,0,0.2)', offsetY: 0 }
  },
  'rare_orchid': {
    id: 'rare_orchid_asset',
    sourceType: 'img',
    source: '/assets/world/rare-orchid-v1.png',
    width: 85,
    height: 92,
    anchorX: 0.5,
    anchorY: 0.95,
    animationProfile: 'flower_bob',
    shadow: { type: 'ellipse', rx: 18, ry: 6, color: 'rgba(0,0,0,0.25)', offsetY: 0 }
  },

  'wild_grass': {
    id: 'wild_grass_asset', sourceType: 'img', source: '/assets/world/wild-grass-v1.png',
    width: 85, height: 74, anchorX: .5, anchorY: .94, animationProfile: 'sway',
  },
  'fern': {
    id: 'fern_asset', sourceType: 'img', source: '/assets/world/fern-v1.png',
    width: 140, height: 117, anchorX: .5, anchorY: .94, animationProfile: 'sway',
  },
  'tulip': {
    id: 'tulip_asset', sourceType: 'img', source: '/assets/world/tulip-v1.png',
    width: 75, height: 69, anchorX: .5, anchorY: .94, animationProfile: 'flower_bob',
  },
  'sunflower': {
    id: 'sunflower_asset', sourceType: 'img', source: '/assets/world/sunflower-v1.png',
    width: 80, height: 120, anchorX: .5, anchorY: .94, animationProfile: 'flower_bob',
  },
  'rose': {
    id: 'rose_asset', sourceType: 'img', source: '/assets/world/rose-v1.png',
    width: 100, height: 125, anchorX: .5, anchorY: .94, animationProfile: 'flower_bob',
  },
  'mushroom_red': {
    id: 'mushroom_red_asset', sourceType: 'img', source: '/assets/world/mushroom-red-v1.png',
    width: 70, height: 70, anchorX: .5, anchorY: .94,
  },
  'firefly_bush': {
    id: 'firefly_bush_asset', sourceType: 'img', source: '/assets/world/firefly-bush-v1.png',
    width: 210, height: 150, anchorX: 0.5, anchorY: 0.92,
    fireflies: [{ x: .2, y: .35 }, { x: .48, y: .15 }, { x: .78, y: .4 }, { x: .34, y: .55 }, { x: .66, y: .65 }, { x: .85, y: .72 }],
  },
  'flower_bed': {
    id: 'flower_bed_asset', sourceType: 'img', source: '/assets/world/flower-bed-v1.png',
    width: 230, height: 128, anchorX: .5, anchorY: .9,
  },
  'glowing_mushrooms': {
    id: 'glowing_mushrooms_asset', sourceType: 'img', source: '/assets/world/glowing-mushrooms-v1.png',
    width: 100, height: 140, anchorX: .5, anchorY: .87,
    lights: [{ x: .52, y: .29, radius: 40, core: 22, color: 'cyan', ground: { radius: 45, depth: 22, intensity: .24 } }, { x: .25, y: .54, radius: 26, core: 12, color: 'cyan', ground: { radius: 30, depth: 18, intensity: .18 } }, { x: .76, y: .62, radius: 24, core: 11, color: 'cyan', ground: { radius: 28, depth: 16, intensity: .16 } }],
  },
  'picnic_table': {
    id: 'picnic_table_asset', sourceType: 'img', source: '/assets/world/picnic-table-v1.png',
    width: 225, height: 150, anchorX: .5, anchorY: .93,
  },
  'pond_bridge': {
    id: 'pond_bridge_asset', sourceType: 'img', source: '/assets/world/pond-bridge-v1.png',
    width: 360, height: 212, anchorX: .5, anchorY: .9,
  },
  'wishing_well': {
    id: 'wishing_well_asset', sourceType: 'img', source: '/assets/world/wishing-well-v1.png',
    width: 210, height: 248, anchorX: .5, anchorY: .94,
    lights: [{ x: .86, y: .455, radius: 65, core: 16, ground: { radius: 85, depth: 60, intensity: .34, offsetY: 8 } }],
  },
  'garden_swing': {
    id: 'garden_swing_asset', sourceType: 'img', source: '/assets/world/garden-swing-v1.png',
    width: 280, height: 303, anchorX: .5, anchorY: .94,
  },
  // Forest chapter: isolated illustrated objects and visitors.
  'wooden_fence': {"id":"wooden_fence_asset","sourceType":"img","source":"/assets/world/wooden-fence-v1.png","width":220,"height":138,"anchorX":0.5,"anchorY":0.95},
  'stepping_stones': {"id":"stepping_stones_asset","sourceType":"img","source":"/assets/world/stepping-stones-v1.png","width":210,"height":131,"anchorX":0.5,"anchorY":0.95},
  'birdhouse': {"id":"birdhouse_asset","sourceType":"img","source":"/assets/world/birdhouse-v1.png","width":130,"height":195,"anchorX":0.5,"anchorY":0.95},
  'birdbath': {"id":"birdbath_asset","sourceType":"img","source":"/assets/world/birdbath-v1.png","width":155,"height":129,"anchorX":0.5,"anchorY":0.95},
  'campfire': {"id":"campfire_asset","sourceType":"img","source":"/assets/world/campfire-v1.png","width":150,"height":94,"anchorX":0.5,"anchorY":0.95,"lights":[{"x":0.5,"y":0.43,"radius":65,"core":22,"ground":{"radius":120,"depth":65,"intensity":0.58,"offsetY":4}}]},
  'log_planter': {"id":"log_planter_asset","sourceType":"img","source":"/assets/world/log-planter-v1.png","width":225,"height":141,"anchorX":0.5,"anchorY":0.95},
  'forest_sign': {"id":"forest_sign_asset","sourceType":"img","source":"/assets/world/forest-sign-v1.png","width":140,"height":138,"anchorX":0.5,"anchorY":0.95},
  'forest_heart': {"id":"forest_heart_asset","sourceType":"img","source":"/assets/world/forest-heart-v1.png","width":300,"height":249,"anchorX":0.5,"anchorY":0.95,"lights":[{"x":0.5,"y":0.31,"radius":70,"core":16,"ground":{"radius":80,"depth":50,"intensity":0.28,"offsetY":6}}]},
  'squirrel': {"id":"squirrel_asset","sourceType":"img","source":"/assets/world/squirrel-v1.png","width":75,"height":64,"anchorX":0.5,"anchorY":0.95},
  'fox': {"id":"fox_asset","sourceType":"img","source":"/assets/world/fox-v1.png","width":115,"height":77,"anchorX":0.5,"anchorY":0.95},
  'owl': {"id":"owl_asset","sourceType":"img","source":"/assets/world/owl-v1.png","width":65,"height":56,"anchorX":0.5,"anchorY":0.95},
  // --- CREATURES ---
  'rabbit': {
    id: 'rabbit_asset',
    sourceType: 'img',
    source: '/assets/world/conejo.png',
    width: 80,
    height: 80,
    anchorX: 0.5,
    anchorY: 0.85,
    animationProfile: 'creature_hop',
    shadow: { type: 'ellipse', rx: 25, ry: 8, color: 'rgba(0,0,0,0.2)', offsetY: 0 }
  },
  'bird': {"id":"bird_asset","sourceType":"img","source":"/assets/world/bird-v1.png","width":50,"height":33,"anchorX":0.5,"anchorY":0.95},
  'butterfly': {"id":"butterfly_asset","sourceType":"img","source":"/assets/world/butterfly-v1.png","width":45,"height":28,"anchorX":0.5,"anchorY":0.5,"animationProfile":"butterfly_flight","zOffset":100},

  'deer': {"id":"deer_asset","sourceType":"img","source":"/assets/world/deer-v1.png","width":130,"height":98,"anchorX":0.5,"anchorY":0.95},
  // Personal companions, based on Max and Abi's photographs.
  'max': { id: 'max_asset', sourceType: 'img', source: '/assets/world/max-v1.png', width: 140, height: 140, anchorX: 0.5, anchorY: 0.95 },
  'abi': { id: 'abi_asset', sourceType: 'img', source: '/assets/world/abi-v1.png', width: 84, height: 84, anchorX: 0.5, anchorY: 0.95 },
  // Fallback
  'default': {
    id: 'default_asset',
    sourceType: 'svg',
    source: 'default',
    width: 100,
    height: 100,
    anchorX: 0.5,
    anchorY: 0.5,
  }
};

for (const asset of Object.values(ASSET_REGISTRY)) {
  const delivery = optimizedArtwork[asset.source];
  if (delivery) {
    asset.originalSource = asset.source;
    asset.source = delivery.source;
    asset.thumbnail = delivery.thumbnail;
  }
}

export function getAssetDef(renderKey: string): AssetDef {
  return ASSET_REGISTRY[renderKey] || ASSET_REGISTRY['default'];
}
