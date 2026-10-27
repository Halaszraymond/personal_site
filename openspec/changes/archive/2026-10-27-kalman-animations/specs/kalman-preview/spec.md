# Spec Delta

## MODIFIED Requirements

### Requirement: A control per named pose
The preview SHALL offer one button per named pose of the figure being shown (front or side). Activating a button SHALL put Kálmán in that pose without reloading the page and SHALL mark that button as the current pose.

#### Scenario: Choosing a pose
- **WHEN** Raymond activates the "Bow" button
- **THEN** Kálmán is shown in the bow pose and the "Bow" button is marked as pressed

#### Scenario: Side poses
- **WHEN** Raymond switches to the side figure
- **THEN** the pose buttons and rotation sliders are those of the side figure

### Requirement: Usable on a phone and with reduced motion
The preview SHALL be usable at a 360 px wide viewport without horizontal scrolling. Pose changes SHALL stay immediate. With reduced motion requested, the idle loop and head-follow SHALL start switched off, and animations SHALL only play when Raymond presses their button.

#### Scenario: Mobile width
- **WHEN** the preview is opened at a 360 px wide viewport
- **THEN** the figure and all controls are reachable without horizontal scrolling

#### Scenario: Reduced motion
- **WHEN** the preview is opened with reduced motion requested
- **THEN** nothing moves until Raymond presses a play button

## ADDED Requirements

### Requirement: A front/side switch
The preview SHALL offer a switch between the front and the side figure for posing. The turn-around control SHALL apply to the front figure.

#### Scenario: Showing the side figure
- **WHEN** Raymond switches to the side figure
- **THEN** the side figure is shown in its rest pose

### Requirement: A play button per animation
The preview SHALL offer one button per animation in the repo. Activating it SHALL play that animation on the figure it uses, mark it as playing, and show the figure's description with the animation's name. When a non-looping animation ends, its button SHALL no longer be marked as playing.

#### Scenario: Playing the bow
- **WHEN** Raymond activates "Play bow"
- **THEN** Kálmán bows, the button is marked as playing while he does, and he ends at rest

### Requirement: An idle loop switch
The preview SHALL offer a switch that loops the idle animation while no other animation plays. It SHALL start switched on, unless reduced motion is requested.

#### Scenario: Idle by default
- **WHEN** the preview is opened without reduced motion
- **THEN** Kálmán sways gently on his own until another animation is played or the switch is turned off

### Requirement: Head-follow on the stage
While the head-follow animation is chosen, Kálmán's head SHALL turn towards the pointer as it moves over the stage, and return to rest when the pointer leaves.

#### Scenario: Pointer to the right
- **WHEN** head-follow is chosen and the pointer moves to the right edge of the stage
- **THEN** Kálmán's head turns to the right

### Requirement: Scrubbing through an animation
The preview SHALL offer a slider that shows and sets the position in the current animation, from its start to its end, so a moment can be held still and looked at. Moving the slider SHALL pause the animation at that moment.

#### Scenario: Holding a moment
- **WHEN** Raymond moves the slider to the middle of the dive animation
- **THEN** the animation pauses and Kálmán is shown at that moment of the dive
