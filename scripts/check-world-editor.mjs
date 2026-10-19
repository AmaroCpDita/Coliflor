import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const testClient = {
  name: 'world-editor-test-client',
  enforce: 'pre',
  resolveId(source) {
    if (source === 'virtual:world-test-supabase' || source === '../../../lib/supabase') return '\0world-test-supabase';
  },
  load(id) {
    if (id === '\0world-test-supabase') return 'export const supabase = { from() { throw new Error("Unexpected database access in test"); } };';
  },
};
// Never overwrite the dependencies used by the user's running dev server.
const server = await createServer({ configFile: false, cacheDir: 'tmp.local/world-editor-vite-cache', plugins: [testClient, react()], server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true } });
try {
  const { clampObjectScale, clampWorldPosition, screenDeltaToWorld, worldToScreen, nightLightStrength } = await server.ssrLoadModule('/src/features/our-world/engine/placement.ts');
  assert.equal(clampObjectScale(.1), .5);
  assert.equal(clampObjectScale(2), 1.5);
  assert.equal(clampObjectScale(.79999999), .8);
  const { isObjectFlipped, spritePointToScreen } = await server.ssrLoadModule('/src/features/our-world/engine/orientation.ts');
  const { projectGroundLight } = await server.ssrLoadModule('/src/features/our-world/engine/lighting.ts');
  const { fitWorldFrame, getNightLandscapeOpacity } = await server.ssrLoadModule('/src/features/our-world/data/dioramas.ts');
  const { getPlacementDef, getObjectDef, ALL_OBJECTS, GARDEN_COLLECTION } = await server.ssrLoadModule('/src/features/our-world/data/objects.ts');
  const { getInventoryObjects, findInventorySource } = await server.ssrLoadModule('/src/features/our-world/data/catalog.ts');
  const { LEVEL_REWARDS, xpToNextLevel, totalXpForLevel, levelFromTotalXp } = await server.ssrLoadModule('/src/features/our-world/data/progression.ts');
  const { BIOMES } = await server.ssrLoadModule('/src/features/our-world/data/biomes.ts');
  const { CREATURES } = await server.ssrLoadModule('/src/features/our-world/data/creatures.ts');
  const { getWorldCompanions } = await server.ssrLoadModule('/src/features/our-world/data/companions.ts');
  const { ASSET_REGISTRY } = await server.ssrLoadModule('/src/features/our-world/data/assets.ts');
  const { default: Scene } = await server.ssrLoadModule('/src/features/our-world/components/WorldScene.tsx');
  const { default: HUD } = await server.ssrLoadModule('/src/features/our-world/components/WorldHUD.tsx');
  const { default: Lighting } = await server.ssrLoadModule('/src/features/our-world/components/WorldLighting.tsx');
  const { default: Controls } = await server.ssrLoadModule('/src/features/our-world/components/WorldBuildControls.tsx');
  const { default: Inventory } = await server.ssrLoadModule('/src/features/our-world/components/Inventory.tsx');
  const { default: WorldObject } = await server.ssrLoadModule('/src/features/our-world/components/WorldObject.tsx');
  const { default: ForestJournal } = await server.ssrLoadModule('/src/features/our-world/components/ForestJournal.tsx');
  const { default: WorldMap } = await server.ssrLoadModule('/src/features/our-world/components/WorldMap.tsx');
  const { default: RewardModal } = await server.ssrLoadModule('/src/features/our-world/components/RewardModal.tsx');
  const { FOREST_GOALS, forestCompletionPercent } = await server.ssrLoadModule('/src/features/our-world/data/forest.ts');
  const dayNight = { phase: 'day', progress: 0.5, hour: 14, skyColors: ['#87ceeb', '#fff'], ambientOverlay: 'transparent', lightIntensity: 1 };
  const worldState = { id: 'world', couple_id: 'couple', level: 20, xp: 0, current_biome: 'forest', unlocked_biomes: ['forest'], last_daily_date: null };
  const sceneProps = { worldState, inventory: [], placedObjects: [], achievements: [], dayNight, pendingReward: null,
    onClaimLevelRewards() {}, async onPlaceItem() { return { success: true }; }, async onRemoveItem() { return { success: true }; },
    async onMoveItem() { return { success: true }; }, async onFlipItem() { return { success: true }; }, onInteractXP() {}, onDismissReward() {} };
  const blank = renderToStaticMarkup(React.createElement(Scene, sceneProps));
  assert.equal(getWorldCompanions('unrelated-couple','forest').length,0,'Personal pets must not appear in other couples\' worlds');
  assert.equal(getWorldCompanions('7b8edae0-65da-44b7-a9b9-8073ecdd607e','unknown').length,0);
  assert.deepEqual(getWorldCompanions('7b8edae0-65da-44b7-a9b9-8073ecdd607e','forest').map(pet=>pet.name),['Max','Abi']);
  const companionScene = renderToStaticMarkup(React.createElement(Scene, { ...sceneProps, worldState: { ...worldState, level: 1, couple_id: '7b8edae0-65da-44b7-a9b9-8073ecdd607e' } }));
  assert.equal((companionScene.match(/data-companion=/g)||[]).length,2,'Both companions are available without altering progression or adding placed objects');
  assert(companionScene.includes('aria-label="Acariciar a Max"') && companionScene.includes('aria-label="Acariciar a Abi"'));
  assert(!companionScene.includes('Javiera') && !companionScene.includes('Amaro'));
  const companionNight = renderToStaticMarkup(React.createElement(Scene, {
    ...sceneProps,
    worldState: { ...worldState, couple_id: '7b8edae0-65da-44b7-a9b9-8073ecdd607e' },
    dayNight: { ...dayNight, phase: 'night' },
  }));
  assert.equal((companionNight.match(/data-pose="rest"/g) || []).length, 2, 'Both dogs rest at night');
  const welcomePreview = renderToStaticMarkup(React.createElement(Scene, {
    ...sceneProps, isWelcomePreview: true,
    worldState: { ...worldState, couple_id: '7b8edae0-65da-44b7-a9b9-8073ecdd607e' },
    placedObjects: [{id:'old',biome_id:'forest',item_id:'lantern',position_x:50,position_y:50,scale:1,rotation:0,state:{}}],
  }));
  assert(!welcomePreview.includes('data-companion=') && !welcomePreview.includes('class="world-object') && !welcomePreview.includes('class="world-hud'), 'First-entry preview hides possessions, pets and controls even if the partner already played');
  assert(welcomePreview.includes('aria-hidden="true"') && welcomePreview.includes('inert=""'));
  const { COMPANION_MOMENTS, COMPANION_ROUTINES, clampCompanionPosition, pickNextCompanionRoutine } = await server.ssrLoadModule('/src/features/our-world/engine/companionMotion.ts');
  for(const moment of COMPANION_MOMENTS) for(const pet of ['max','abi']) {
    const cue=moment[pet];
    assert.deepEqual(clampCompanionPosition(cue.x,cue.y),{x:cue.x,y:cue.y},'All routes stay inside the lower grass bank');
    assert(cue.duration+(cue.delay||0)<=moment.duration,'Walking finishes before the next shared activity');
  }
  assert(COMPANION_MOMENTS.some(moment=>moment.max.pose==='play'&&moment.abi.facingRight===false));
  assert(COMPANION_MOMENTS.some(moment=>moment.abi.pose==='play'&&moment.max.facingRight));
  for(const routine of COMPANION_ROUTINES) {
    assert.deepEqual(routine.at(0).max, routine.at(-1).max, 'Max returns home before a new routine');
    assert.deepEqual(routine.at(0).abi, routine.at(-1).abi, 'Abi returns home before a new routine');
  }
  for(let index=0;index<COMPANION_ROUTINES.length;index++) {
    assert.notEqual(pickNextCompanionRoutine(index, 0), index);
    assert.notEqual(pickNextCompanionRoutine(index, .999), index);
  }
  for(const pose of ['sniff','watch','stretch','rest'])
    assert(COMPANION_MOMENTS.some(moment=>moment.max.pose===pose||moment.abi.pose===pose));
  const { createCompanionJourney, isWalkable } = await server.ssrLoadModule('/src/features/our-world/engine/companionNavigation.ts');
  const pondJourney = createCompanionJourney([], 'forest', 0);
  assert(pondJourney.some(moment=>moment.max.pose==='drink'&&moment.abi.pose==='drink'),'Both dogs drink at the painted pond');
  const fountainJourney = createCompanionJourney([{id:'fountain',item_id:'fountain',position_x:45,position_y:40,scale:1}], 'garden', 1);
  assert(fountainJourney.some(moment=>moment.max.pose==='drink'),'Placed water sources are recognized at their current position');
  const meadowJourney = createCompanionJourney([], 'forest', 2);
  assert(meadowJourney.some(moment=>moment.max.pose==='run'&&moment.abi.pose==='run'),'They run together in the meadow');
  for(const moment of pondJourney) for(const pet of ['max','abi']) assert(isWalkable(moment[pet]),'Every stop stays on walkable land');
  const treehouse = { id:'house', item_id:'treehouse', position_x:70, position_y:43, scale:1 };
  const houseJourney = createCompanionJourney([treehouse], 'forest', 1);
  assert(houseJourney.some(moment=>moment.max.pose==='watch'&&moment.abi.pose==='play'),'The dogs visit the placed treehouse');
  const movedHouseJourney = createCompanionJourney([{...treehouse,position_x:43,position_y:40}], 'forest', 1);
  const houseStop = houseJourney.find((moment,index)=>index>0&&moment.max.pose==='watch').max;
  const movedStop = movedHouseJourney.find((moment,index)=>index>0&&moment.max.pose==='watch').max;
  assert.notDeepEqual({x:houseStop.x,y:houseStop.y},{x:movedStop.x,y:movedStop.y},'Moving the treehouse changes the next route');
  const rerouted = createCompanionJourney([{...treehouse,position_x:43,position_y:40}], 'forest', 1,
    {max:houseJourney[2].max,abi:houseJourney[2].abi});
  assert.equal(rerouted[0].max.x,houseJourney[2].max.x,'A changed object replans from Max’s current destination');
  assert.equal(rerouted[0].abi.y,houseJourney[2].abi.y,'A changed object replans from Abi’s current destination');
  for(const moment of houseJourney) for(const pet of ['max','abi']) assert(isWalkable(moment[pet]),'Visits avoid the pond');
  for(const journey of [pondJourney,houseJourney,meadowJourney]) for(let index=1;index<journey.length;index++) for(const pet of ['max','abi']) {
    const from=journey[index-1][pet], to=journey[index][pet];
    for(let sample=0;sample<=20;sample++) {
      const t=sample/20, point={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
      assert(isWalkable(point),`The full walking segment stays on land: ${journey===houseJourney?'house':'pond'} ${pet} ${index} ${JSON.stringify(point)}`);
      if(journey===houseJourney) {
        const dx=(point.x-treehouse.position_x)/8.71,dy=(point.y-treehouse.position_y)/5.66;
        assert(dx*dx+dy*dy>1,'The route avoids the treehouse footprint');
      }
    }
  }
  assert(!CREATURES.some(creature=>creature.id==='max'||creature.id==='abi'),'Personal pets are not global level rewards');
  const hudProps = { worldState, dayNight, onOpenInventory() {}, onOpenMap() {}, onToggleBuild() {}, onClaimLevelRewards() {}, buildMode: false };
  for (const canClaimLevelRewards of [true, false]) {
    const hud = renderToStaticMarkup(React.createElement(HUD, { ...hudProps, canClaimLevelRewards }));
    assert.equal((hud.match(/<button /g) || []).length, 4, 'Daily reward button remains visible after claiming');
    assert(hud.includes(canClaimLevelRewards ? 'Reclamar recompensas de nivel' : 'Recompensas de nivel reclamadas'));
    assert.equal(hud.includes('disabled=""'),!canClaimLevelRewards, 'The gift is active only for unclaimed levels');
  }
  const journalHUD = renderToStaticMarkup(React.createElement(HUD, { ...hudProps, canClaimLevelRewards: false, onOpenForest() {}, xpBoostActive: true }));
  assert.equal((journalHUD.match(/<button /g) || []).length, 5);
  assert(journalHUD.includes('Abrir diario del bosque') && journalHUD.includes('×2 hoy'));
  assert(!blank.includes('forest-journal-launcher'), 'Diary belongs in the top action row');
  assert(!blank.includes('class="world-object'), 'Empty world must not spawn objects, even at an advanced level');
  assert(blank.includes('world-scene__landscape--day'));
  assert(!blank.includes('world-scene__landscape--night'), 'Daytime must not request the unused night landscape');
  const nightScene = renderToStaticMarkup(React.createElement(Scene, { ...sceneProps, dayNight: { ...dayNight, phase: 'night', progress: .5, lightIntensity: .15 } }));
  assert(nightScene.includes('world-scene__landscape--night') && nightScene.includes('opacity:1'));
  assert(!nightScene.includes('world-scene__landscape--day'), 'Nighttime must not request the unused day landscape');
  const sunsetScene = renderToStaticMarkup(React.createElement(Scene, { ...sceneProps, dayNight: { ...dayNight, phase: 'evening', progress: .5 } }));
  assert(sunsetScene.includes('world-scene__landscape--day') && sunsetScene.includes('world-scene__landscape--night'), 'Transitions retain both landscapes for blending');
  assert.equal(getNightLandscapeOpacity('night', .95), 1, 'Late evening must remain night until dawn');
  assert.equal(getNightLandscapeOpacity('morning', 0), 1);
  assert.equal(getNightLandscapeOpacity('morning', .5), 0);
  assert.equal(getNightLandscapeOpacity('evening', 0), 0);
  assert.equal(getNightLandscapeOpacity('evening', 1), 1);
  assert.equal(getNightLandscapeOpacity('evening', .5), .5);
  assert(!blank.includes('garden-landscape-v2.png'));
  const house = { id: 'owned-house', couple_id: 'couple', biome_id: 'forest', item_type: 'building', item_id: 'treehouse', position_x: 65, position_y: 47, scale: 1, rotation: 0, state: {}, placed_by: 'user', placed_at: '' };
  const filled = renderToStaticMarkup(React.createElement(Scene, { ...sceneProps, placedObjects: [house] }));
  assert.equal((filled.match(/class="world-object /g) || []).length, 1, 'One owned placement must render once');
  const otherBiome = renderToStaticMarkup(React.createElement(Scene, { ...sceneProps, placedObjects: [{ ...house, biome_id: 'garden' }] }));
  assert(!otherBiome.includes('class="world-object'), 'Other biomes must not leak placements');

  for (const [width, height] of [[360, 800], [390, 844], [426, 1001], [560, 997]]) {
    const scale = fitWorldFrame(width, height).scale;
    const camera = { width, height, scale, offsetX: 23, offsetY: -7 };
    const origin = worldToScreen({ x: 50, y: 45 }, camera);
    const delta = screenDeltaToWorld(37, -29, scale);
    const target = worldToScreen({ x: 50 + delta.x, y: 45 + delta.y }, camera);
    assert(Math.abs(target.x - origin.x - 37) < 0.00001);
    assert(Math.abs(target.y - origin.y + 29) < 0.00001);
    const constrained = clampWorldPosition('treehouse', 999, 999);
    const houseAsset = ASSET_REGISTRY.treehouse;
    assert(constrained.x + houseAsset.width * (1 - houseAsset.anchorX) / 10 <= 100);
    assert((100 - constrained.y) * 17.78 - houseAsset.height * houseAsset.anchorY >= -0.001);
  }
  assert.equal(getPlacementDef('oak_seed').id, 'oak_tree');
  assert.equal(getPlacementDef('pine_seed').id, 'pine_tree');
  assert.equal(getObjectDef('stone_bench').id, 'wooden_bench');
  assert(ALL_OBJECTS.every(object => object.type !== 'seed' && !object.id.endsWith('_seed')));
  const inventory = [
    { id: 'old', item_type: 'seed', item_id: 'oak_seed', quantity: 3 },
    { id: 'old-tree', item_type: 'seed', item_id: 'oak_tree', quantity: 2 },
    { id: 'adult', item_type: 'tree', item_id: 'oak_tree', quantity: 4 },
    { id: 'old-flower', item_type: 'seed', item_id: 'basic_flower', quantity: 5 },
    { id: 'empty', item_type: 'seed', item_id: 'pine_seed', quantity: 0 },
  ];
  const inventorySnapshot = JSON.stringify(inventory);
  const objects = getInventoryObjects(inventory);
  assert.equal(objects.length, 2);
  assert.equal(objects.find(item => item.item_id === 'oak_tree').quantity, 9);
  assert.equal(objects.find(item => item.item_id === 'basic_flower').item_type, 'flower');
  assert.equal(findInventorySource(inventory, 'oak_tree').id, 'old');
  assert.equal(findInventorySource(inventory, 'pine_tree'), undefined);
  assert.equal(JSON.stringify(inventory), inventorySnapshot, 'Display grouping must not mutate server stock');
  const sql = readFileSync('supabase/migrations/017_forest_chapter.sql', 'utf8');
  const serverCatalog = new Map([...sql.matchAll(/\('([^']+)','([^']+)',(\d+),(\d+)\)/g)].map(match => [match[1], { type: match[2], level: +match[3], quantity: +match[4] }]));
  const starterSql = readFileSync('supabase/migrations/022_world_starter_and_quiz.sql', 'utf8');
  for (const update of starterSql.matchAll(/UPDATE public.world_object_catalog SET required_level=(\d+) WHERE item_id='([^']+)'/g)) {
    serverCatalog.get(update[2]).level = +update[1];
  }
  assert.equal(getObjectDef('treehouse').requiredLevel, 1, 'A home is part of the welcome pack');
  const editingHud = renderToStaticMarkup(React.createElement(HUD, { worldState, dayNight, buildMode: true, canClaimLevelRewards: false }));
  assert(editingHud.includes('aria-pressed="true"') && editingHud.includes('Salir del modo construcción'));
  const editingHouse = renderToStaticMarkup(React.createElement(WorldObject, { placedObject: house, buildMode: true, lightIntensity: .15 }));
  assert(editingHouse.includes('drop-shadow(0 0 9px') && editingHouse.includes('brightness(1.12)'), 'All edit-mode objects glow, even at night');
  assert.equal(serverCatalog.size, ALL_OBJECTS.length);
  for (const object of ALL_OBJECTS) {
    assert.equal(serverCatalog.get(object.id)?.type, object.type);
    assert.equal(serverCatalog.get(object.id)?.level, object.requiredLevel);
    assert.equal(ASSET_REGISTRY[object.renderKey]?.sourceType, 'img', `Every placeable reward needs its own artwork: ${object.id}`);
    assert.notEqual(ASSET_REGISTRY[object.renderKey]?.id, 'default_asset');
  }
  for (const reward of LEVEL_REWARDS) for (const item of reward.unlocks.filter(item => item.type === 'item')) {
    assert.equal(serverCatalog.get(item.id)?.level, reward.level);
    assert.equal(serverCatalog.get(item.id)?.quantity, item.quantity);
  }
  assert.equal(xpToNextLevel(9), 220);
  assert.equal(xpToNextLevel(2), 115, 'Floating-point rounding must not undercount the server threshold');
  assert.equal(xpToNextLevel(9, 1), 305, 'Pending migration still shows the server legacy threshold');
  assert.equal(xpToNextLevel(44), 220, 'Later biomes must not require years of exponential XP');
  assert.deepEqual(BIOMES.map(biome => biome.requiredLevel), [1,21,31,41,51]);
  for (const biome of BIOMES) assert(LEVEL_REWARDS.some(reward => reward.level === biome.requiredLevel && reward.unlocks.some(unlock => unlock.id === biome.id)));
  for (const creature of CREATURES) assert(LEVEL_REWARDS.some(reward => reward.level === creature.requiredLevel && reward.unlocks.some(unlock => unlock.id === creature.id)));
  assert.equal(ALL_OBJECTS.filter(object => object.requiredLevel <= 9).length, 13, 'Level nine has the original unlocks plus the starter home');
  for (let level = 2; level <= 31; level++) assert((LEVEL_REWARDS.find(reward => reward.level === level)?.unlocks.filter(unlock => unlock.type === 'item').length || 0) <= 1, 'At most one new object per later level keeps progression gradual');
  assert(!LEVEL_REWARDS.some(reward => reward.unlocks.some(unlock => unlock.id === 'forest_heart')), 'Completion landmark cannot be obtained from a level alone');
  const journalProps = { isOpen: true, onClose() {}, async onClaim() { return { success: true }; }, async onComplete() { return { success: true }; }, onRetry() {} };
  const progress = { visits: 1, member_visits: [1,0], level: 1, target_level: 21, target_days: 0, completed: false, can_complete: false,
    goals: FOREST_GOALS.map(goal => ({ id: goal.id, current: 0, target: 3, claimed: false })) };
  assert.equal(forestCompletionPercent({ ...progress, visits: 0 }), 0);
  const journal = renderToStaticMarkup(React.createElement(ForestJournal, { ...journalProps, progress }));
  assert.equal((journal.match(/class="forest-journal__goal /g) || []).length, 5);
  assert(!journal.includes('Días visitando el bosque') && journal.includes('encuentros y su racha') && journal.includes('forest-heart-v1-thumb.webp'));
  assert(journal.includes('disabled=""'), 'Unavailable goals and finale remain disabled');
  assert(!renderToStaticMarkup(React.createElement(ForestJournal, { ...journalProps, progress: null, unavailable: true })).includes('Reintentar'));
  const loadingJournal = renderToStaticMarkup(React.createElement(ForestJournal, { ...journalProps, progress: null, loading: true }));
  assert(loadingJournal.includes('Abriendo su diario') && !loadingJournal.includes('Reintentar'), 'Loading does not falsely show a failure');
  assert(renderToStaticMarkup(React.createElement(ForestJournal, { ...journalProps, progress: null })).includes('Reintentar'));
  const readyProgress = { ...progress, visits: 56, level: 21, goals: progress.goals.map(goal => ({ ...goal, current: goal.target, claimed: true })), can_complete: true };
  assert.equal(forestCompletionPercent(readyProgress), 99, 'Only saved completion reaches 100 percent');
  assert.equal(forestCompletionPercent({ ...readyProgress, completed: true }), 100);
  const finaleMarkup = renderToStaticMarkup(React.createElement(RewardModal, { reward: { completed_biome: 'forest', level: 21, xp: 0, items_granted: [{ item_id: 'forest_heart', item_type: 'special', quantity: 1 }] }, onDismiss() {} }));
  assert(finaleMarkup.includes('¡Completaron el bosque!') && finaleMarkup.includes('forest-heart-v1-thumb.webp'), 'The forest finale celebrates the couple and shows its unique landmark');
  assert.equal(forestCompletionPercent({ ...readyProgress, goals: readyProgress.goals.map(goal => ({ ...goal, current: 0 })) }), 99, 'Earned goals do not disappear when redecorating');
  const lockedMap = renderToStaticMarkup(React.createElement(WorldMap, { isOpen: true, onClose() {}, onSelectBiome() {}, worldState: { ...worldState, level: 30, progression_version: 3 } }));
  assert(lockedMap.includes('Completa el bosque'));
  const completedMap = renderToStaticMarkup(React.createElement(WorldMap, { isOpen: true, onClose() {}, onSelectBiome() {}, worldState: { ...worldState, level: 21, progression_version: 3, forest_completed_at: '2026-10-03' } }));
  assert(!completedMap.includes('Completa el bosque'));
  for (const creature of CREATURES.filter(creature => creature.biomes.includes('forest'))) assert.notEqual(ASSET_REGISTRY[creature.renderKey]?.id, undefined, 'Forest visitors need an actual sprite');
  for (const level of [1,9,14,24,34,44]) assert.deepEqual(levelFromTotalXp(totalXpForLevel(level)), { level, xp: 0 });
  for (const object of GARDEN_COLLECTION) assert.equal(ASSET_REGISTRY[object.renderKey].sourceType, 'img');
  assert.equal(nightLightStrength(1), 0);
  assert.equal(nightLightStrength(0.15), 1);
  const camera = { width: 426, height: 1001, scale: 0.56, offsetX: 0, offsetY: 0 };
  assert.equal(renderToStaticMarkup(React.createElement(Lighting, { objects: [house], camera, lightIntensity: 1 })), '');
  const emptyNight = renderToStaticMarkup(React.createElement(Lighting, { objects: [], camera, lightIntensity: 0.15 }));
  assert(!emptyNight.includes('world-lighting__bloom'), 'Empty world must not light unowned lamps');
  const night = renderToStaticMarkup(React.createElement(Lighting, { objects: [house], camera, lightIntensity: 0.15 }));
  assert.equal((night.match(/class="world-lighting__bloom"/g) || []).length, 3);
  const shrub = { ...house, id: 'owned-shrub', item_type: 'plant', item_id: 'firefly_bush' };
  const flyNight = renderToStaticMarkup(React.createElement(Lighting, { objects: [shrub], camera, lightIntensity: .15 }));
  assert.equal((flyNight.match(/class="world-firefly"/g) || []).length, 4);
  const manyShrubs = renderToStaticMarkup(React.createElement(Lighting, { objects: Array.from({ length: 10 }, (_, index) => ({ ...shrub, id: `shrub-${index}` })), camera, lightIntensity: .15 }));
  assert.equal((manyShrubs.match(/class="world-firefly"/g) || []).length, 12, 'Many shrubs must not flood the screen with fireflies');
  assert.equal(renderToStaticMarkup(React.createElement(Lighting, { objects: [shrub], camera, lightIntensity: 1 })), '');
  const mushrooms = { ...shrub, item_id: 'glowing_mushrooms' };
  const mushroomNight = renderToStaticMarkup(React.createElement(Lighting, { objects: [mushrooms], camera, lightIntensity: .15 }));
  assert.equal((mushroomNight.match(/world-lighting__bloom--cyan/g) || []).length, 3);
  assert(mushroomNight.includes('world-lighting__ground--cyan'));
  const controls = renderToStaticMarkup(React.createElement(Controls, { object: house, camera, isSaving: false, onPreview() {}, onMove() {}, onRemove() {}, onFlip() {}, onClose() {} }));
  assert(!controls.includes('Achicar') && !controls.includes('Agrandar') && !controls.includes('Restablecer tamaño'), 'Resizing uses the pinch gesture exclusively');
  assert(controls.includes('2 dedos: tamaño'));
  assert(controls.includes('aria-label="Mover Casa del Árbol"'));
  assert(controls.includes('Eliminar'));
  assert(controls.includes('lo devuelve al inventario'));
  assert(controls.includes('aria-label="Voltear Casa del Árbol"'));
  const lamp = { ...house, item_id: 'lantern', state: { custom: 'preserved' }, position_x: 50, position_y: 40 };
  const mirroredLamp = { ...lamp, state: { ...lamp.state, flipped: true } };
  assert.equal(isObjectFlipped(lamp), false);
  assert.equal(isObjectFlipped(mirroredLamp), true);
  assert.equal(isObjectFlipped({ state: null }), false, 'Legacy null metadata is supported');
  const mirroredMarkup = renderToStaticMarkup(React.createElement(WorldObject, { placedObject: mirroredLamp }));
  assert(mirroredMarkup.includes('scaleX(-1)'));
  assert(mirroredMarkup.includes('rotate(0deg)'), 'Facing changes must keep the sprite upright');
  const lampAsset = ASSET_REGISTRY.lantern;
  const lampAnchor = worldToScreen({ x: lamp.position_x, y: lamp.position_y }, camera);
  const groundBefore = projectGroundLight(lamp, lampAsset, lampAsset.lights[0], camera);
  const groundAfter = projectGroundLight(mirroredLamp, lampAsset, lampAsset.lights[0], camera);
  assert(Math.abs(groundBefore.x + groundAfter.x - 2 * lampAnchor.x) < .00001, 'Ground illumination follows the flipped emitter');
  assert(groundBefore.y > lampAnchor.y, 'Lamp illuminates the ground below the bulb');
  assert.equal(groundBefore.width, 290 * camera.scale);
  const scaledGround = projectGroundLight({ ...lamp, scale: 2 }, lampAsset, lampAsset.lights[0], { ...camera, scale: camera.scale / 2 });
  assert.equal(scaledGround.width, groundBefore.width, 'Light reach uses the same world/camera scale as the source');
  const houseGround = projectGroundLight(house, ASSET_REGISTRY.treehouse, ASSET_REGISTRY.treehouse.lights[0], camera);
  const mushroomAsset = ASSET_REGISTRY.glowing_mushrooms;
  const mushroomGround = projectGroundLight(mushrooms, mushroomAsset, mushroomAsset.lights[0], camera);
  assert(groundBefore.width > houseGround.width && houseGround.width > mushroomGround.width, 'Streetlight spills farther than an indoor window or mushroom');
  assert(groundBefore.intensity > houseGround.intensity);
  assert.equal((night.match(/class="world-lighting__ground"/g) || []).length, 3, 'Each window contributes local illumination rather than one house-sized halo');
  const beforeLight = spritePointToScreen(lamp, lampAsset, lampAsset.lights[0], camera);
  const afterLight = spritePointToScreen(mirroredLamp, lampAsset, lampAsset.lights[0], camera);
  assert(Math.abs(beforeLight.x + afterLight.x - 2 * lampAnchor.x) < .00001);
  assert.equal(beforeLight.y, afterLight.y);
  const flippedNight = renderToStaticMarkup(React.createElement(Lighting, { objects: [mirroredLamp], camera, lightIntensity: .15 }));
  assert(flippedNight.includes(`left:${afterLight.x}px`), 'Night bloom must follow the flipped bulb');
  const normalEdge = clampWorldPosition('lantern', 0, 40);
  const flippedEdge = clampWorldPosition('lantern', normalEdge.x, 40, 1, true);
  assert(flippedEdge.x >= lampAsset.width * (1 - lampAsset.anchorX) / 10, 'Flipping at an edge keeps the asymmetric sprite inside the plot');
  for (const asset of Object.values(ASSET_REGISTRY)) {
    if (asset.sourceType === 'img') {
      assert(existsSync('public' + asset.source), `Missing sprite: ${asset.source}`);
      assert(asset.source.endsWith('.webp'), 'Scene artwork uses compressed delivery copies');
      assert(asset.thumbnail && existsSync('public' + asset.thumbnail), 'Inventory uses a separate small thumbnail');
    }
  }
  const objectSprites = ALL_OBJECTS.map(object => ASSET_REGISTRY[object.renderKey]);
  assert.equal(new Set(objectSprites.map(asset => asset.source)).size, ALL_OBJECTS.length, 'Each object must have dedicated artwork');
  for (const asset of objectSprites) {
    const png = readFileSync('public' + (asset.originalSource || asset.source));
    const expectedHeight = asset.width * png.readUInt32BE(20) / png.readUInt32BE(16);
    assert(Math.abs(asset.height - expectedHeight) < 1, `Sprite proportions must keep base/light anchors aligned: ${asset.source}`);
  }
  assert(existsSync('public/assets/world/garden-empty-v3.png'));
  assert(existsSync('public/assets/world/garden-night-v1.png'));
  const worldCss = readFileSync('src/features/our-world/our-world.css', 'utf8');
  assert(worldCss.includes("url('/assets/world/optimized/garden-night-v1.webp')"));

  // Validate couple-scoped persistence without touching the user's database.
  const { supabase } = await server.ssrLoadModule('virtual:world-test-supabase');
  const { moveObject, resizeObject, flipObject, claimCatalogRewards } = await server.ssrLoadModule('/src/features/our-world/services/worldService.ts');
  const originalFrom = supabase.from;
  try {
    const calls = [];
    let result = { data: { id: house.id }, error: null };
    const query = { update(value) { calls.push(['update', value]); return this; }, eq(key, value) { calls.push(['eq', key, value]); return this; }, select(value) { calls.push(['select', value]); return this; }, async maybeSingle() { return result; } };
    supabase.from = table => { calls.push(['from', table]); return query; };
    assert.equal((await moveObject('couple', house.id, 35, 42)).success, true);
    assert.deepEqual(calls, [['from', 'world_placed_objects'], ['update', { position_x: 35, position_y: 42 }], ['eq', 'id', house.id], ['eq', 'couple_id', 'couple'], ['select', 'id']]);
    result = { data: null, error: null };
    assert.equal((await moveObject('couple', house.id, 35, 42)).success, false, 'Missing/denied row must not report success');
    result = { data: null, error: { message: 'Connection failed' } };
    assert.equal((await moveObject('couple', house.id, 35, 42)).error, 'Connection failed');
  } finally { supabase.from = originalFrom; }
  try {
    const calls = [];
    let readResult = { data: { ...lamp }, error: null };
    let writeResult = { data: { state: mirroredLamp.state, position_x: lamp.position_x, position_y: lamp.position_y }, error: null };
    const query = {
      select(columns) { calls.push(['select', columns]); return this; },
      eq(key, value) { calls.push(['eq', key, value]); return this; },
      update(value) { calls.push(['update', value]); this.writing = true; return this; },
      async maybeSingle() { return this.writing ? writeResult : readResult; },
    };
    supabase.from = table => { calls.push(['from', table]); return { ...query, writing: false }; };
    const result = await flipObject('couple', lamp.id, true);
    assert.equal(result.success, true);
    assert.deepEqual(result.object.state, { custom: 'preserved', flipped: true });
    assert.deepEqual(calls.filter(call => call[0] === 'update'), [['update', { state: { custom: 'preserved', flipped: true } }]], 'Ordinary flips change only orientation metadata');
    assert.deepEqual(calls.filter(call => call[0] === 'eq'), [['eq','id',lamp.id],['eq','couple_id','couple'],['eq','id',lamp.id],['eq','couple_id','couple']]);
    calls.length = 0;
    readResult = { data: { ...lamp, position_x: normalEdge.x }, error: null };
    assert.equal((await flipObject('couple', lamp.id, true)).success, true);
    assert.equal(calls.find(call => call[0] === 'update')[1].position_x, flippedEdge.x);
    calls.length = 0;
    readResult = { data: null, error: null };
    assert.equal((await flipObject('couple', lamp.id, true)).success, false);
    assert(!calls.some(call => call[0] === 'update'), 'Missing or denied objects must not be changed');
    readResult = { data: lamp, error: null };
    writeResult = { data: null, error: { message: 'Save failed' } };
    assert.equal((await flipObject('couple', lamp.id, true)).success, false);
    writeResult = { data: null, error: null };
    assert.equal((await flipObject('couple', lamp.id, true)).success, false);
  } finally { supabase.from = originalFrom; }
  const originalRpc = supabase.rpc;
  try {
    const calls = [];
    let current = { data: { ...mirroredLamp, position_x: flippedEdge.x }, error: null };
    let saved = { data: { scale: 1.5, position_x: 50, position_y: 40 }, error: null };
    const query = {
      select() { return this; }, eq(key, value) { calls.push(['eq', key, value]); return this; },
      update(value) { calls.push(['update', value]); this.writing = true; return this; },
      async maybeSingle() { return this.writing ? saved : current; },
    };
    supabase.from = table => { assert.equal(table, 'world_placed_objects'); return { ...query, writing: false }; };
    assert.equal((await resizeObject('couple', lamp.id, 5)).success, true);
    const resize = calls.find(call => call[0] === 'update')[1];
    assert.equal(resize.scale, 1.5);
    assert.deepEqual(Object.keys(resize).sort(), ['position_x', 'position_y', 'scale'], 'Resizing preserves orientation, metadata and stock');
    assert.equal(resize.position_x, clampWorldPosition(lamp.item_id, flippedEdge.x, lamp.position_y, 1.5, true).x, 'Growing a flipped object at the edge keeps it inside the world');
    assert.deepEqual(calls.filter(call => call[0] === 'eq'), [['eq','id',lamp.id],['eq','couple_id','couple'],['eq','id',lamp.id],['eq','couple_id','couple']]);
    calls.length = 0;
    assert.equal((await resizeObject('couple', lamp.id, NaN)).success, false);
    assert.equal(calls.length, 0);
    current = { data: null, error: null };
    assert.equal((await resizeObject('couple', lamp.id, .5)).success, false);
    assert(!calls.some(call => call[0] === 'update'));
    current = { data: lamp, error: null };
    saved = { data: null, error: { message: 'Save failed' } };
    assert.equal((await resizeObject('couple', lamp.id, .5)).error, 'Save failed');
  } finally { supabase.from = originalFrom; }
  const originalError = console.error;
  const originalInfo = console.info;
  try {
    console.error = () => {};
    console.info = () => {};
    let reply = { data: null, error: { code: 'PGRST202' } };
    const requests = [];
    supabase.rpc = async (name, args) => { requests.push([name, args]); return reply; };
    assert.deepEqual(await claimCatalogRewards('couple'), { status: 'unavailable' });
    assert.deepEqual(requests, [['claim_world_catalog', { p_couple_id: 'couple' }]], 'Missing catalog must not trigger client-side grants');
    reply = { data: null, error: { code: '42883' } };
    assert.equal((await claimCatalogRewards('couple')).status, 'unavailable');
    reply = { data: null, error: { code: '42501' } };
    assert.equal((await claimCatalogRewards('couple')).status, 'error');
    reply = { data: { success: true, claimed_any: false }, error: null };
    assert.deepEqual(await claimCatalogRewards('couple'), { status: 'ready', reward: reply.data });
    supabase.rpc = async () => { throw new Error('Network failed'); };
    assert.equal((await claimCatalogRewards('couple')).status, 'error');
  } finally { supabase.rpc = originalRpc; console.error = originalError; console.info = originalInfo; }
  const { loadForestProgress, claimForestGoal, completeForest, switchBiome } = await server.ssrLoadModule('/src/features/our-world/services/worldService.ts');
  try {
    supabase.rpc = async () => ({ data: null, error: { code: 'PGRST202' } });
    assert.equal((await loadForestProgress('couple')).status, 'unavailable');
    let forestRpc;
    supabase.rpc = async (name) => { forestRpc = name; return { data: progress, error: null }; };
    assert.deepEqual(await loadForestProgress('couple'), { status: 'ready', progress });
    assert.equal(forestRpc, 'record_forest_visit');
    assert.deepEqual(await loadForestProgress('couple', false), { status: 'ready', progress });
    assert.equal(forestRpc, 'get_forest_progress', 'Refreshing inventory progress does not rewrite the daily visit');
    supabase.rpc = async () => { throw new Error('Network failed'); };
    assert.equal((await loadForestProgress('couple')).status, 'error');
    assert.equal((await claimForestGoal('couple','first_corner')).success, false);
    assert.equal((await completeForest('couple')).success, false);
    assert.equal((await switchBiome('couple','garden')).success, false);
  } finally { supabase.rpc = originalRpc; }
  const inventoryProps = { isOpen: true, items: inventory, onClose() {}, onSelectItem() {} };
  const otherBiomeInventory = renderToStaticMarkup(React.createElement(Inventory, { ...inventoryProps, items: [{ id: 'rose-stock', item_id: 'rose', item_type: 'flower', quantity: 1 }], biomeId: 'forest' }));
  assert(otherBiomeInventory.includes('siguen siendo tuyos') && otherBiomeInventory.includes('Para Jardín'), 'Owned rewards in another biome explain where they can be used');
  assert(otherBiomeInventory.includes('disabled=""'), 'Ownership must not bypass biome placement rules');
  const unavailableInventory = renderToStaticMarkup(React.createElement(Inventory, { ...inventoryProps, catalogUnavailable: true }));
  assert(unavailableInventory.includes('todavía no están disponibles'));
  assert(!unavailableInventory.includes('Reintentar'), 'Missing migration cannot be fixed by a retry');
  assert(unavailableInventory.includes('Roble'), 'Existing stock must remain usable');
  const failedInventory = renderToStaticMarkup(React.createElement(Inventory, { ...inventoryProps, rewardsError: true }));
  assert(failedInventory.includes('Reintentar'), 'Transient errors must remain retryable');
  console.log('World editor checks passed: empty progression, adult legacy stock, catalog/server agreement, owned placements, scaled movement, boundaries, night-only lights/fireflies, controls and persistence.');
} finally {
  await server.close();
}
