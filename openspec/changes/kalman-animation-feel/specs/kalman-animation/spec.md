# Spec Delta

## MODIFIED Requirements

### Requirement: Animations are data
Each animation SHALL be stored as data: a name, a label, the figure it uses (front or side), whether it loops, a list of keyframes, each a pose of that figure at a moment in time with an easing towards the next keyframe and optionally a drawn pose to show instead of the layers, and optionally a lag per layer. The repo SHALL contain the animations idle, bow, head-follow, dive, swim and launch.

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

### Requirement: The head follows a point
For head-follow, the front figure's head SHALL turn towards a given point (such as the pointer) within its allowed range: the further to the side the point is from the head, the further the head turns, up to the end of its range. The pupils SHALL look towards the point as well, shifting within their allowed shift: sideways and up or down, further the further away the point is, and a moment ahead of the head. The body SHALL turn along a little, a moment after the head, so the head and the body move as one penguin. Without a point, the head, the pupils and the body SHALL return to rest.

#### Scenario: Pointer far to the right
- **WHEN** the point is far to the right of Kálmán's head
- **THEN** the head is turned to the right, the pupils are shifted to the right end of their allowed shift, and the body leans a little to the right as well

#### Scenario: Pointer straight above the head
- **WHEN** the point is straight above the head
- **THEN** the head is not turned, and the pupils look up without shifting sideways

#### Scenario: Pointer below and to the left
- **WHEN** the point is below and to the left of Kálmán's eyes
- **THEN** the pupils shift down and to the left

### Requirement: The right figure for each animation
Idle, bow and head-follow SHALL use the front figure; dive and launch SHALL use the side figure; swim SHALL use the swimming figure. While an animation plays, the figure SHALL show the layers of the figure it uses.

#### Scenario: Swimming from the side
- **WHEN** the swim animation plays
- **THEN** the swimming figure, seen from the side lying horizontally, is shown and its flipper strokes

## ADDED Requirements

### Requirement: Layers can trail behind
An animation SHALL be able to give a layer a lag in seconds: that layer then shows the pose the animation had that much earlier, so it starts, stops and settles a moment after the others. A layer without a lag SHALL follow the keyframes exactly. In a looping animation a lagging layer SHALL continue from the end of the loop into its start.

#### Scenario: A trailing tail
- **WHEN** the dive gives the tail a lag of 0.1 seconds and is sampled at 1.0 second
- **THEN** the tail is where the dive puts it at 0.9 seconds, and the body is where the dive puts it at 1.0 second

#### Scenario: Lag in a loop
- **WHEN** a looping animation gives a layer a lag and is sampled just after its start
- **THEN** that layer shows the end of the previous loop, not the first keyframe held still

### Requirement: An animation can show a drawn pose
A keyframe SHALL be able to name a drawn pose: a whole drawing of Kálmán in that pose, in the current mood, shown instead of his layers at that keyframe. Towards and away from such a keyframe the layers and the drawing SHALL cross-fade over a short time, so neither appears or disappears at once, and a moment of the cross-fade SHALL look the same whether it is played or scrubbed.

#### Scenario: Holding the drawn pose
- **WHEN** an animation is held at a keyframe that names a drawn pose
- **THEN** the drawing shows fully and the layers are hidden

#### Scenario: Halfway through the cross-fade
- **WHEN** an animation is held halfway through the cross-fade into a drawn pose
- **THEN** the layers and the drawing both show, and the figure is nowhere see-through

### Requirement: The bow is a deep, polite bow
The bow SHALL use the front figure and read as a polite, deep bow, like a butler welcoming a guest: the body stays almost upright, the head folds down until the bill points at the chest and the top of the head shows, and the flippers stay calmly at his sides. At its deepest moment it SHALL show the drawn bow and hold it briefly before he comes back up and settles.

#### Scenario: The deepest moment
- **WHEN** the bow is held at its deepest moment
- **THEN** the drawn bow shows in the current mood, standing on the same ground line as the layered figure

#### Scenario: On the way down
- **WHEN** the bow is held just before the cross-fade into the drawn bow
- **THEN** the head is lowered by at least a quarter of its own height and shorter than at rest, the body is barely turned, and the flippers are within a few degrees of rest

### Requirement: The bow folds smoothly
The bow's head SHALL fold down gradually: on the way down it gets shorter as it tips towards the viewer, and the drawn bow cross-fades in during the descent, not after it, so the fold never jumps from the face to the top of the head.

#### Scenario: Cross-fading while he bends
- **WHEN** the bow is sampled halfway through the cross-fade into the drawn bow
- **THEN** the head is still moving down, not yet at its deepest

### Requirement: The dive moves like a dive
The dive SHALL be a little goofy but natural: he leans forward with his flippers back, crouches on bent knees with his feet on the ground, pushes off, makes a small hop in which his flippers flail, and goes into the water face first, his head leading while his tail and feet trail behind.

#### Scenario: Crouch before the hop
- **WHEN** the dive is held at the end of its crouch
- **THEN** the body is leaning forward, lower than at rest and squashed, and the feet are planted on the ground

#### Scenario: The hop
- **WHEN** the dive is sampled just after the hop
- **THEN** the body is higher than at rest before it moves down, and the flippers are away from the body

#### Scenario: Face first
- **WHEN** the dive is held as he enters the water
- **THEN** the body is turned past horizontal so the head is lower than the tail, the body is stretched, and the tail and feet are behind the body's movement

### Requirement: The swim moves like a stroke
The swim SHALL be elegant: he swims as the swimming figure, horizontally like a torpedo with his bill forward, and each stroke moves him, the body surging forward and stretching slightly on the down stroke, pitching a little with it, and gliding on the up stroke, while the flipper follows a moment later. Once per loop he SHALL glance aside, as if at a passing fish, by tipping his whole body briefly, and then look ahead again.

#### Scenario: Horizontal
- **WHEN** the swim is held at any moment
- **THEN** the swimming figure is shown and its body is turned no more than a few degrees from its drawn, horizontal rest

#### Scenario: Surge on the down stroke
- **WHEN** the swim is sampled at the end of the down stroke and at the end of the up stroke
- **THEN** the body is further forward at the end of the down stroke, and stretched

#### Scenario: Trailing
- **WHEN** the swim plays
- **THEN** the flipper reaches each turning point of the stroke later than the body

#### Scenario: A glance at a fish
- **WHEN** the swim plays one whole loop
- **THEN** the body tips away from its swimming line once and returns

### Requirement: The launch is professional, the landing goofy
The launch SHALL be clean and powerful: he rises upright like a rocket with his flippers pressed to his body and stretched, then flies out at an angle with his feet trailing. The landing SHALL be goofy, as in Raymond's stills: he lands on his belly, slides forward a little, pushes himself up with his feet and flippers on bent knees, wobbles as if he almost loses his balance, and straightens up to rest.

#### Scenario: Rising
- **WHEN** the launch is held halfway up
- **THEN** the body is stretched and the flipper is close to the body

#### Scenario: Landing on his belly
- **WHEN** the launch is held at the moment he lands
- **THEN** the body lies close to horizontal, belly down, at ground level, and is squashed

#### Scenario: Standing up
- **WHEN** the launch is held while he pushes himself up
- **THEN** the body is between lying and upright, the feet are planted on the ground and the flipper is turned away from the body, and when the launch has finished he is at rest
