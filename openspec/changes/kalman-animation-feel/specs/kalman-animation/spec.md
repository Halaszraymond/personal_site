# Spec Delta

## MODIFIED Requirements

### Requirement: Animations are data
Each animation SHALL be stored as data: a name, a label, the figure it uses (front or side), whether it loops, a list of keyframes, each a pose of that figure at a moment in time with an easing towards the next keyframe, and optionally a lag per layer. The repo SHALL contain the animations idle, bow, head-follow, dive, swim and launch.

#### Scenario: Animations in the repo
- **WHEN** the animation data in the repo is checked
- **THEN** it is valid and contains idle, bow, head-follow, dive, swim and launch

### Requirement: An invalid animation is rejected
An animation SHALL be rejected, with a message naming the animation and the problem, when its first keyframe is not at time 0, its keyframes are not in increasing time order, a keyframe names a pose that its figure does not have, it names an unknown easing, or it gives a lag that is negative, not a number, or for a layer its figure does not have.

#### Scenario: Keyframes out of order
- **WHEN** an animation has a keyframe at 1 second followed by one at 0.5 seconds
- **THEN** validation fails with a message naming the animation and the two keyframes

#### Scenario: Unknown pose
- **WHEN** a side-figure animation names a pose that only the front figure has
- **THEN** validation fails with a message naming the animation and the pose

#### Scenario: Lag for an unknown layer
- **WHEN** a front-figure animation gives a lag to a layer only the side figure has
- **THEN** validation fails with a message naming the animation and the layer

### Requirement: Poses blend smoothly between keyframes
At any moment between two keyframes, every layer's rotation, offset and stretch SHALL follow the keyframe's easing from its value in the first pose to its value in the second; at a keyframe's own moment the figure SHALL be exactly in that keyframe's pose. An easing MAY overshoot its target and settle back, but a blended pose SHALL never turn or stretch a layer outside its allowed range.

#### Scenario: Halfway with linear easing
- **WHEN** an animation with linear easing goes from a pose with the head at 0 degrees to one with the head at 20 degrees, and is sampled halfway
- **THEN** the head is at 10 degrees

#### Scenario: Exactly at a keyframe
- **WHEN** an animation is sampled at the moment of a keyframe
- **THEN** the figure is exactly in that keyframe's pose

#### Scenario: Overshoot near the end of a range
- **WHEN** an overshooting easing moves a layer towards the end of its rotation range
- **THEN** the layer goes no further than the end of its range

### Requirement: Playback ends where it should
An animation that does not loop SHALL end with Kálmán back at rest, once every lagging layer has caught up; a looping animation SHALL repeat until it is stopped, without a jump where it starts again. Starting an animation SHALL stop the one that was playing.

#### Scenario: Bow ends at rest
- **WHEN** the bow animation has played to the end
- **THEN** Kálmán is in his rest pose

#### Scenario: Starting another animation
- **WHEN** the swim animation is playing and the bow animation is started
- **THEN** swimming stops and the bow plays

#### Scenario: Lagging layers settle
- **WHEN** the dive animation's last keyframe has passed but its tail is still catching up
- **THEN** the animation keeps playing until the tail is at rest too, and only then counts as finished

## ADDED Requirements

### Requirement: Layers can trail behind
An animation SHALL be able to give a layer a lag in seconds: that layer then shows the pose the animation had that much earlier, so it starts, stops and settles a moment after the others. A layer without a lag SHALL follow the keyframes exactly. In a looping animation a lagging layer SHALL continue from the end of the loop into its start.

#### Scenario: A trailing tail
- **WHEN** the dive gives the tail a lag of 0.1 seconds and is sampled at 1.0 second
- **THEN** the tail is where the dive puts it at 0.9 seconds, and the body is where the dive puts it at 1.0 second

#### Scenario: Lag in a loop
- **WHEN** a looping animation gives a layer a lag and is sampled just after its start
- **THEN** that layer shows the end of the previous loop, not the first keyframe held still

### Requirement: The bow is a deep bow
The bow SHALL use the front figure and read as a real bow from the front: at its deepest, the head is lowered well into the shoulders, the body squashes, and the flippers spread outwards. It SHALL rise slightly before bending, and settle with a small overshoot as he comes back up.

#### Scenario: The deepest moment
- **WHEN** the bow is held at its deepest moment
- **THEN** the head is lowered by at least a quarter of its own height, the body is squashed and both flippers are turned outwards

### Requirement: The dive moves like a dive
The dive SHALL show anticipation, an arc and follow-through: he crouches and squashes before he jumps, rises a little before he falls, stretches while he dives, and his head leads while his tail and feet trail behind and settle after his body.

#### Scenario: Crouch before the jump
- **WHEN** the dive is held at the end of its crouch
- **THEN** the body is lower than at rest and squashed

#### Scenario: Rising before the fall
- **WHEN** the dive is sampled just after the jump
- **THEN** the body is higher than at rest before it moves down

#### Scenario: Stretched in flight
- **WHEN** the dive is held halfway through the fall
- **THEN** the body is stretched, and the tail and feet are behind the body's movement
