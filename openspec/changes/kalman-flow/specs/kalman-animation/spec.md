# Spec Delta

## ADDED Requirements

### Requirement: Animations flow into each other
Starting an animation while Kálmán is in another pose SHALL never make him jump: on the same figure his pose SHALL blend over a short transition from where he was into the new animation, and when the new animation uses another figure the two drawings SHALL cross-fade over that transition, with the drawing underneath staying solid so he is nowhere see-through. Holding an animation still at a moment (scrubbing) SHALL show exactly that moment, without a transition.

#### Scenario: Same figure
- **WHEN** an animation is started while the figure is in a pose of the same figure, and is sampled halfway through the transition
- **THEN** every layer is between its old value and the new animation's value

#### Scenario: Another figure
- **WHEN** the swim is started while the side figure is shown, and the figure is sampled during the transition
- **THEN** both figures are drawn, one of them fully opaque, and at the end of the transition only the swimming figure is shown

#### Scenario: Scrubbing
- **WHEN** an animation is held at a moment with the scrub slider
- **THEN** the figure shows exactly that moment of the animation

## MODIFIED Requirements

### Requirement: Playback ends where it should
An animation that does not loop SHALL end in the pose of its last keyframe, once every lagging layer has caught up, and SHALL stay in that pose until another animation starts or playback is stopped; a looping animation SHALL repeat until it is stopped, without a jump where it starts again. Starting an animation SHALL stop the one that was playing. Stopping playback SHALL put Kálmán at rest.

#### Scenario: Bow ends at rest
- **WHEN** the bow animation has played to the end
- **THEN** Kálmán is in his rest pose

#### Scenario: The dive ends gliding
- **WHEN** the dive animation has played to the end
- **THEN** Kálmán stays in the glide pose until another animation starts

#### Scenario: Starting another animation
- **WHEN** the swim animation is playing and the bow animation is started
- **THEN** swimming stops and the bow plays

#### Scenario: Lagging layers settle
- **WHEN** the dive animation's last keyframe has passed but its tail is still catching up
- **THEN** the animation keeps playing until the tail is in its last pose too, and only then counts as finished

### Requirement: The dive moves like a dive
The dive SHALL be a little goofy but natural: he leans forward with his flippers back, crouches on bent knees with his feet on the ground, pushes off, makes a small hop in which his flippers flail, and goes into the water face first, his head leading while his tail and feet trail behind. He SHALL then level out into a horizontal glide, bill forward, lying where the swimming figure swims, so the swim can take over without a jump.

#### Scenario: Crouch before the hop
- **WHEN** the dive is held at the end of its crouch
- **THEN** the body is leaning forward, lower than at rest and squashed, and the feet are planted on the ground

#### Scenario: The hop
- **WHEN** the dive is sampled just after the hop
- **THEN** the body is higher than at rest before it moves down, and the flippers are away from the body

#### Scenario: Face first
- **WHEN** the dive is held as he enters the water
- **THEN** the body is turned past horizontal so the head is lower than the tail, the body is stretched, and the tail and feet are behind the body's movement

#### Scenario: Levelling out
- **WHEN** the dive has finished
- **THEN** the body lies horizontally, head forward, with its middle within a few units of the swimming figure's body at rest

### Requirement: The launch is professional, the landing goofy
The launch SHALL start from swimming: from a horizontal glide he swoops upward under the water until he is almost upright, then rises like a rocket with his flippers pressed to his body and stretched, and flies out at an angle with his feet trailing. The landing SHALL be goofy, as in Raymond's stills: he lands on his belly, slides forward a little, pushes himself up with his feet and flippers on bent knees, wobbles as if he almost loses his balance, and straightens up to rest.

#### Scenario: From the swim
- **WHEN** the launch is held at its start
- **THEN** the body lies horizontally in the glide pose, where the swimming figure swims

#### Scenario: Rising
- **WHEN** the launch is held halfway up
- **THEN** the body is stretched and the flipper is close to the body

#### Scenario: Landing on his belly
- **WHEN** the launch is held at the moment he lands
- **THEN** the body lies close to horizontal, belly down, at ground level, and is squashed

#### Scenario: Standing up
- **WHEN** the launch is held while he pushes himself up
- **THEN** the body is between lying and upright, the feet are planted on the ground and the flipper is turned away from the body, and when the launch has finished he is at rest
