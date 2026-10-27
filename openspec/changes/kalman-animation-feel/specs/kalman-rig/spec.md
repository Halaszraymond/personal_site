# Spec Delta

## MODIFIED Requirements

### Requirement: The rig is data
Kálmán's layers SHALL be described in one rig config: for each layer its name, image, position, pivot point, parent layer, drawing order, allowed rotation range and allowed stretch range. Changing the look or the position of a layer SHALL need a change to the config or the image only, not to code.

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
A pose SHALL be rejected when it names a layer that is not in the rig, uses a value that is not a finite number, rotates a layer outside its allowed range, or stretches a layer outside its allowed stretch range.

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
