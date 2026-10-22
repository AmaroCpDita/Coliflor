import { getAssetDef } from '../data/assets';
import { getPlacementDef } from '../data/objects';
import type { PlacedObject } from '../types';
import { COMPANION_HOME } from './companionMotion';
import type { CompanionCue, CompanionMoment, CompanionPose } from './companionMotion';

type Point = { x: number; y: number };
type Visit = {
  point: Point;
  abiPoint: Point;
  kind: 'water' | 'treehouse' | 'object' | 'meadow';
  id: string;
  activity?: CompanionPose;
  facingRight?: boolean;
  abiFacingRight?: boolean;
};

// Percent coordinates follow the painted ground. The pond occupies the lower right.
export function isWalkable(point: Point): boolean {
  const { x, y } = point;
  if (x < 13 || x > 86 || y < 17 || y > 49) return false;
  if (y < 23 && x > 68 - (y - 17) * 1.2) return false;
  if (y >= 23 && y < 32 && x > 61 - (y - 23) * 0.1) return false;
  if (y >= 32 && y < 38 && x > 64 + (y - 32) * 1.8) return false;
  return true;
}

const obstacleRadii = new WeakMap<PlacedObject, { scale: number; radius: number }>();
function obstacleRadius(object: PlacedObject): number {
  const scale = object.scale || 1;
  const cached = obstacleRadii.get(object);
  if (cached?.scale === scale) return cached.radius;
  const asset = getAssetDef(getPlacementDef(object.item_id)?.renderKey || 'default');
  const radius = Math.max(3.5, Math.min(10, (asset.width * scale) / 65));
  obstacleRadii.set(object, { scale, radius });
  return radius;
}

function isClear(point: Point, objects: PlacedObject[]): boolean {
  if (!isWalkable(point)) return false;
  return objects.every((object) => {
    const radius = obstacleRadius(object);
    const dx = (point.x - object.position_x) / radius;
    const dy = (point.y - object.position_y) / (radius * 0.65);
    return dx * dx + dy * dy > 1;
  });
}

function distance(a: Point, b: Point): number {
  return Math.hypot((a.x - b.x) * 1.0, (a.y - b.y) * 1.75);
}

const GRID_X = 3;
const GRID_Y = 2.5;
const COLS = 25;
const ROWS = 14;
const nodePoint = (col: number, row: number): Point => ({
  x: 13 + col * GRID_X,
  y: 17 + row * GRID_Y,
});
const nodeKey = (col: number, row: number) => `${col},${row}`;

export function findCompanionPath(from: Point, to: Point, objects: PlacedObject[]): Point[] {
  if (!isClear(to, objects)) return [];
  const nearest = (point: Point) => ({
    col: Math.max(0, Math.min(COLS - 1, Math.round((point.x - 13) / GRID_X))),
    row: Math.max(0, Math.min(ROWS - 1, Math.round((point.y - 17) / GRID_Y))),
  });
  const startNode = nearest(from);
  const targetNode = nearest(to);
  const grid = Array.from({ length: COLS * ROWS }, (_, index) => ({
    col: index % COLS,
    row: Math.floor(index / COLS),
  }));
  const startCandidates = grid.filter(({ col, row }) => {
    const point = nodePoint(col, row);
    return isClear(point, objects) && segmentIsClear(from, point, objects);
  });
  startCandidates.sort(
    (a, b) => distance(nodePoint(a.col, a.row), from) - distance(nodePoint(b.col, b.row), from),
  );
  const start = startCandidates[0] || startNode;
  const candidates = grid.filter(({ col, row }) => {
    const point = nodePoint(col, row);
    return isClear(point, objects) && segmentIsClear(point, to, objects);
  });
  candidates.sort(
    (a, b) => distance(nodePoint(a.col, a.row), to) - distance(nodePoint(b.col, b.row), to),
  );
  const goal = candidates[0] || targetNode;
  if (
    distance(nodePoint(start.col, start.row), from) > 6 ||
    distance(nodePoint(goal.col, goal.row), to) > 6
  )
    return [];
  const startKey = nodeKey(start.col, start.row);
  const goalKey = nodeKey(goal.col, goal.row);
  const open = new Set([startKey]);
  const costs = new Map([[startKey, 0]]);
  const previous = new Map<string, string>();
  const scores = new Map([[startKey, distance(from, to)]]);
  while (open.size) {
    const key = [...open].reduce((best, candidate) =>
      (scores.get(candidate) ?? Infinity) < (scores.get(best) ?? Infinity) ? candidate : best,
    );
    if (key === goalKey) {
      const path: Point[] = [];
      let cursor = key;
      while (cursor !== startKey) {
        const [col, row] = cursor.split(',').map(Number);
        path.unshift(nodePoint(col, row));
        cursor = previous.get(cursor)!;
      }
      path.unshift(nodePoint(start.col, start.row));
      path.push(to);
      return simplifyPath(from, path, objects);
    }
    open.delete(key);
    const [col, row] = key.split(',').map(Number);
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]) {
      const nextCol = col + dc;
      const nextRow = row + dr;
      if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) continue;
      const point = nodePoint(nextCol, nextRow);
      if (!isClear(point, objects) || !segmentIsClear(nodePoint(col, row), point, objects))
        continue;
      const nextKey = nodeKey(nextCol, nextRow);
      const tentative = (costs.get(key) ?? Infinity) + distance(nodePoint(col, row), point);
      if (tentative >= (costs.get(nextKey) ?? Infinity)) continue;
      previous.set(nextKey, key);
      costs.set(nextKey, tentative);
      scores.set(nextKey, tentative + distance(point, to));
      open.add(nextKey);
    }
  }
  return [];
}

function segmentIsClear(a: Point, b: Point, objects: PlacedObject[]): boolean {
  const samples = Math.ceil(distance(a, b) / 1.2);
  for (let index = 1; index <= samples; index++) {
    const t = index / samples;
    if (!isClear({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, objects)) return false;
  }
  return true;
}

function simplifyPath(from: Point, path: Point[], objects: PlacedObject[]): Point[] {
  const result: Point[] = [];
  let origin = from;
  for (let index = 0; index < path.length;) {
    let furthest = index;
    while (furthest + 1 < path.length && segmentIsClear(origin, path[furthest + 1], objects))
      furthest++;
    result.push(path[furthest]);
    origin = path[furthest];
    index = furthest + 1;
  }
  return result;
}

function visitsForWorld(objects: PlacedObject[], biomeId: string): Visit[] {
  const visits: Visit[] = [];
  if (biomeId === 'forest' || biomeId === 'garden') {
    visits.push({
      id: 'painted-pond',
      kind: 'water',
      point: { x: 57, y: 27 },
      abiPoint: { x: 63, y: 32 },
      facingRight: true,
      abiFacingRight: true,
    });
  }
  const priority = (itemId: string) =>
    itemId === 'treehouse' ? 0 : ['fountain', 'birdbath'].includes(itemId) ? 1 : 2;
  for (const object of [...objects].sort((a, b) => priority(a.item_id) - priority(b.item_id))) {
    const kind =
      object.item_id === 'treehouse'
        ? 'treehouse'
        : ['fountain', 'birdbath'].includes(object.item_id)
          ? 'water'
          : 'object';
    const radius = obstacleRadius(object) + 2;
    const candidates = [
      { x: object.position_x - radius, y: object.position_y },
      { x: object.position_x + radius, y: object.position_y },
      { x: object.position_x, y: object.position_y + radius * 0.65 },
      { x: object.position_x, y: object.position_y - radius * 0.65 },
      { x: object.position_x - radius * 0.8, y: object.position_y - radius * 0.65 },
      { x: object.position_x - radius * 0.8, y: object.position_y + radius * 0.65 },
    ].filter((point) => isClear(point, objects));
    const pairs = candidates.flatMap((maxPoint) =>
      candidates
        .filter((abiPoint) => distance(maxPoint, abiPoint) >= 10)
        .map((abiPoint) => ({
          maxPoint,
          abiPoint,
          score:
            distance(maxPoint, COMPANION_HOME.max) +
            distance(abiPoint, COMPANION_HOME.abi) +
            (maxPoint.x > 63 && maxPoint.y < 40 ? 9 : 0) +
            (abiPoint.x > 63 && abiPoint.y < 40 ? 9 : 0),
        })),
    );
    pairs.sort((a, b) => a.score - b.score);
    if (pairs[0])
      visits.push({
        id: object.id,
        kind,
        activity: ['wooden_bench', 'picnic_table', 'log_planter'].includes(object.item_id)
          ? 'rest'
          : ['campfire', 'birdhouse', 'forest_sign', 'wishing_well'].includes(object.item_id)
            ? 'watch'
            : 'sniff',
        point: pairs[0].maxPoint,
        abiPoint: pairs[0].abiPoint,
        facingRight: pairs[0].maxPoint.x < object.position_x,
        abiFacingRight: pairs[0].abiPoint.x < object.position_x,
      });
  }
  visits.push(
    {
      id: 'path-flowers',
      kind: 'object',
      point: { x: 42, y: 34 },
      abiPoint: { x: 52, y: 36 },
      facingRight: false,
      activity: 'sniff',
    },
    {
      id: 'open-meadow',
      kind: 'meadow',
      point: { x: 58, y: 42 },
      abiPoint: { x: 70, y: 44 },
      facingRight: true,
    },
  );
  return visits;
}

function movingCue(
  point: Point,
  previous: Point,
  duration: number,
  delay = 0,
  energetic = false,
  previousFacing = true,
): CompanionCue {
  return {
    ...point,
    facingRight: Math.abs(point.x - previous.x) < 1 ? previousFacing : point.x > previous.x,
    pose: energetic ? 'run' : 'walk',
    duration,
    delay,
  };
}

function stillCue(point: Point, facingRight: boolean, pose: CompanionPose): CompanionCue {
  return { ...point, facingRight, pose, duration: 0 };
}

export function createCompanionJourney(
  objects: PlacedObject[],
  biomeId: string,
  visitIndex: number,
  start: { max: Point; abi: Point } = { max: COMPANION_HOME.max, abi: COMPANION_HOME.abi },
): CompanionMoment[] | null {
  const visits = visitsForWorld(objects, biomeId);
  if (!visits.length) return null;
  const homeMax = COMPANION_HOME.max;
  const homeAbi = COMPANION_HOME.abi;
  let maxVisit: Visit | undefined;
  let abiVisit: Visit | undefined;
  let maxPath: Point[] = [];
  let abiPath: Point[] = [];
  for (let offset = 0; offset < visits.length; offset++) {
    const maxSelected = visits[(visitIndex + offset) % visits.length];
    const abiSelected = visits[(visitIndex + offset + 1) % visits.length];
    const driftX = Math.sin(visitIndex * 1.73) * 2.2;
    const driftY = Math.cos(visitIndex * 2.11) * 1.1;
    const vary = (selected: Visit): Visit =>
      selected.kind === 'meadow' || selected.id === 'path-flowers'
        ? {
            ...selected,
            point: { x: selected.point.x + driftX, y: selected.point.y + driftY },
            abiPoint: {
              x: selected.abiPoint.x + driftX * 0.7,
              y: selected.abiPoint.y + driftY * 0.7,
            },
          }
        : selected;
    const variedMax = vary(maxSelected);
    const variedAbi = vary(abiSelected);
    const candidateMaxVisit = isClear(variedMax.point, objects) ? variedMax : maxSelected;
    const candidateAbiVisit = isClear(variedAbi.abiPoint, objects) ? variedAbi : abiSelected;
    const candidateMax = findCompanionPath(start.max, candidateMaxVisit.point, objects);
    const candidateAbi = findCompanionPath(start.abi, candidateAbiVisit.abiPoint, objects);
    if (candidateMax.length && candidateAbi.length) {
      maxVisit = candidateMaxVisit;
      abiVisit = candidateAbiVisit;
      maxPath = candidateMax;
      abiPath = candidateAbi;
      break;
    }
  }
  if (!maxVisit || !abiVisit) return null;
  const moments: CompanionMoment[] = [
    {
      duration: 700 + (visitIndex % 3) * 220,
      max: stillCue(start.max, true, visitIndex % 2 ? 'watch' : 'idle'),
      abi: stillCue(start.abi, false, visitIndex % 2 ? 'idle' : 'tilt'),
    },
  ];
  const addLeg = (
    maxPoints: Point[],
    abiPoints: Point[],
    startMax: Point,
    startAbi: Point,
    energetic = false,
    staggered = false,
  ) => {
    const count = Math.max(maxPoints.length, abiPoints.length);
    let previousMax = startMax;
    let previousAbi = startAbi;
    let maxFacing = moments[moments.length - 1].max.facingRight;
    let abiFacing = moments[moments.length - 1].abi.facingRight;
    for (let index = 0; index < count; index++) {
      const max = maxPoints[index] || previousMax;
      const abi = abiPoints[index] || previousAbi;
      const maxTravel = distance(previousMax, max);
      const abiTravel = distance(previousAbi, abi);
      const travel = Math.max(maxTravel, abiTravel);
      const duration = energetic
        ? Math.max(1500, Math.min(3500, Math.round(travel * 140)))
        : Math.max(2100, Math.min(5200, Math.round(travel * 220)));
      const maxDuration = Math.round(duration * (0.9 + (index % 3) * 0.04));
      const abiDuration = Math.round(duration * (0.79 + ((index + visitIndex) % 3) * 0.07));
      const maxDelay = staggered && index === 0 && visitIndex % 2 === 1 ? 1600 : 0;
      const abiDelay =
        130 +
        ((index + visitIndex) % 3) * 105 +
        (staggered && index === 0 && visitIndex % 2 === 0 ? 1550 : 0);
      const maxCue =
        maxTravel < 0.5
          ? stillCue(max, maxFacing, 'watch')
          : movingCue(max, previousMax, maxDuration, maxDelay, energetic, maxFacing);
      const abiCue =
        abiTravel < 0.5
          ? stillCue(abi, abiFacing, 'watch')
          : movingCue(abi, previousAbi, abiDuration, abiDelay, energetic, abiFacing);
      moments.push({
        duration: Math.max(maxDuration + maxDelay, abiDuration + abiDelay) + 320,
        max: maxCue,
        abi: abiCue,
      });
      maxFacing = maxCue.facingRight;
      abiFacing = abiCue.facingRight;
      previousMax = max;
      previousAbi = abi;
    }
  };
  addLeg(maxPath, abiPath, start.max, start.abi, false, true);
  let maxEnd = maxPath[maxPath.length - 1];
  let abiEnd = abiPath[abiPath.length - 1];
  const activityFor = (visit: Visit): CompanionPose =>
    visit.kind === 'water'
      ? 'drink'
      : visit.kind === 'treehouse'
        ? 'watch'
        : visit.kind === 'meadow'
          ? 'play'
          : visit.activity || 'sniff';
  const maxActivity = activityFor(maxVisit);
  const abiActivity = activityFor(abiVisit);
  moments.push({
    duration:
      (maxVisit.kind === 'water' || abiVisit.kind === 'water' ? 3900 : 2700) +
      (visitIndex % 3) * 350,
    max: stillCue(maxEnd, maxVisit.facingRight ?? true, maxActivity),
    abi: stillCue(
      abiEnd,
      abiVisit.abiFacingRight ?? abiVisit.facingRight ?? true,
      abiVisit.kind === 'treehouse' ? 'play' : abiActivity,
    ),
  });
  if (maxVisit.kind === 'water' || abiVisit.kind === 'water')
    moments.push({
      duration: 1650,
      max: stillCue(
        maxEnd,
        maxVisit.facingRight ?? true,
        maxVisit.kind === 'water' ? 'shake' : 'watch',
      ),
      abi: stillCue(
        abiEnd,
        abiVisit.abiFacingRight ?? true,
        abiVisit.kind === 'water' ? 'sit' : 'tilt',
      ),
    });
  if (maxVisit.kind === 'treehouse' || abiVisit.kind === 'treehouse')
    moments.push({
      duration: 3100,
      max: stillCue(
        maxEnd,
        maxVisit.facingRight ?? true,
        maxVisit.kind === 'treehouse' ? 'lie' : 'sniff',
      ),
      abi: stillCue(abiEnd, abiVisit.abiFacingRight ?? true, 'tilt'),
    });
  if (maxVisit.kind === 'object' || abiVisit.kind === 'object')
    moments.push({
      duration: 1900 + (visitIndex % 2) * 500,
      max: stillCue(
        maxEnd,
        maxVisit.facingRight ?? true,
        maxVisit.kind === 'object' ? (maxActivity === 'rest' ? 'lie' : 'sit') : 'watch',
      ),
      abi: stillCue(
        abiEnd,
        abiVisit.abiFacingRight ?? true,
        abiVisit.kind === 'object' ? 'watch' : 'tilt',
      ),
    });
  if (maxVisit.kind === 'meadow' || abiVisit.kind === 'meadow') {
    moments.push({
      duration: 1300,
      max: stillCue(maxEnd, true, maxVisit.kind === 'meadow' ? 'hop' : 'watch'),
      abi: stillCue(abiEnd, false, abiVisit.kind === 'meadow' ? 'tilt' : 'watch'),
    });
    const chaseMax =
      maxVisit.kind === 'meadow' ? findCompanionPath(maxEnd, { x: 47, y: 43 }, objects) : [];
    const chaseAbi =
      abiVisit.kind === 'meadow' ? findCompanionPath(abiEnd, { x: 66, y: 44 }, objects) : [];
    if (
      (maxVisit.kind !== 'meadow' || chaseMax.length) &&
      (abiVisit.kind !== 'meadow' || chaseAbi.length)
    ) {
      addLeg(chaseMax, chaseAbi, maxEnd, abiEnd, true);
      if (chaseMax.length) maxEnd = chaseMax[chaseMax.length - 1];
      if (chaseAbi.length) abiEnd = chaseAbi[chaseAbi.length - 1];
      moments.push({
        duration: 2450,
        max: stillCue(maxEnd, true, maxVisit.kind === 'meadow' ? 'pant' : 'watch'),
        abi: stillCue(abiEnd, false, abiVisit.kind === 'meadow' ? 'hop' : 'watch'),
      });
    }
  }
  const returnMax = findCompanionPath(maxEnd, homeMax, objects);
  const returnAbi = findCompanionPath(abiEnd, homeAbi, objects);
  if (!returnMax.length || !returnAbi.length) return null;
  addLeg(returnMax, returnAbi, maxEnd, abiEnd);
  moments.push(COMPANION_HOME);
  return moments;
}
