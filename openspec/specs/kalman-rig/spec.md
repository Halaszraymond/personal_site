# kalman-rig Specification

## Purpose

Defines Kálmán as a cut-out figure: which layers he is made of and where they come from, how they hang together and move, which still poses he has, how a pose becomes the figure on the page, and the drawn views that let him be turned around.

## Requirements

### Requirement: The rig is data
Kálmán's layers SHALL be described in one rig config: for each layer its name, image, position, pivot point, parent layer, drawing order, allowed rotation range, allowed stretch range and allowed shift. Changing the look or the position of a layer SHALL need a change to the config or the image only, not to code.

#### Scenario: Swapping a layer image
- **WHEN** a layer image is replaced by a new illustration and the rig config points to it
- **THEN** the figure shows the illustration, with no code changed

### Requirement: The rig has Kálmán's parts
There SHALL be a rig for the front figure, one for the side figure and one for the swimming figure. The front rig SHALL contain exactly these layers: body, head, left flipper, right flipper, left foot, right foot, tail, tie, glasses, goofy pupils and professional pupils. The side rig SHALL contain exactly these layers: body, head, flipper, front foot, back foot, tail, tie and glasses (the far flipper is hidden behind the body). The swimming rig SHALL contain exactly these layers: body (with the head, the feet and the tail drawn in), flipper, tie and glasses. In each rig the body SHALL be the only layer without a parent.

#### Scenario: Layer set
- **WHEN** the rig config in the repo is checked
- **THEN** the front rig has exactly its eleven layers, the side rig exactly its eight, the swimming rig exactly its four, and in each the body is the only one without a parent

### Requirement: An invalid rig fails the build checks
A rig config SHALL be rejected, with a message naming the problem, when a layer name is repeated, a parent does not exist, the parents form a loop, two layers share a drawing order, an image file does not exist, or a rotation range is empty or inverted.

#### Scenario: Unknown parent
- **WHEN** a layer names a parent that is not in the rig
- **THEN** validation fails with a message naming that layer and the missing parent

#### Scenario: Parent loop
- **WHEN** two layers name each other as parent
- **THEN** validation fails with a message naming the loop

### Requirement: A layer turns around its own pivot
Rotating a layer SHALL turn it around its pivot point, so the pivot stays where it is and the rest of the layer moves around it.

#### Scenario: Flipper rotation
- **WHEN** the left flipper is rotated by 30 degrees
- **THEN** its pivot (the shoulder) is in the same place as at rest

### Requirement: Child layers follow their parent
When a layer moves or rotates, every layer that hangs from it, directly or through other layers, SHALL move with it as if attached.

#### Scenario: Glasses follow the head
- **WHEN** the head is tilted
- **THEN** the glasses tilt and move with it and stay in the same place relative to the head

### Requirement: Drawing order is independent of the hierarchy
Layers SHALL be drawn in the order the rig gives them, regardless of which layer they hang from, so a part attached to the body can be drawn behind it.

#### Scenario: Far flipper behind the body
- **WHEN** a flipper has a lower drawing order than the body
- **THEN** it is drawn behind the body even though it hangs from the body

### Requirement: Poses are data
Named poses SHALL be stored as data per figure, each giving per-layer rotations, offsets and stretches relative to the rest position. Layers a pose does not mention SHALL stay at rest. The repo SHALL contain at least the front poses rest, bow, flippers up, head tilt left and head tilt right, the side poses rest, crouch and dive, and the swimming poses rest, stroke up and stroke down.

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

### Requirement: The professional accessories can be shown or hidden
The tie, the glasses and the professional pupils SHALL be shown only when Kálmán is in his professional mood and hidden otherwise, and the goofy pupils only in his goofy mood, independent of the pose.

#### Scenario: Professional mood
- **WHEN** the figure is switched to the professional mood
- **THEN** the tie, the glasses and the professional pupils are visible, the goofy pupils are not, and the pose of the other layers does not change

#### Scenario: Goofy mood
- **WHEN** the figure is in the goofy mood
- **THEN** the tie, the glasses and the professional pupils are not visible, and the goofy pupils are

### Requirement: The figure is drawn without JavaScript
The figure SHALL be part of the page's HTML in the rest pose, so it shows when JavaScript is disabled or fails. Changing the pose SHALL NOT reload the page.

#### Scenario: JavaScript disabled
- **WHEN** a page with the figure is opened with JavaScript disabled
- **THEN** Kálmán is visible in the rest pose

### Requirement: Layers come from the design images
Every layer image SHALL be cut from Raymond's final-design images: the front figure from the goofy and professional front views, the side figure from the goofy and professional side views made for posing plus a side view without the near flipper. The body parts come from the goofy view (the side figure's body from the view without the flipper), the side flipper along an outline traced once on the goofy side view, and the tie and the glasses (with the calmer professional eyes) from where the professional view differs from the goofy one. The cutting SHALL be done by a script in the repo, so the same images always give the same layers.

#### Scenario: Layers in place
- **WHEN** the rig config in the repo is checked
- **THEN** every layer of both rigs points to an existing image cut from the final design

#### Scenario: Cutting again
- **WHEN** the cutting script is run again on the same images
- **THEN** it produces the same layer images and the same rig config

#### Scenario: A swinging flipper
- **WHEN** the side figure's flipper is turned to the end of its range
- **THEN** the body where the flipper was at rest shows painted body, not a copy of the flipper

#### Scenario: Images that don't line up
- **WHEN** a professional view is not the same size as its goofy view
- **THEN** the script stops with a message instead of producing misaligned accessories

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

### Requirement: The figure can turn as one piece
The whole figure SHALL be able to spin as one piece, by any angle, around the centre of the figure at rest. Spinning SHALL NOT change the pose.

#### Scenario: Spinning a pose
- **WHEN** the figure is in the flippers-up pose and is spun by 90 degrees
- **THEN** the whole figure is turned by 90 degrees around its centre and the flippers are still raised

### Requirement: Drawn views for turning around
The views for turning Kálmán around SHALL be stored as data: per view its name, the angle it shows him from (0 = front, 180 = back) and a placed image for each mood. The front view SHALL be the first. More views SHALL be addable as data only. Invalid views SHALL be rejected with a message naming the problem.

#### Scenario: Turntable data in the repo
- **WHEN** the turntable data in the repo is checked
- **THEN** it is valid, its first view is the front at 0 degrees, and every image it names exists

#### Scenario: A mirrored view
- **WHEN** the turntable data lists a view as the mirror image of another view at the opposite angle
- **THEN** that view shows the other view's drawing flipped left to right, so four drawn views give eight angles

#### Scenario: Two views at the same angle
- **WHEN** two views share an angle
- **THEN** validation fails with a message naming the view and the angle

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
A pose SHALL be able to plant the feet, by an amount from 0 (as before) to 1: a planted foot moves with the body, so it never comes loose, but never goes below the ground where it stands at rest. When the body sinks or leans the feet stay on the ground under it (his hidden knees bend); when it rises they come along. The amount blends between keyframes, and a foot's own rotation still applies.

#### Scenario: Crouching on planted feet
- **WHEN** a pose lowers and squashes the side body with the feet planted at 1
- **THEN** the feet stand on the ground where they stand at rest, and the body is lower

#### Scenario: Leaning on planted feet
- **WHEN** a pose leans the side body forward with the feet planted at 1
- **THEN** the feet stay attached to the body and their lowest point is on the ground

#### Scenario: Feet that leave the ground
- **WHEN** a pose lifts the body with the feet not planted
- **THEN** the feet move up with the body

### Requirement: The swimming figure comes from the design images
The swimming figure SHALL be cut by the cutting script from Raymond's drawing of Kálmán swimming horizontally (bill first, head in line with the body), its professional edit, and an edit without the near flipper: the body from the one without the flipper, the flipper along an outline traced once, and the tie and the glasses from where the professional edit differs.

#### Scenario: A stroking flipper
- **WHEN** the swimming figure's flipper is turned to the end of its range
- **THEN** the body where the flipper was at rest shows painted body, not a copy of the flipper
