# Spec Delta

## MODIFIED Requirements

### Requirement: The rig is data
Kálmán's layers SHALL be described in one rig config: for each layer its name, image, position, pivot point, parent layer, drawing order, allowed rotation range, allowed stretch range and allowed shift. Changing the look or the position of a layer SHALL need a change to the config or the image only, not to code.

#### Scenario: Swapping a layer image
- **WHEN** a layer image is replaced by a new illustration and the rig config points to it
- **THEN** the figure shows the illustration, with no code changed

### Requirement: Poses are data
Named poses SHALL be stored as data per figure, each giving per-layer rotations, offsets and stretches relative to the rest position. Layers a pose does not mention SHALL stay at rest. The repo SHALL contain at least the front poses rest, bow, flippers up, head tilt left and head tilt right, and the side poses rest, stroke up, stroke down and dive.

#### Scenario: Partial pose
- **WHEN** a pose mentions only the head
- **THEN** every other layer is at its rest position

#### Scenario: Poses per figure
- **WHEN** the poses in the repo are checked
- **THEN** every pose belongs to the front or the side figure and only names layers of that figure's rig

### Requirement: A pose stays within the rig's limits
A pose SHALL be rejected when it names a layer that is not in the rig, uses a value that is not a finite number, rotates a layer outside its allowed range, stretches a layer outside its allowed stretch range, or shifts a layer with an allowed shift further than that.

#### Scenario: Rotation out of range
- **WHEN** a pose rotates the head further than the head's allowed range
- **THEN** validation fails with a message naming the pose, the layer and the range

#### Scenario: Stretch out of range
- **WHEN** a pose stretches the body further than the body's allowed stretch range
- **THEN** validation fails with a message naming the pose, the layer and the range

#### Scenario: A layer that may not stretch
- **WHEN** a pose stretches a layer whose rig gives it no stretch range
- **THEN** validation fails with a message naming the pose and the layer

### Requirement: Joints don't show
At rest no seam SHALL be visible where two layers meet. The head SHALL blend into the neck, so tilting it within its range or nodding shows no hard edge, and a turning flipper SHALL NOT leave or take along a strip of the body. Squashing or stretching a layer within its range SHALL NOT open a gap where it meets its parent or children.

#### Scenario: Flippers up
- **WHEN** both flippers are raised
- **THEN** no line of the flipper's edge stays behind on the body, and no line of the body moves with the flippers

#### Scenario: Head tilt
- **WHEN** the head is tilted to the end of its range
- **THEN** the neck shows no hard straight edge

#### Scenario: Squashed body
- **WHEN** the body is squashed to the end of its stretch range
- **THEN** the head still sits on the neck and the flippers on the shoulders, with no gap between them and the body

### Requirement: The rig has Kálmán's parts
There SHALL be a rig for the front figure, one for the side figure and one for the swimming figure. The front rig SHALL contain exactly these layers: body, head, left flipper, right flipper, left foot, right foot, tail, tie, glasses, goofy pupils and professional pupils. The side rig SHALL contain exactly these layers: body, head, flipper, front foot, back foot, tail, tie and glasses (the far flipper is hidden behind the body). The swimming rig SHALL contain exactly these layers: body (with the head, the feet and the tail drawn in), flipper, tie and glasses. In each rig the body SHALL be the only layer without a parent.

#### Scenario: Layer set
- **WHEN** the rig config in the repo is checked
- **THEN** the front rig has exactly its eleven layers, the side rig exactly its eight, the swimming rig exactly its four, and in each the body is the only one without a parent

### Requirement: The professional accessories can be shown or hidden
The tie, the glasses and the professional pupils SHALL be shown only when Kálmán is in his professional mood and hidden otherwise, and the goofy pupils only in his goofy mood, independent of the pose.

#### Scenario: Professional mood
- **WHEN** the figure is switched to the professional mood
- **THEN** the tie, the glasses and the professional pupils are visible, the goofy pupils are not, and the pose of the other layers does not change

#### Scenario: Goofy mood
- **WHEN** the figure is in the goofy mood
- **THEN** the tie, the glasses and the professional pupils are not visible, and the goofy pupils are

## ADDED Requirements

### Requirement: A layer can squash and stretch
A pose SHALL be able to stretch a layer around its pivot: a stretch above 1 makes the layer taller and thinner, below 1 shorter and wider, in its own upright direction, keeping its area the same. A stretch of 1, or none, SHALL leave the layer as it is. A layer whose rig gives no stretch range SHALL NOT stretch.

#### Scenario: Squashing the body
- **WHEN** a pose gives the body a stretch of 0.9
- **THEN** the body is drawn 10% shorter and correspondingly wider, with its pivot in the same place

#### Scenario: No stretch
- **WHEN** a pose leaves out the stretch of a layer
- **THEN** that layer is drawn at its normal size

### Requirement: Children follow their parent's stretch
When a layer squashes or stretches, the layers that hang from it SHALL move with it, so each child stays attached at the point where it joins its parent.

#### Scenario: Head on a squashed body
- **WHEN** the body is squashed
- **THEN** the head moves down with the top of the body and its pivot stays on the neck

### Requirement: Drawn poses come from the design images
A drawn pose SHALL be cut by the cutting script from Raymond's design images, in a goofy and a professional version, and placed so that it stands on the same ground line and centre line as the front figure. The script SHALL stop with a message when a drawn pose's professional image is not the same size as its goofy one.

#### Scenario: The drawn bow in place
- **WHEN** the drawn-pose config in the repo is checked
- **THEN** the bow has a goofy and a professional image, both cut from the design images, and its feet stand on the front figure's ground line

#### Scenario: Mismatched bow images
- **WHEN** the professional bow image is not the same size as the goofy one
- **THEN** the script stops with a message instead of writing the drawn pose

### Requirement: A layer's shift can be limited
The rig SHALL be able to give a layer an allowed shift: how far its offset may go from rest, sideways and up or down. A pose SHALL never move such a layer further, so a pupil always stays inside its eye.

#### Scenario: Pupil at the edge
- **WHEN** a pose shifts the goofy pupils further to the right than their allowed shift
- **THEN** validation fails with a message naming the pose, the layer and the allowed shift

### Requirement: The pupils come from images without pupils
The front figure's head and its professional eyes SHALL be cut from Raymond's edits of the goofy and professional front views without pupils, and the pupils from where the front views differ from those edits, so the eyes under a moving pupil are painted, not a copy of the pupil.

#### Scenario: A moving pupil
- **WHEN** the pupils are shifted to the end of their allowed shift, in either mood
- **THEN** where they were at rest the eye shows painted white, not a copy of the pupil

### Requirement: Feet can stay on the ground
A pose SHALL be able to plant the feet, by an amount from 0 to 1: at 1 the feet stay where they stand at rest, on the ground, while the body above them sinks, rises, leans or squashes (his knees, which are hidden in his body, bend); at 0 they move with the body as before; in between they follow the body partly. Between keyframes the amount blends like any other value. A foot's own rotation SHALL still apply when it is planted.

#### Scenario: Crouching on planted feet
- **WHEN** a pose lowers and squashes the side body with the feet planted at 1
- **THEN** the feet are exactly where they are at rest, and the body is lower

#### Scenario: Feet that leave the ground
- **WHEN** a pose lifts the body with the feet not planted
- **THEN** the feet move up with the body

### Requirement: The swimming figure comes from the design images
The swimming figure SHALL be cut by the cutting script from Raymond's drawing of Kálmán swimming horizontally (bill first, head in line with the body), its professional edit, and an edit without the near flipper: the body from the one without the flipper, the flipper along an outline traced once, and the tie and the glasses from where the professional edit differs.

#### Scenario: A stroking flipper
- **WHEN** the swimming figure's flipper is turned to the end of its range
- **THEN** the body where the flipper was at rest shows painted body, not a copy of the flipper
