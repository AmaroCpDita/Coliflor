// ============================================================
// Nuestro Mundo — Type Definitions
// ============================================================

// --- Time of Day ---
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

// --- Rarity ---
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// --- Object Categories ---
export type WorldItemType =
  | 'seed'
  | 'plant'
  | 'tree'
  | 'flower'
  | 'decoration'
  | 'rock'
  | 'building'
  | 'special'
  | 'material';
export type CreatureType =
  'rabbit' | 'bird' | 'butterfly' | 'fox' | 'deer' | 'owl' | 'firefly_swarm' | 'squirrel' | 'cat';

// --- Creature States ---
export type CreatureState =
  | 'idle'
  | 'walking'
  | 'running'
  | 'sleeping'
  | 'looking'
  | 'eating'
  | 'hiding'
  | 'appearing'
  | 'disappearing';

// --- Particle Types ---
export type ParticleType =
  | 'firefly'
  | 'leaf'
  | 'petal'
  | 'dust'
  | 'rain'
  | 'snow'
  | 'spark'
  | 'bubble'
  | 'smoke'
  | 'magic'
  | 'star';

// --- World State (from DB) ---
export interface WorldState {
  id: string;
  couple_id: string;
  level: number;
  xp: number;
  progression_version?: number;
  onboarding_epoch?: string | null;
  calendar_xp_started_on?: string;
  forest_completed_at?: string | null;
  energy: number;
  max_energy: number;
  current_biome: string;
  unlocked_biomes: string[];
  last_daily_date: string | null;
  created_at: string;
  updated_at: string;
}

// --- Inventory Item (from DB) ---
export interface InventoryItem {
  id: string;
  couple_id: string;
  item_type: WorldItemType;
  item_id: string;
  quantity: number;
  acquired_at: string;
}

// --- Placed Object (from DB) ---
export interface PlacedObject {
  id: string;
  couple_id: string;
  biome_id: string;
  item_type: string;
  item_id: string;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
  state: Record<string, unknown>;
  placed_by: string;
  placed_at: string;
}

export interface WorldActionResult {
  success: boolean;
  error?: string;
  object_id?: string;
}

// --- Achievement (from DB) ---
export interface WorldAchievement {
  id: string;
  couple_id: string;
  achievement_id: string;
  unlocked_by: string;
  unlocked_at: string;
}

// --- Activity Log (from DB) ---
export interface WorldActivityLog {
  id: string;
  couple_id: string;
  activity_type: string;
  activity_key: string;
  xp_granted: number;
  items_granted: unknown[];
  granted_by: string;
  created_at: string;
}

// --- Data-Driven Definitions ---

export interface WorldObjectDef {
  id: string;
  type: WorldItemType;
  name: string;
  description: string;
  emoji: string;
  rarity: Rarity;
  category: string;
  requiredLevel: number;
  /** SVG placeholder render function key */
  renderKey: string;
  /** Width/height in world units (% of viewport) */
  width: number;
  height: number;
  /** Animation config */
  animation?: ObjectAnimationConfig;
  /** Interaction config */
  interaction?: InteractionConfig;
  /** Can this be placed by users? */
  placeable: boolean;
  unlockCondition?: 'forest_completion';
  /** Is this a starter/default object? */
  isDefault?: boolean;
  /** Biome-specific */
  biomes?: string[];
}

export interface ObjectAnimationConfig {
  type: 'sway' | 'bob' | 'pulse' | 'grow' | 'spin' | 'none';
  /** Duration range [min, max] in seconds */
  duration: [number, number];
  /** Intensity 0-1 */
  intensity: number;
  /** Whether animation varies per instance */
  randomize: boolean;
}

export interface InteractionConfig {
  type: 'tap' | 'hold' | 'drag';
  effect: 'particles' | 'bounce' | 'glow' | 'shake' | 'grow' | 'info';
  particleType?: ParticleType;
  particleCount?: number;
  /** XP reward on first interaction per day */
  dailyXP?: number;
  message?: string;
}

// --- Creature Definition ---
export interface CreatureDef {
  id: string;
  type: CreatureType;
  name: string;
  emoji: string;
  rarity: Rarity;
  requiredLevel: number;
  renderKey: string;
  width: number;
  height: number;
  /** When this creature is active */
  activeTime: TimeOfDay[];
  /** Movement speed (% per second) */
  speed: number;
  /** Behavior weights */
  behaviors: Record<CreatureState, number>;
  /** Biomes where this creature appears */
  biomes: string[];
}

// --- Biome Definition ---
export interface BiomeDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requiredLevel: number;
  /** Sky gradient stops per time of day */
  skyGradients: Record<TimeOfDay, string[]>;
  /** Ground color/gradient */
  groundColor: string;
  /** Ground gradient for depth */
  groundGradient: string;
  /** Default objects spawned in this biome */
  defaultObjects: string[];
  /** Available creatures */
  creatures: string[];
  /** Particle configs per time of day */
  particles: Record<TimeOfDay, ParticleConfig[]>;
  /** Ambient lighting overlay per time of day */
  ambientOverlay: Record<TimeOfDay, string>;
  /** Fog/atmosphere settings */
  fogColor?: string;
  fogOpacity?: Record<TimeOfDay, number>;
  /** Is this biome unlocked by default? */
  isDefault?: boolean;
}

// --- Particle Config ---
export interface ParticleConfig {
  type: ParticleType;
  count: number;
  /** Spawn area: [xMin, xMax, yMin, yMax] as % */
  area: [number, number, number, number];
  /** Size range [min, max] in px */
  size: [number, number];
  /** Speed range [min, max] in px/frame */
  speed: [number, number];
  /** Opacity range */
  opacity: [number, number];
  /** Life span in frames */
  life: [number, number];
  /** Colors */
  colors: string[];
  /** Movement behavior */
  behavior: 'float' | 'fall' | 'rise' | 'wander' | 'drift';
  /** Glow radius (0 = no glow) */
  glow: number;
  /** Pulse speed (0 = no pulse) */
  pulseSpeed: number;
}

// --- Progression / Level Unlocks ---
export interface LevelReward {
  level: number;
  unlocks: UnlockDef[];
  description: string;
}

export interface UnlockDef {
  type: 'item' | 'biome' | 'creature' | 'feature' | 'recipe';
  id: string;
  quantity?: number;
  name: string;
}

// --- Achievement Definition ---
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'world' | 'streak' | 'social' | 'collection' | 'exploration';
  condition: AchievementCondition;
  rewards: { xp: number; items?: Array<{ item_type: string; item_id: string; quantity: number }> };
}

export interface AchievementCondition {
  type:
    | 'level_reached'
    | 'objects_placed'
    | 'biomes_unlocked'
    | 'streak_days'
    | 'goals_completed'
    | 'interactions'
    | 'daily_logins';
  target: number;
}

// --- Reward Result (from RPC) ---
export interface RewardResult {
  reward_levels?: number[];
  completed_biome?: string;
  success?: boolean;
  claimed_any?: boolean;
  already_claimed?: boolean;
  xp_granted?: number;
  level: number;
  xp: number;
  xp_to_next?: number;
  leveled_up?: boolean;
  old_level?: number;
  items_granted?: Array<{ item_type: string; item_id: string; quantity: number }>;
}

// --- Day/Night State ---
export interface DayNightState {
  phase: TimeOfDay;
  /** 0-1 progress within current phase */
  progress: number;
  /** Hour of day (0-23) */
  hour: number;
  /** Sky gradient colors */
  skyColors: string[];
  /** Ambient overlay */
  ambientOverlay: string;
  /** Light intensity 0-1 */
  lightIntensity: number;
}

// --- World Scene State ---
export interface WorldSceneState {
  worldState: WorldState | null;
  inventory: InventoryItem[];
  placedObjects: PlacedObject[];
  achievements: WorldAchievement[];
  dayNight: DayNightState;
  isLoading: boolean;
  error: string | null;
  showInventory: boolean;
  showMap: boolean;
  showBuildMode: boolean;
  selectedItem: InventoryItem | null;
  pendingReward: RewardResult | null;
}
