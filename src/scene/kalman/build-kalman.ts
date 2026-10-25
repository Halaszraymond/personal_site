/**
 * Builds Kálmán as a Three.js object from a config.
 *
 * Every number comes from src/lib/kalman-shape.ts; this file only turns them into
 * meshes (shape + material). No renderer is involved, so it runs in Vitest under Node
 * and the playground and the future animated scene share exactly the same Kálmán.
 *
 * The low-poly look: few faces, each with one flat colour (flat shading, and colours
 * assigned per face rather than blended between corners).
 */
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Shape,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { KalmanConfig } from '../../lib/kalman-config';
import {
  bellyFactor,
  billStripeColour,
  bodyColourAt,
  CHEEK_INDEX,
  facetSegments,
  NECK_INDEX,
  PLUMAGE,
  pointAt,
  PROFILE_LENGTH,
  SHOULDER_INDEX,
  silhouette,
  uAtHeight,
  type ProfilePoint,
  type Rgb,
} from '../../lib/kalman-shape';

/** Mesh names, so tests and the animation code can find parts. */
export const PART = {
  body: 'body',
  bill: 'bill',
  flipperLeft: 'flipper-left',
  flipperRight: 'flipper-right',
  tie: 'tie',
  glasses: 'glasses',
} as const;

/** How far the flippers hang away from the body at rest, in radians (about 7°). */
const FLIPPER_SPLAY = 0.12;

/**
 * A Three.js colour from an sRGB colour (the values you see on screen).
 * Three.js works in linear light internally, so it converts; without this,
 * the black plumage would render as a washed-out grey.
 */
function toColour({ r, g, b }: Rgb): Color {
  return new Color().setRGB(r, g, b, SRGBColorSpace);
}

/** The radius of the silhouette at a height, interpolated between profile points. */
function radiusAtHeight(profile: readonly ProfilePoint[], y: number): number {
  const position = uAtHeight(profile, y) * (profile.length - 1);
  const lower = pointAt(profile, Math.floor(position));
  const upper = pointAt(profile, Math.min(profile.length - 1, Math.ceil(position)));
  return lower.radius + (upper.radius - lower.radius) * (position - Math.floor(position));
}

/**
 * Gives every triangle of a non-indexed geometry one colour, chosen from its centre.
 * One colour per face is what makes the facets read as facets.
 */
function colourFaces(geometry: BufferGeometry, colourOf: (centre: Vector3) => Rgb): void {
  const positions = geometry.getAttribute('position');
  const colours = new Float32Array(positions.count * 3);
  const centre = new Vector3();
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    centre.set(0, 0, 0);
    for (let corner = 0; corner < 3; corner++) {
      centre.x += positions.getX(vertex + corner) / 3;
      centre.y += positions.getY(vertex + corner) / 3;
      centre.z += positions.getZ(vertex + corner) / 3;
    }
    const { r, g, b } = toColour(colourOf(centre));
    for (let corner = 0; corner < 3; corner++) {
      colours.set([r, g, b], (vertex + corner) * 3);
    }
  }
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
}

/** A flat-shaded material; with `vertexColors` the colours come from the geometry. */
function material(options: { colour?: Color; vertexColours?: boolean; metal?: boolean }) {
  const { colour, vertexColours = false, metal = false } = options;
  return new MeshStandardMaterial({
    color: colour ?? 0xffffff,
    vertexColors: vertexColours,
    flatShading: true,
    roughness: metal ? 0.35 : 0.8,
    metalness: metal ? 0.6 : 0,
  });
}

/** Body and head as one lathe, with the belly pushed forward and the plumage coloured per face. */
function buildBody(config: KalmanConfig, profile: readonly ProfilePoint[]): Mesh {
  const segments = facetSegments(config.faceting);
  const lathe = new LatheGeometry(
    profile.map((point) => new Vector2(point.radius, point.y)),
    segments,
  );

  // Push the front of the belly outwards. Lathe vertices come in rings: vertex
  // `ring × PROFILE_LENGTH + j` belongs to profile point j.
  const positions = lathe.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const u = (index % PROFILE_LENGTH) / (PROFILE_LENGTH - 1);
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const factor = bellyFactor(u, Math.atan2(x, z), config.bellyRoundness);
    positions.setXYZ(index, x * factor, positions.getY(index), z * factor);
  }

  // Non-indexed: every triangle gets its own three corners, so it can have its own colour.
  const geometry = lathe.toNonIndexed();
  lathe.dispose();
  colourFaces(geometry, (centre) =>
    bodyColourAt(uAtHeight(profile, centre.y), Math.atan2(centre.x, centre.z), config),
  );
  geometry.computeVertexNormals();

  const mesh = new Mesh(geometry, material({ vertexColours: true }));
  mesh.name = PART.body;
  return mesh;
}

/** The slender bill: black on top, the orange-to-pink stripe on the lower mandible. */
function buildBill(config: KalmanConfig, profile: readonly ProfilePoint[]): Mesh {
  const length = 0.17 * config.billLength;
  const base = 0.03 * config.billThickness;
  const lathe = new LatheGeometry(
    [
      new Vector2(0, 0),
      new Vector2(base, 0.001),
      new Vector2(base * 0.82, length * 0.35),
      new Vector2(base * 0.45, length * 0.75),
      new Vector2(0, length),
    ],
    6,
  );
  lathe.rotateX(Math.PI / 2); // along +y → along +z: pointing forward
  const geometry = lathe.toNonIndexed();
  lathe.dispose();

  // Faces below the bill's centre line form the lower mandible with the stripe.
  colourFaces(geometry, (centre) =>
    centre.y < -base * 0.15 ? billStripeColour(centre.z / length) : PLUMAGE.black,
  );

  // A gentle downward curve towards the tip, stronger with more droop.
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const t = Math.max(0, positions.getZ(index)) / length;
    positions.setY(index, positions.getY(index) - 0.05 * config.billDroop * length * t * t * 4);
  }
  geometry.computeVertexNormals();

  const cheek = pointAt(profile, CHEEK_INDEX);
  const above = pointAt(profile, CHEEK_INDEX + 1);
  const mesh = new Mesh(geometry, material({ vertexColours: true }));
  mesh.name = PART.bill;
  mesh.position.set(0, (cheek.y + above.y) / 2, cheek.radius * 0.75);
  mesh.rotation.x = 0.15; // tilted slightly down
  return mesh;
}

/** Where an eye sits on the head, for one side (+1 right, −1 left). */
function eyePosition(profile: readonly ProfilePoint[], side: 1 | -1): Vector3 {
  const cheek = pointAt(profile, CHEEK_INDEX);
  const above = pointAt(profile, CHEEK_INDEX + 1);
  const y = cheek.y + (above.y - cheek.y) * 0.85;
  const radius = radiusAtHeight(profile, y) * 0.97;
  const angle = 0.62 * side; // about 35° from the front
  return new Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
}

/** Small dark eyes without a white or a highlight: deliberately not a cartoon mascot's eyes. */
function buildEye(config: KalmanConfig, profile: readonly ProfilePoint[], side: 1 | -1): Mesh {
  const mesh = new Mesh(
    new IcosahedronGeometry(0.012 * config.headSize, 0),
    material({ colour: toColour({ r: 0.02, g: 0.022, b: 0.027 }) }),
  );
  mesh.name = side === 1 ? 'eye-right' : 'eye-left';
  mesh.position.copy(eyePosition(profile, side));
  return mesh;
}

/**
 * A flipper hanging from the shoulder. The mesh sits in a pivot object at the shoulder,
 * so rotating the pivot swings the whole flipper, as the swim preview does.
 */
function buildFlipper(config: KalmanConfig, profile: readonly ProfilePoint[], side: 1 | -1) {
  const scale = config.flipperLength;
  const outline = new Shape();
  outline.moveTo(0, 0);
  outline.lineTo(0.035 * scale, -0.02 * scale);
  outline.lineTo(0.045 * scale, -0.2 * scale);
  outline.lineTo(0.025 * scale, -0.33 * scale);
  outline.lineTo(0.005 * scale, -0.36 * scale);
  outline.lineTo(-0.01 * scale, -0.3 * scale);
  outline.lineTo(-0.015 * scale, -0.05 * scale);
  outline.closePath();

  const geometry = new ExtrudeGeometry(outline, {
    depth: 0.014,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -0.007);
  geometry.rotateY(Math.PI / 2); // flat against the side of the body

  const blade = new Mesh(geometry, material({ colour: toColour(PLUMAGE.black) }));
  const shoulder = pointAt(profile, SHOULDER_INDEX);
  const pivot = new Group();
  pivot.name = side === 1 ? PART.flipperRight : PART.flipperLeft;
  pivot.userData['side'] = side;
  pivot.position.set(side * shoulder.radius * 0.95, shoulder.y - 0.01, -0.01);
  pivot.rotation.z = side * FLIPPER_SPLAY;
  pivot.add(blade);
  return pivot;
}

/** A low, flat foot at the front of the body. */
function buildFoot(config: KalmanConfig, side: 1 | -1): Mesh {
  const geometry = new IcosahedronGeometry(0.05, 0);
  geometry.scale(1, 0.3, 1.5);
  const mesh = new Mesh(geometry, material({ colour: toColour({ r: 0.16, g: 0.165, b: 0.18 }) }));
  mesh.name = side === 1 ? 'foot-right' : 'foot-left';
  mesh.position.set(side * 0.075 * config.bodyGirth, 0.012, 0.13 * config.bodyGirth);
  return mesh;
}

/** The tie of his professional side: a knot under the chin and a blade resting on the belly. */
function buildTie(config: KalmanConfig, profile: readonly ProfilePoint[]): Group {
  const size = config.tieSize;
  // Three.js reads a hex colour string as sRGB itself, so no extra conversion here.
  const tieMaterial = material({ colour: new Color(config.tieColour) });
  const neck = pointAt(profile, NECK_INDEX);
  const knotY = neck.y - 0.03 * size;

  const knot = new Mesh(new BoxGeometry(0.032 * size, 0.026 * size, 0.016 * size), tieMaterial);
  knot.position.set(0, knotY, radiusAtHeight(profile, knotY) + 0.004);

  const outline = new Shape();
  outline.moveTo(0, 0);
  outline.lineTo(0.024 * size, -0.03 * size);
  outline.lineTo(0.012 * size, -0.15 * size);
  outline.lineTo(0, -0.17 * size);
  outline.lineTo(-0.012 * size, -0.15 * size);
  outline.lineTo(-0.024 * size, -0.03 * size);
  outline.closePath();
  const blade = new Mesh(
    new ExtrudeGeometry(outline, { depth: 0.008, bevelEnabled: false, curveSegments: 1 }),
    tieMaterial,
  );
  // Lean the blade forward as much as the belly widens, so it lies on it.
  const top = knotY - 0.012 * size;
  const bottom = top - 0.17 * size;
  const rise = radiusAtHeight(profile, bottom) - radiusAtHeight(profile, top);
  blade.position.set(0, top, radiusAtHeight(profile, top) + 0.006);
  blade.rotation.x = -Math.atan2(rise * 1.05, 0.17 * size);

  const tie = new Group();
  tie.name = PART.tie;
  tie.add(knot, blade);
  return tie;
}

/** Thin golden reading glasses: two rings and a bridge, in front of the eyes. */
function buildGlasses(config: KalmanConfig, profile: readonly ProfilePoint[]): Group {
  const size = config.glassesSize;
  const frame = material({ colour: toColour({ r: 0.79, g: 0.64, b: 0.36 }), metal: true });
  const glasses = new Group();
  glasses.name = PART.glasses;

  const rings: Vector3[] = [];
  for (const side of [1, -1] as const) {
    const eye = eyePosition(profile, side);
    const outward = new Vector3(eye.x, 0, eye.z).normalize();
    const ring = new Mesh(new TorusGeometry(0.022 * size, 0.0032 * size, 4, 10), frame);
    ring.position.copy(eye).addScaledVector(outward, 0.012);
    ring.rotation.y = Math.atan2(outward.x, outward.z); // face the same way as the eye
    rings.push(ring.position.clone());
    glasses.add(ring);
  }

  const [right, left] = rings;
  if (right !== undefined && left !== undefined) {
    const width = right.distanceTo(left) - 0.044 * size;
    const bridge = new Mesh(new CylinderGeometry(0.0025, 0.0025, Math.max(width, 0.005), 4), frame);
    bridge.position.set(0, (right.y + left.y) / 2, Math.max(right.z, left.z) + 0.004);
    bridge.rotation.z = Math.PI / 2; // lying horizontally between the rings
    glasses.add(bridge);
  }
  return glasses;
}

/** Builds Kálmán from a config. Same config in, same model out. */
export function buildKalman(config: KalmanConfig): Group {
  const profile = silhouette(config);
  const kalman = new Group();
  kalman.name = 'kalman';
  kalman.add(
    buildBody(config, profile),
    buildBill(config, profile),
    buildEye(config, profile, 1),
    buildEye(config, profile, -1),
    buildFlipper(config, profile, 1),
    buildFlipper(config, profile, -1),
    buildFoot(config, 1),
    buildFoot(config, -1),
  );
  if (config.tieOn) kalman.add(buildTie(config, profile));
  if (config.glassesOn) kalman.add(buildGlasses(config, profile));
  return kalman;
}

/** Swings both flippers by `stroke` radians from their resting position (mirrored left and right). */
export function poseFlippers(kalman: Object3D, stroke: number): void {
  for (const name of [PART.flipperLeft, PART.flipperRight]) {
    const pivot = kalman.getObjectByName(name);
    const side = pivot?.userData['side'];
    if (pivot !== undefined && typeof side === 'number') {
      pivot.rotation.z = side * (FLIPPER_SPLAY + stroke);
    }
  }
}

/** Triangles and meshes in a model: the budget numbers (one mesh = one draw call here). */
export function modelStats(object: Object3D): { triangles: number; meshes: number } {
  let triangles = 0;
  let meshes = 0;
  object.traverse((child) => {
    if (child instanceof Mesh) {
      const geometry = child.geometry as BufferGeometry;
      const corners = geometry.index?.count ?? geometry.getAttribute('position').count;
      triangles += corners / 3;
      meshes += 1;
    }
  });
  return { triangles, meshes };
}

/** Frees the GPU memory of a model that is being replaced (the playground rebuilds often). */
export function disposeKalman(object: Object3D): void {
  object.traverse((child) => {
    if (child instanceof Mesh) {
      (child.geometry as BufferGeometry).dispose();
      const materials: unknown[] = Array.isArray(child.material)
        ? child.material
        : [child.material];
      for (const entry of materials) {
        if (entry instanceof MeshStandardMaterial) entry.dispose();
      }
    }
  });
}
