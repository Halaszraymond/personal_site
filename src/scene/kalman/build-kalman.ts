/**
 * Builds Kálmán as a Three.js object from a config.
 *
 * Every number comes from src/lib/kalman-shape.ts; this file only turns them into
 * meshes (shape + material). No renderer is involved, so it runs in Vitest under Node
 * and the playground and the future animated scene share exactly the same Kálmán.
 *
 * Two looks, chosen by the `facetedLook` switch:
 * - smooth (default, after Raymond's turnaround sheet): many faces, soft shading, and
 *   colours that blend between the corners of each face;
 * - faceted (low-poly): few faces, each lit as one flat surface with one flat colour.
 */
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
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
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import type { KalmanConfig } from '../../lib/kalman-config';
import {
  bellyFactor,
  billStripeColour,
  bodyColourAt,
  CHEEK_INDEX,
  facetSegments,
  flipperPivotRadius,
  flipperSplay,
  headDepthScale,
  NECK_INDEX,
  PLUMAGE,
  pointAt,
  postureShift,
  profileSteps,
  radiusAtHeight,
  SHOULDER_INDEX,
  silhouette,
  smoothProfile,
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
  tail: 'tail',
  tie: 'tie',
  glasses: 'glasses',
} as const;

/** Everything the part builders need to know, computed once per build. */
interface Build {
  config: KalmanConfig;
  /** The coarse silhouette: heights and radii of the 15 design points. */
  profile: readonly ProfilePoint[];
  faceted: boolean;
}

/**
 * A Three.js colour from an sRGB colour (the values you see on screen).
 * Three.js works in linear light internally, so it converts; without this,
 * the dark plumage would render as a washed-out grey.
 */
function toColour({ r, g, b }: Rgb): Color {
  return new Color().setRGB(r, g, b, SRGBColorSpace);
}

/** A material in the current look; with `vertexColours` the colours come from the geometry. */
function material(
  build: Build,
  options: { colour?: Color; vertexColours?: boolean; metal?: boolean },
) {
  const { colour, vertexColours = false, metal = false } = options;
  return new MeshStandardMaterial({
    color: colour ?? 0xffffff,
    vertexColors: vertexColours,
    flatShading: build.faceted,
    roughness: metal ? 0.3 : 0.75,
    metalness: metal ? 0.8 : 0,
  });
}

/**
 * Moves a point from the plain spun shape to Kálmán's real shape: the belly pushed
 * forward, the head stretched into the bill, and the head and neck slightly forward.
 * Used for the body itself and for everything placed on it (eyes, bill, tie, glasses).
 */
function deform(build: Build, x: number, y: number, z: number): Vector3 {
  const u = uAtHeight(build.profile, y);
  const angle = Math.atan2(x, z);
  const belly = bellyFactor(u, angle, build.config.bellyRoundness);
  return new Vector3(x * belly, y, z * belly * headDepthScale(u) + postureShift(u));
}

/** A point on the body surface at height `y` and `angle` from the front, `out` above it. */
function onSurface(build: Build, y: number, angle: number, out = 0): Vector3 {
  const radius = radiusAtHeight(build.profile, y) + out;
  return deform(build, Math.sin(angle) * radius, y, Math.cos(angle) * radius);
}

/** Writes one colour per vertex, chosen by `colourOf` from the vertex position. */
function colourVertices(geometry: BufferGeometry, colourOf: (point: Vector3) => Rgb): void {
  const positions = geometry.getAttribute('position');
  const colours = new Float32Array(positions.count * 3);
  const point = new Vector3();
  for (let index = 0; index < positions.count; index++) {
    point.fromBufferAttribute(positions, index);
    const { r, g, b } = toColour(colourOf(point));
    colours.set([r, g, b], index * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
}

/**
 * Gives every facet of a non-indexed lathe one colour, chosen from its centre. A lathe's
 * facets are quads made of two consecutive triangles; colouring them as a pair keeps each
 * facet one colour (one triangle at a time gave a saw-tooth edge on the belly).
 */
function colourFacets(geometry: BufferGeometry, colourOf: (centre: Vector3) => Rgb): void {
  const corners = 6;
  const positions = geometry.getAttribute('position');
  const colours = new Float32Array(positions.count * 3);
  const centre = new Vector3();
  const corner = new Vector3();
  for (let first = 0; first < positions.count; first += corners) {
    const count = Math.min(corners, positions.count - first);
    centre.set(0, 0, 0);
    for (let offset = 0; offset < count; offset++) {
      centre.add(corner.fromBufferAttribute(positions, first + offset).divideScalar(count));
    }
    const { r, g, b } = toColour(colourOf(centre));
    for (let offset = 0; offset < count; offset++) colours.set([r, g, b], (first + offset) * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
}

/**
 * Finishes a lathe in the current look. Smooth: corners are shared, so the shading and
 * colours blend; the duplicate corners on the seam are merged so it doesn't show.
 * Faceted: every triangle gets its own corners, so each facet is flat with one colour.
 */
function finishLathe(
  build: Build,
  lathe: BufferGeometry,
  colourOf: (p: Vector3) => Rgb,
  reshape?: (p: Vector3) => Vector3,
) {
  let geometry: BufferGeometry;
  if (build.faceted) {
    geometry = lathe.toNonIndexed();
    colourFacets(geometry, colourOf);
  } else {
    lathe.deleteAttribute('uv'); // texture coordinates differ on the seam and would block merging
    lathe.deleteAttribute('normal');
    geometry = mergeVertices(lathe);
    colourVertices(geometry, colourOf);
  }
  lathe.dispose();

  // Colours are chosen on the plain spun shape (so they follow the design's regions);
  // only then does every corner move to its final place.
  if (reshape !== undefined) {
    const positions = geometry.getAttribute('position');
    const point = new Vector3();
    for (let index = 0; index < positions.count; index++) {
      const moved = reshape(point.fromBufferAttribute(positions, index));
      positions.setXYZ(index, moved.x, moved.y, moved.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Body and head as one lathe, deformed into Kálmán's posture and coloured. */
function buildBody(build: Build): Mesh {
  const { config, faceted } = build;
  const points = smoothProfile(build.profile, profileSteps(config.faceting, faceted));
  // Start the spin at the back (π), so the lathe's seam sits where nobody looks.
  const lathe = new LatheGeometry(
    points.map((point) => new Vector2(point.radius, point.y)),
    facetSegments(config.faceting, faceted),
    Math.PI,
  );

  const geometry = finishLathe(
    build,
    lathe,
    (point) =>
      bodyColourAt(uAtHeight(build.profile, point.y), Math.atan2(point.x, point.z), config),
    (point) => deform(build, point.x, point.y, point.z),
  );
  const mesh = new Mesh(geometry, material(build, { vertexColours: true }));
  mesh.name = PART.body;
  return mesh;
}

/** The long, slender bill: dark on top, the orange-to-pink stripe on the lower mandible. */
function buildBill(build: Build): Mesh {
  const { config, faceted } = build;
  const length = 0.24 * config.billLength;
  const base = 0.034 * config.billThickness;
  const lathe = new LatheGeometry(
    [
      new Vector2(0, 0),
      new Vector2(base, 0.002),
      new Vector2(base * 0.85, length * 0.3),
      new Vector2(base * 0.5, length * 0.72),
      new Vector2(base * 0.15, length * 0.97),
      new Vector2(0, length),
    ],
    faceted ? 6 : 12,
  );
  lathe.rotateX(Math.PI / 2); // along +y → along +z: pointing forward

  // A gentle downward curve towards the tip, stronger with more droop.
  const positions = lathe.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const t = Math.max(0, positions.getZ(index)) / length;
    positions.setY(index, positions.getY(index) - 0.35 * config.billDroop * length * t * t);
  }
  // The stripe: the lower half of the bill, judged by height relative to the curved centre.
  const geometry = finishLathe(build, lathe, (point) => {
    const t = Math.max(0, point.z) / length;
    const centre = -0.35 * config.billDroop * length * t * t;
    return point.y < centre - base * 0.2 ? billStripeColour(t) : PLUMAGE.billDark;
  });

  const cheek = pointAt(build.profile, CHEEK_INDEX);
  const mesh = new Mesh(geometry, material(build, { vertexColours: true }));
  mesh.name = PART.bill;
  // The base sits just inside the front of the face, so no seam shows.
  mesh.position.copy(onSurface(build, cheek.y + 0.012 * config.headSize, 0, -0.022));
  mesh.rotation.x = 0.16; // tilted slightly down, as in the side view
  return mesh;
}

/** Where an eye sits, for one side (+1 right, −1 left): on the side of the head, above the bill. */
function eyePosition(build: Build, side: 1 | -1): Vector3 {
  const cheek = pointAt(build.profile, CHEEK_INDEX);
  const above = pointAt(build.profile, CHEEK_INDEX + 1);
  return onSurface(build, cheek.y + (above.y - cheek.y) * 0.85, 0.85 * side, -0.003);
}

/** A small dark eye with a tiny highlight, as in the turnaround sheet. */
function buildEye(build: Build, side: 1 | -1): Mesh {
  const radius = 0.0135 * build.config.headSize;
  const geometry = new IcosahedronGeometry(radius, build.faceted ? 0 : 1);
  // The highlight: the part of the eye that faces up, forward and outward.
  const light = new Vector3(0.45 * side, 0.55, 0.7).normalize();
  colourVertices(geometry, (point) =>
    point.clone().normalize().dot(light) > 0.82 ? PLUMAGE.eyeHighlight : PLUMAGE.eye,
  );
  const mesh = new Mesh(geometry, material(build, { vertexColours: true }));
  mesh.name = side === 1 ? 'eye-right' : 'eye-left';
  mesh.position.copy(eyePosition(build, side));
  return mesh;
}

/**
 * A long flipper hanging from the shoulder: dark outside, the pale edge on the side that
 * faces the body. The mesh sits in a pivot object at the shoulder, so rotating the pivot
 * swings the whole flipper, as the swim preview does.
 */
function buildFlipper(build: Build, side: 1 | -1) {
  const scale = build.config.flipperLength;
  const length = 0.44 * scale;
  const outline = new Shape();
  outline.moveTo(0, 0);
  outline.lineTo(0.05 * scale, -0.03 * scale);
  outline.lineTo(0.065 * scale, -0.2 * scale);
  outline.lineTo(0.045 * scale, -0.36 * scale);
  outline.lineTo(0.012 * scale, -length);
  outline.lineTo(-0.012 * scale, -0.36 * scale);
  outline.lineTo(-0.02 * scale, -0.08 * scale);
  outline.closePath();

  const shape = new ExtrudeGeometry(outline, {
    depth: 0.016,
    bevelEnabled: !build.faceted, // soft edges in the smooth look
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 1,
  });
  shape.translate(0, 0, -0.008);
  shape.rotateY(Math.PI / 2); // flat against the side of the body
  shape.computeVertexNormals();
  // The inner side (facing the body) is pale; ExtrudeGeometry has one corner set per
  // triangle, so each face is coloured by the way it faces.
  const normals = shape.getAttribute('normal');
  colourVertices(shape, () => PLUMAGE.dark);
  const colours = shape.getAttribute('color');
  const pale = toColour(PLUMAGE.flipperEdge);
  for (let index = 0; index < normals.count; index++) {
    if (normals.getX(index) * side < -0.5) colours.setXYZ(index, pale.r, pale.g, pale.b);
  }

  const blade = new Mesh(shape, material(build, { vertexColours: true }));
  // Turn the flat side a little to the front, so the flipper reads as a flipper, not a stick.
  blade.rotation.y = -side * 0.35;

  const shoulder = pointAt(build.profile, SHOULDER_INDEX);
  // Swing out just far enough to clear the belly, which is wider than the shoulders.
  const splay = flipperSplay(build.profile, length);
  const pivot = new Group();
  pivot.name = side === 1 ? PART.flipperRight : PART.flipperLeft;
  pivot.userData['side'] = side;
  pivot.userData['splay'] = splay;
  pivot.position.set(side * flipperPivotRadius(build.profile), shoulder.y, -0.02);
  pivot.rotation.z = side * splay;
  pivot.add(blade);
  return pivot;
}

/** A large slate-grey foot at the front of the body. */
function buildFoot(build: Build, side: 1 | -1): Mesh {
  const girth = build.config.bodyGirth;
  const geometry = new IcosahedronGeometry(0.06, build.faceted ? 0 : 1);
  geometry.scale(1.1, 0.32, 1.6);
  const mesh = new Mesh(geometry, material(build, { colour: toColour(PLUMAGE.feet) }));
  mesh.name = side === 1 ? 'foot-right' : 'foot-left';
  mesh.position.set(side * 0.085 * girth, 0.016, 0.11 * girth);
  mesh.rotation.y = side * 0.25; // toes pointing slightly outward
  return mesh;
}

/** The short pointed tail at the back, reaching down to the ground. */
function buildTail(build: Build): Mesh {
  const geometry = new ConeGeometry(0.055 * build.config.bodyGirth, 0.16, build.faceted ? 6 : 14);
  const mesh = new Mesh(geometry, material(build, { colour: toColour(PLUMAGE.dark) }));
  mesh.name = PART.tail;
  // Point the cone's tip backwards and down.
  const direction = new Vector3(0, -0.5, -0.87).normalize();
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
  const root = onSurface(build, 0.09, Math.PI, -0.03);
  mesh.position.copy(root).addScaledVector(direction, 0.08);
  return mesh;
}

/** The tie of his professional side: a band around the neck, a knot and a long blade. */
function buildTie(build: Build): Group {
  const size = build.config.tieSize;
  const tieMaterial = material(build, { colour: new Color(build.config.tieColour) });
  const neck = pointAt(build.profile, NECK_INDEX);
  const knotY = neck.y - 0.035 * size;
  const knotFront = onSurface(build, knotY, 0, 0.006);

  // The band around the neck: a ring, squeezed to the neck's depth and shifted with the posture.
  const neckRadius = radiusAtHeight(build.profile, knotY) + 0.006;
  const band = new Mesh(
    new TorusGeometry(neckRadius, 0.009 * size, build.faceted ? 4 : 6, build.faceted ? 12 : 24),
    tieMaterial,
  );
  band.rotation.x = Math.PI / 2; // lying horizontally around the neck
  band.position.set(0, knotY, postureShift(uAtHeight(build.profile, knotY)));

  const knot = new Mesh(new BoxGeometry(0.036 * size, 0.032 * size, 0.02 * size), tieMaterial);
  knot.position.copy(knotFront);

  const outline = new Shape();
  outline.moveTo(-0.016 * size, 0);
  outline.lineTo(0.016 * size, 0);
  outline.lineTo(0.03 * size, -0.2 * size);
  outline.lineTo(0, -0.25 * size);
  outline.lineTo(-0.03 * size, -0.2 * size);
  outline.closePath();
  const blade = new Mesh(
    new ExtrudeGeometry(outline, { depth: 0.008, bevelEnabled: false, curveSegments: 1 }),
    tieMaterial,
  );
  // Lay the blade on the chest: from just below the knot, leaning out as the belly widens.
  const top = onSurface(build, knotY - 0.016 * size, 0, 0.004);
  const bottom = onSurface(build, knotY - 0.25 * size, 0, 0.004);
  blade.position.copy(top);
  blade.rotation.x = -Math.atan2(bottom.z - top.z, top.y - bottom.y);

  const tie = new Group();
  tie.name = PART.tie;
  tie.add(band, knot, blade);
  return tie;
}

/** Round silver reading glasses: two rings, a bridge, and arms running back to the ears. */
function buildGlasses(build: Build): Group {
  const size = build.config.glassesSize;
  const frame = material(build, { colour: toColour({ r: 0.78, g: 0.8, b: 0.83 }), metal: true });
  const glasses = new Group();
  glasses.name = PART.glasses;
  const ringRadius = 0.025 * size;

  const rings: Vector3[] = [];
  for (const side of [1, -1] as const) {
    const eye = eyePosition(build, side);
    const outward = new Vector3(eye.x, 0, eye.z - postureShift(1)).normalize();
    const ring = new Mesh(
      new TorusGeometry(ringRadius, 0.0028 * size, build.faceted ? 4 : 6, build.faceted ? 10 : 20),
      frame,
    );
    ring.position.copy(eye).addScaledVector(outward, 0.014);
    ring.rotation.y = Math.atan2(outward.x, outward.z); // face the same way as the eye
    rings.push(ring.position.clone());
    glasses.add(ring);

    // The arm: from the ring's outer edge back along the side of the head.
    const start = ring.position
      .clone()
      .add(new Vector3(side * ringRadius * 0.8, 0, -ringRadius * 0.4));
    const end = onSurface(build, eye.y, side * 1.9, 0.004);
    const arm = new Mesh(new CylinderGeometry(0.0022, 0.0022, start.distanceTo(end), 4), frame);
    arm.position.copy(start).add(end).multiplyScalar(0.5);
    arm.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), end.clone().sub(start).normalize());
    glasses.add(arm);
  }

  const [right, left] = rings;
  if (right !== undefined && left !== undefined) {
    const width = Math.max(right.distanceTo(left) - 2 * ringRadius, 0.005);
    const bridge = new Mesh(new CylinderGeometry(0.0025, 0.0025, width, 4), frame);
    bridge.position.set(0, (right.y + left.y) / 2 + 0.004, Math.max(right.z, left.z) + 0.004);
    bridge.rotation.z = Math.PI / 2; // lying horizontally between the rings
    glasses.add(bridge);
  }
  return glasses;
}

/** Builds Kálmán from a config. Same config in, same model out. */
export function buildKalman(config: KalmanConfig): Group {
  const build: Build = { config, profile: silhouette(config), faceted: config.facetedLook };
  const kalman = new Group();
  kalman.name = 'kalman';
  kalman.add(
    buildBody(build),
    buildBill(build),
    buildEye(build, 1),
    buildEye(build, -1),
    buildFlipper(build, 1),
    buildFlipper(build, -1),
    buildFoot(build, 1),
    buildFoot(build, -1),
    buildTail(build),
  );
  if (config.tieOn) kalman.add(buildTie(build));
  if (config.glassesOn) kalman.add(buildGlasses(build));
  return kalman;
}

/** Swings both flippers by `stroke` radians from their resting position (mirrored left and right). */
export function poseFlippers(kalman: Object3D, stroke: number): void {
  for (const name of [PART.flipperLeft, PART.flipperRight]) {
    const pivot = kalman.getObjectByName(name);
    const side = pivot?.userData['side'];
    const splay = pivot?.userData['splay'];
    if (pivot !== undefined && typeof side === 'number' && typeof splay === 'number') {
      pivot.rotation.z = side * (splay + stroke);
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
