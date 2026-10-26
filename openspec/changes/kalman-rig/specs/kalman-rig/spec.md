# Spec Delta

## Purpose

Defines Kálmán as a cut-out figure: which layers he is made of, how they hang together and move, which still poses he has, and how a pose becomes the figure on the page.

## ADDED Requirements

### Requirement: The rig is data
Kálmán's layers SHALL be described in one rig config: for each layer its name, image, position, pivot point, parent layer, drawing order and allowed rotation range. Changing the look or the position of a layer SHALL need a change to the config or the image only, not to code.

#### Scenario: Swapping a layer image
- **WHEN** a placeholder image is replaced by an illustration and the rig config points to it
- **THEN** the figure shows the illustration, with no code changed

### Requirement: The rig has Kálmán's parts
The rig SHALL contain exactly these layers: body, head, left flipper, right flipper, left foot, right foot, tail, tie and glasses. The body SHALL be the only layer without a parent.

#### Scenario: Layer set
- **WHEN** the rig config in the repo is checked
- **THEN** it has exactly those nine layers and the body is the only one without a parent

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
Named poses SHALL be stored as data, each giving per-layer rotations and offsets relative to the rest position. Layers a pose does not mention SHALL stay at rest. The repo SHALL contain at least the poses rest, bow, flippers up, head tilt left and head tilt right.

#### Scenario: Partial pose
- **WHEN** a pose mentions only the head
- **THEN** every other layer is at its rest position

### Requirement: A pose stays within the rig's limits
A pose SHALL be rejected when it names a layer that is not in the rig, uses a value that is not a finite number, or rotates a layer outside its allowed range.

#### Scenario: Rotation out of range
- **WHEN** a pose rotates the head further than the head's allowed range
- **THEN** validation fails with a message naming the pose, the layer and the range

### Requirement: The professional accessories can be shown or hidden
The tie and the glasses SHALL be shown only when Kálmán is in his professional mood and hidden otherwise, independent of the pose.

#### Scenario: Professional mood
- **WHEN** the figure is switched to the professional mood
- **THEN** the tie and the glasses are visible, and the pose of the other layers does not change

#### Scenario: Goofy mood
- **WHEN** the figure is in the goofy mood
- **THEN** the tie and the glasses are not visible

### Requirement: The figure is drawn without JavaScript
The figure SHALL be part of the page's HTML in the rest pose, so it shows when JavaScript is disabled or fails. Changing the pose SHALL NOT reload the page.

#### Scenario: JavaScript disabled
- **WHEN** a page with the figure is opened with JavaScript disabled
- **THEN** Kálmán is visible in the rest pose

### Requirement: Placeholder layers until the illustrations arrive
Until Raymond's illustrations are in, every layer SHALL have a placeholder image: a simple flat shape in the design sheet's colours, clearly not final art.

#### Scenario: Placeholders in place
- **WHEN** the rig config in the repo is checked
- **THEN** every layer points to an existing image file
