# Garden artwork

## Secret Garden biome (2026-10-22)

The second biome uses its own day and night landscapes:
`public/assets/world/secret-garden-day-v1.png` and
`public/assets/world/secret-garden-night-v1.png`. Its waterfall sits high on the
left, the stone path approaches from the right, and an open irregular lawn leaves
room for player placements and companion movement. This differs from the forest's
left-hand trail and lower-right pond. The two landscapes share a composition for
the day/night crossfade. Delivery WebP files are 840 × 1493 pixels at quality 70,
and are fetched only when the garden is visited; the PNG masters are kept for
future artwork revisions.

## Remaining biome landscapes (2026-10-22)

The Beach, Magical Glade and Snowy Mountain each have paired day/night PNG masters
in `public/assets/world/`, named `secret-beach-*`, `magical-glade-*` and
`snowy-mountain-*`. The beach leaves a wide sand cove beneath the shoreline;
the glade reserves its grassy center inside the tree arch; the mountain keeps
the central snowfield open. Each has room for large placed objects. Their WebP
delivery images are 840 × 1493 pixels at quality 70, referenced only by the
active biome's CSS selectors. They remain outside the PWA precache and are
fetched when the biome is visited. The local development map includes a
read-only preview toggle for all five biomes and shows real unlock progress.

Generated using the built-in `imagegen` tool from the visual reference `Captura de pantalla 2026-10-02 144608.png`. The light/pink interface was deliberately preserved. Original artwork remains available; current artwork is in `public/assets/world/`:

- `garden-empty-v3.png`: natural portrait terrain without buildings, lanterns, bench, bridge, fences or foreground trees. Rewards are placed separately by the player.
- `garden-landscape-v2.png`: superseded composition reference with fixed decorative objects; no longer used as the game background.
- `lantern-v2.png`: transparent wooden lamppost with independently rendered night bloom and light on the ground.
- `treehouse-v2.png`: transparent treehouse, independently positioned and interactive.
- `fountain-v2.png`: transparent low stone fountain, independently positioned and interactive.
- `oak-v3.png`: transparent oak, independently positioned and animated. The initial `oak-v2.png` is a superseded generation with an unwanted halo.

The composition is registered to the 1000 × 1778 frame in `src/features/our-world/data/dioramas.ts`. The camera uses uniform scaling; background and objects move together. There are no default scenery objects: only persisted placements are rendered. Trees are placed fully grown, with compatibility for old seed records. Night bloom is drawn above the ambient tint, at the placed lamp/window coordinates, and moves with the object. The hammer selects objects, displays a green footprint and a four-direction drag handle, persists position updates without adding XP or consuming inventory, and returns removed objects to inventory.


## Adult trees and unlockable garden collection (2026-10-03)

Created with the built-in `imagegen` tool, using `Captura de pantalla 2026-10-02 144608.png` as a style/camera reference and `transparent_background: true`. These are individually placed sprites, never painted into the world background. Source generations remain in the original generated-images directory. All twelve saved PNGs have transparent corners, and the complete collection was visually checked on a light-green contact sheet.

Saved assets:

- `public/assets/world/wooden-bench-v1.png`
- `public/assets/world/bush-v1.png`
- `public/assets/world/firefly-bush-v1.png`
- `public/assets/world/flower-bed-v1.png`
- `public/assets/world/glowing-mushrooms-v1.png`
- `public/assets/world/garden-arch-v1.png`
- `public/assets/world/picnic-table-v1.png`
- `public/assets/world/pond-bridge-v1.png`
- `public/assets/world/wishing-well-v1.png`
- `public/assets/world/garden-swing-v1.png`
- `public/assets/world/pine-tree-v1.png`
- `public/assets/world/birch-tree-v1.png`

The inventory now shows grown trees rather than seeds, with compatibility aliases for existing saves. Legacy quantities are grouped in the UI; migration 015 merges the actual database records without losing stock or placement coordinates. The wooden bench replaces the old stone-bench catalog entry. The new objects unlock at levels 4 (firefly bush), 6 (flowerbed), 8 (glowing mushrooms), 9 (picnic table), 12 (pond/bridge), 16 (well) and 18 (swing). Mature pine/birch, ordinary shrub and floral arch keep their existing levels. Each new object has a dedicated PNG. Fireflies, mushroom light and the well lantern are rendered dynamically at night. Artwork is cached when used rather than all being downloaded during PWA installation.

Shared prompt, prepended verbatim to every subject below:

Use case: stylized-concept. Asset type: a single transparent standalone unlockable object sprite for the supplied painterly cozy storybook garden game. The screenshot is STYLE and CAMERA reference only: create only the requested object, not an entire scene. Match delicate illustrated brush textures, natural muted yellow-green leaves, warm wood, soft golden daylight, charming crafted details and oblique camera slightly from above. Clean natural alpha transparency around entire silhouette, minimal small rooted/contact footprint, no large ground slab, no black matte, no checkerboard, no background haze or aura. Entire object fully in frame with small transparent margin. No text, no interface, no surrounding landscape, no other unrelated objects or animals. Avoid glossy 3D toy look, neon green, flat vector art, photorealism and frontal product photography.

### wooden_bench

Subject: A little rustic wooden garden bench for two, seen at a three-quarter angle from above. Two thick warm honey brown slats for the back, comfortable slatted seat, stout legs, a few curling ivy leaves on one leg, tiny pink and white flowers near the feet. Charming understated romantic garden furniture. Wider than tall, width to height about 1.6. No lamp or separate bush, no cushion, no terrain patch.

### bush

Subject: One lush low rounded garden shrub, broad oval shape with layered small natural yellow-green leaves and subtle deep green shadow, tiny white wildflowers at its base. Width to height about 1.35. A single ordinary green bush ready to place, no trunk exposed, no fireflies or glowing dots, no terracotta pot, no decor around it.

### firefly_bush

Subject: A distinct magical woodland bush: low leafy mound with softly drooping arching stems, layered muted sage and emerald leaves, a handful of little white star-shaped flowers tucked in the foliage and a tiny mossy root base. A little less rounded and more graceful than ordinary shrub. Width to height about 1.4. Leave transparent space above canopy for animated fireflies added later in code. Do NOT paint any fireflies or glow or aura or sparkles: daytime shrub only. No pot or other objects.

### flower_bed

Subject: A small oval flower garden border, densely packed delicate pink cosmos, white daisies, pale yellow flowers and soft lavender spikes amongst lush leaves. A thin irregular rim of warm grey small stones holds the planting bed, viewed obliquely from above. Width to height about 1.8. One coherent flowerbed object, not a collection of separate cutouts, not planter box, no whole landscape, minimal footprint.

### glowing_mushrooms

Subject: A cluster of three charming little mushrooms, cream stems and turquoise-blue caps with small cream spots, rooted in a little moss. One tallest cap and two small side caps. Aspect ratio about 1.4. No painted glow or aura; their night light will be added by the game.

### garden_arch

Subject: An elegant small rustic curved wooden garden arch, climbing ivy and soft dusty pink and cream roses across the top and posts. Clear empty opening, two rooted posts without a ground platform. Three-quarter view, ratio about .85.

### picnic_table

Subject: A rustic honey-brown wooden picnic table with two attached benches, a tiny vase with white daisies on top and a folded cream linen runner. Oblique from above, ratio about 1.5. No surrounding chairs or food.

### pond_bridge

Subject: A short arched wooden footbridge with simple curved handrails and sturdy planks, over a very small oval clear blue-green pond with natural smooth stones and a few reeds. Entire miniature pond and bridge form a single placeable object with irregular tight natural edges, no rectangular terrain slab. Ratio about 1.7.

### wishing_well

Subject: A small wishing well with a warm gray irregular stone circular base, honey-brown wooden posts, pitched terracotta-brown roof, rope spindle and little bucket. A tiny warm glass lantern hangs at the front right roof edge. No painted glow or aura, night lighting will be added in game. Three-quarter view, ratio about .85.

### garden_swing

Subject: A charming freestanding garden swing, sturdy rustic wooden A-frame and crossbeam with a single wide wooden bench seat suspended on two ropes, climbing ivy and dusty pink roses at one corner. No person. Entire freestanding frame, no attached trees. Three-quarter oblique view, ratio about 1.1.

### pine_tree

Subject: One already fully grown tall pine tree with layered irregular dense sage green boughs, warm brown visible trunk and small rooted contact base, mature natural woodland tree. No seedlings, no cones floating, no planter. Ratio about .65.

### birch_tree

Subject: One fully grown mature birch with a slender white and gray textured trunk branching into a delicate broad crown of yellow-green leaves, small natural rooted base. No seedling or planter. Ratio about .65.


## Progressive-world prompts

Empty terrain edit: preserve the framing, mountains, sky, distant forest, perspective, curving dirt path, blue pond, natural ground texture and near foliage of the portrait reference. Remove every constructed or decorative object: all wooden fences and posts, left lamp and post, bench, dock/bridge and its lantern, prominent pink flowering tree and standalone foreground trees. Seamlessly fill their footprints with natural grass, moss, dirt and wild ground cover. Keep distant forest, natural rocks, water and terrain wildflowers. Leave open clearings for player buildings and trees. No houses, fountain, lamp, bench, fence, bridge, placed flower arrangements, animals, UI, text, seams or rectangular patches. Preserve the illustrated aesthetic and sunny palette. The world starts as an empty natural plot; reward items are rendered separately.

Lamppost: generate a transparent standalone rustic wooden garden lamppost matching the reference. One tall narrow wooden post with a short upper arm holding a dark bronze/black metal lantern, a bright golden candle behind amber glass, a little ivy and small flowers at its foot. Warm painted wood texture, same oblique storybook perspective, whole post visible with a transparent margin. Clean alpha, no aura, background haze, scene, fence, trees, animals, additional props, text or interface. Night glow is added dynamically in code.

## Prompt set

### Landscape

Use case: precise-object-edit. Portrait mobile game environment background, 9:16 composition. Match the reference's delicate painterly storybook garden style, perspective, lush flowers, soft distant blue mountains, gentle daytime light, curving dirt path and blue pond. Remove all interface, header, XP bar, action buttons and bottom navigation, extending the landscape into those areas. Remove the treehouse and its supporting tree, large standalone oak, fountain, rabbit, bird and duck so they can be rendered separately. Keep the pink flowering tree, little bench, wooden fences, left lamp, wildflowers, path down the left lower half, pond at lower right and wooden dock. Leave flowering grassy clearings for the treehouse at right, oak at left and fountain near the center. Keep mountains and layered distant evergreen forest in the top third. Gentle blurred near foliage and fence at bottom; no tall tree trunks framing the sides or foliage obscuring the top. Continuous seamless landscape, no layer seams, black edges, collage effect, text, UI or additional buildings. Preserve the reference palette and detail; avoid neon greens.

### Treehouse

Use case: background-extraction / stylized-concept. Transparent standalone treehouse sprite, matching the upper-right treehouse in the reference. Tall twisting brown trunk, broad yellow-green canopy, cozy adjoining wood cottages with green pitched roofs, pink and white flowers, golden windows, wraparound wooden balcony, long winding staircase down the trunk, hanging lantern and a swing at right. Tall silhouette about 0.70 width to height. Crown in upper quarter, cottage in upper middle, visible trunk and staircase below. Oblique view from slightly above. Delicate painterly storybook style, natural green palette, soft daylight, no neon colors or shiny 3D appearance. A few roots and flowers at its feet, minimal ground footprint. Entire treehouse visible with a small transparent margin. No ground slab, background forest, horizon, UI, text, extra objects or animals.

### Fountain

Use case: stylized-concept. Transparent standalone small circular stone fountain matching the low fountain in the reference. Low basin of pale warm-grey stone blocks, clear pale-blue water, three delicate central jets falling into a shallow round pool. No ornamental tower, statue, architectural centerpiece or pedestal. Front rim of rectangular stone blocks, minimal grassy footprint and a few small flowers. Width to height about 1.7:1. Same oblique perspective, painterly cozy storybook style and soft daylight as the reference. Entire fountain visible with small transparent margin. No garden background, trees, interface, text or animals.

### Oak

Use case: background-extraction. Transparent standalone oak matching the tree in the middle-left of the reference. Fluffy natural yellow-green crown of small clustered leaves, slim gently twisting brown trunk in lower third, small forked branches, a few roots and wildflowers at its feet. Tall oval silhouette about 0.65 width to height. Delicate storybook painting, softly textured detail and warm daylight, muted natural foliage, no shiny neon leaves or fantasy ornaments. Oblique view from slightly above. Entire crown, trunk and roots inside frame with small margin. No house, scene, terrain rectangle, other trees, fence, lantern, animals, text or UI.

Final oak edit: remove only the soft yellow-green halo and semitransparent background haze around the silhouette. Keep actual leaves, branches, trunk, roots, flowers, proportions, texture and colors. Clean natural alpha transparency outside the tree, no aura, background, external root shadow, black matte or checkerboard; preserve delicate leaf edges.


## Completing the existing plant and flower artwork

Ten more dedicated PNGs replace the remaining SVGs and missing-renderer question marks. The entire 27-object placeable catalog now resolves to individual image assets. The newly saved PNGs were checked together on a light-green contact sheet, retain transparent corners and are smaller than 4 MiB each. Sprite boxes use their native proportions so the base anchors and light coordinates do not drift through letterboxing.

Saved assets:

- `public/assets/world/basic-flower-v1.png`
- `public/assets/world/wild-grass-v1.png`
- `public/assets/world/fern-v1.png`
- `public/assets/world/daisy-v1.png`
- `public/assets/world/tulip-v1.png`
- `public/assets/world/sunflower-v1.png`
- `public/assets/world/rose-v1.png`
- `public/assets/world/rare-orchid-v1.png`
- `public/assets/world/mushroom-red-v1.png`
- `public/assets/world/stone-small-v1.png`

Generated with the same built-in imagegen tool, transparent-background setting, reference image and shared prompt recorded above. Exact subjects:

### basic_flower

Subject: One small coherent rooted clump of delicate soft pink wildflowers with warm yellow centers, narrow leafy green stems and tiny natural root footprint. Not a bouquet or cut flower. A little taller than wide, width/height about .85.

### wild_grass

Subject: One low tuft of natural woodland grass, varied slender gently bending sage and yellow-green blades, a few delicate seedless grass heads, small rooted base. Width/height about1.15. No flower bed, no dirt slab.

### fern

Subject: One lush woodland fern clump with gracefully arching feathered fronds, delicate leaflets in muted green, small rooted moss contact base. Width/height about1.2. No pot.

### daisy

Subject: One coherent small clump of five white daisies with warm yellow centers on slender leafy stems, distinct natural flower heights and small rooted base. Width/height about.8. No pot or bouquet.

### tulip

Subject: A coherent small group of three delicate dusty pink tulips at slightly different heights, upright natural long leaves and short rooted base. Width/height about.7. No bouquet, pot or vase.

### sunflower

Subject: One fully grown cheerful sunflower, a warm golden yellow flower head with textured brown center, sturdy slightly bent green stem and broad natural leaves, small rooted base. Width/height about.55. No face, no pot, no bouquet.

### rose

Subject: One small rooted romantic rose bush with three dusty crimson red open roses, a few buds and delicately textured muted green foliage. A little taller than wide, width/height about.8. No pot, no bouquet or flower bed.

### rare_orchid

Subject: One small lush rare woodland orchid plant, graceful branching stems with delicate lavender and violet flowers with pale yellow centers, elegant broad natural green leaves and tiny moss root base. Width/height about.85. No pot or bouquet, no magical aura or glow.

### mushroom_red

Subject: A coherent little cluster of three red woodland toadstools with cream spots, ivory stems and tiny moss base. The center mushroom is taller and side mushrooms small. Width/height about1.0. No face, no glow or forest background.

### stone_small

Subject: One low smooth rounded warm gray river stone, softly irregular silhouette, gently brushed gray-green stone texture, tiny moss patch on one edge and just one small leaf at the base. Width/height about1.6. No terrain slab, pedestal, words or rune.
