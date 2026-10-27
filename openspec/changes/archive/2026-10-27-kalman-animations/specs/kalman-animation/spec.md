# Spec Delta

## Purpose

Kálmán's animations: which ones he has, how they are stored as data, how they blend his poses over time and follow the pointer, and how playback respects the visitor.

## ADDED Requirements

### Requirement: Animations are data
Each animation SHALL be stored as data: a name, a label, the figure it uses (front or side), whether it loops, and a list of keyframes, each a pose of that figure at a moment in time with an easing towards the next keyframe. The repo SHALL contain the animations idle, bow, head-follow, dive, swim and launch.

#### Scenario: Animations in the repo
- **WHEN** the animation data in the repo is checked
- **THEN** it is valid and contains idle, bow, head-follow, dive, swim and launch

### Requirement: An invalid animation is rejected
An animation SHALL be rejected, with a message naming the animation and the problem, when its first keyframe is not at time 0, its keyframes are not in increasing time order, a keyframe names a pose that its figure does not have, or it names an unknown easing.

#### Scenario: Keyframes out of order
- **WHEN** an animation has a keyframe at 1 second followed by one at 0.5 seconds
- **THEN** validation fails with a message naming the animation and the two keyframes

#### Scenario: Unknown pose
- **WHEN** a side-figure animation names a pose that only the front figure has
- **THEN** validation fails with a message naming the animation and the pose

### Requirement: Poses blend smoothly between keyframes
At any moment between two keyframes, every layer's rotation and offset SHALL lie between its values in the two keyframes' poses, following the keyframe's easing; at a keyframe's own moment the figure SHALL be exactly in that keyframe's pose. A blended pose SHALL never turn a layer outside its allowed range.

#### Scenario: Halfway with linear easing
- **WHEN** an animation with linear easing goes from a pose with the head at 0 degrees to one with the head at 20 degrees, and is sampled halfway
- **THEN** the head is at 10 degrees

#### Scenario: Exactly at a keyframe
- **WHEN** an animation is sampled at the moment of a keyframe
- **THEN** the figure is exactly in that keyframe's pose

### Requirement: The head follows a point
For head-follow, the front figure's head SHALL turn towards a given point (such as the pointer) within its allowed range: the further to the side the point is from the head, the further the head turns, up to the end of its range. Without a point, the head SHALL return to rest.

#### Scenario: Pointer far to the right
- **WHEN** the point is far to the right of Kálmán's head
- **THEN** the head is turned to the right end of its range

#### Scenario: Pointer straight above the head
- **WHEN** the point is straight above the head
- **THEN** the head is not turned

### Requirement: The right figure for each animation
Idle, bow and head-follow SHALL use the front figure; dive, swim and launch SHALL use the side figure. While an animation plays, the figure SHALL show the layers of the figure it uses.

#### Scenario: Swimming from the side
- **WHEN** the swim animation plays
- **THEN** the side figure is shown and its flipper strokes

### Requirement: Playback ends where it should
An animation that does not loop SHALL end with Kálmán back at rest; a looping animation SHALL repeat until it is stopped. Starting an animation SHALL stop the one that was playing.

#### Scenario: Bow ends at rest
- **WHEN** the bow animation has played to the end
- **THEN** Kálmán is in his rest pose

#### Scenario: Starting another animation
- **WHEN** the swim animation is playing and the bow animation is started
- **THEN** swimming stops and the bow plays

### Requirement: Playback respects the visitor
With reduced motion requested, no animation SHALL start by itself; an animation SHALL only play when the visitor explicitly starts it. While the page is hidden (another tab, a minimised window), animations SHALL pause and continue when it is visible again.

#### Scenario: Reduced motion
- **WHEN** a page with Kálmán is opened with reduced motion requested
- **THEN** no animation plays until one is started explicitly

#### Scenario: Hidden tab
- **WHEN** the swim animation plays and the tab is hidden
- **THEN** the animation does not advance until the tab is visible again
