# kalman-preview Specification

## Purpose

A dev-only page where Raymond views Kálmán's rig and poses, tries new poses by hand and exports them as data for the repo, spins him and turns him around, without it ever reaching the public site.

## Requirements

### Requirement: Dev-only availability
The preview SHALL be served at `/playground/` in the development server and in builds made with the playground flag (CI and branch previews). A production build without the flag SHALL NOT contain the preview page or its script.

#### Scenario: Branch preview
- **WHEN** a build is made with the playground flag and `/playground/` is opened
- **THEN** the preview is shown

#### Scenario: Production build
- **WHEN** a build is made without the playground flag
- **THEN** `/playground/` returns the 404 page and the build output contains no preview files or code

### Requirement: Hidden from the public
The preview SHALL NOT be linked from any public page and SHALL be marked `noindex`. Its interface SHALL be in English, declared with `lang="en"`.

#### Scenario: Not indexed
- **WHEN** the preview is loaded
- **THEN** it carries `<meta name="robots" content="noindex">` and `<html lang="en">`

### Requirement: Kálmán is shown with a description
The preview SHALL show Kálmán, built from the repo's rig config, as an image with a text description that names the current pose and mood.

#### Scenario: Description follows the pose
- **WHEN** the bow pose is selected
- **THEN** the figure's accessible description names the bow pose

### Requirement: A control per named pose
The preview SHALL offer one button per named pose of the figure being shown (front or side). Activating a button SHALL put Kálmán in that pose without reloading the page and SHALL mark that button as the current pose.

#### Scenario: Choosing a pose
- **WHEN** Raymond activates the "Bow" button
- **THEN** Kálmán is shown in the bow pose and the "Bow" button is marked as pressed

#### Scenario: Side poses
- **WHEN** Raymond switches to the side figure
- **THEN** the pose buttons and rotation sliders are those of the side figure

### Requirement: Mood switch
The preview SHALL offer a switch between the goofy and the professional mood, which shows or hides the tie and the glasses.

#### Scenario: Professional on
- **WHEN** Raymond turns the professional switch on
- **THEN** Kálmán wears the tie and the glasses

### Requirement: A rotation slider per layer
The preview SHALL offer a labelled slider for each layer's rotation, limited to that layer's allowed range, showing the current value. Moving a slider SHALL rotate that layer immediately. Selecting a named pose SHALL set every slider to that pose's values.

#### Scenario: Keyboard only
- **WHEN** Raymond focuses the head slider with Tab and presses an arrow key
- **THEN** the head rotates by one step and the shown value updates

#### Scenario: Sliders follow a named pose
- **WHEN** Raymond selects the flippers-up pose
- **THEN** each slider shows that pose's rotation for its layer

#### Scenario: Slider limits
- **WHEN** the preview is loaded
- **THEN** every slider's minimum and maximum equal its layer's allowed rotation range

### Requirement: Pivot overlay
The preview SHALL offer a switch that marks each layer's pivot point on the figure, so the rig can be checked by eye.

#### Scenario: Show pivots
- **WHEN** Raymond turns "Show pivots" on
- **THEN** a marker is shown at the pivot point of every visible layer, and the markers move with their layers

### Requirement: Copy pose
The preview SHALL offer a "Copy pose" control that copies the current slider values (rotations and stretches) to the clipboard as pose JSON that passes pose validation. The same JSON SHALL also be visible as selectable text, so it can be copied by hand when the clipboard is unavailable.

#### Scenario: Copy
- **WHEN** Raymond activates "Copy pose"
- **THEN** the clipboard holds JSON that validates as a pose with the current slider values

#### Scenario: No clipboard access
- **WHEN** the browser refuses clipboard access
- **THEN** the preview says so, the JSON stays visible as selectable text, and no error is logged

#### Scenario: Stretch in the copied pose
- **WHEN** Raymond squashes the body with its stretch slider and activates "Copy pose"
- **THEN** the copied pose holds the body's stretch, and leaves out the stretch of layers that are at 1

### Requirement: Spin slider
The preview SHALL offer a labelled slider from −180 to 180 degrees that spins the whole figure as one piece, showing the current value. Spinning SHALL NOT change the pose or the pose JSON.

#### Scenario: Spinning with the keyboard
- **WHEN** Raymond focuses the spin slider and presses an arrow key
- **THEN** the figure turns by one degree, the shown value updates, and the pose JSON stays the same

### Requirement: A control to turn Kálmán around
When the turntable data has more than one view, the preview SHALL offer a labelled "Turn around" slider from 0 to 359 degrees, and dragging the figure sideways SHALL turn him too. With only one view the control SHALL be left out.

#### Scenario: Dragging
- **WHEN** Raymond drags the figure sideways
- **THEN** Kálmán turns and the slider shows the new angle, while a vertical swipe on a phone still scrolls the page

#### Scenario: Only the front view
- **WHEN** the turntable data has only the front view
- **THEN** the preview has no "Turn around" control

### Requirement: The drawn views while he is turned
At a view's own angle exactly that drawing SHALL show; in between, the current view SHALL narrow and the next one SHALL fade in on top of it, so the background never shows through. The posable layers SHALL show only while he faces the front, and the mood SHALL apply to the views too.

#### Scenario: Seen from the back
- **WHEN** Raymond turns Kálmán to 180 degrees
- **THEN** the drawn back view shows, the posable layers are hidden, and the figure's description says he is seen from the back

#### Scenario: Back to the front
- **WHEN** Raymond turns Kálmán back to 0 degrees
- **THEN** the posable layers show again in the current pose

#### Scenario: Professional views
- **WHEN** the professional mood is on and Kálmán is turned to a drawn view
- **THEN** that view's professional image shows

### Requirement: Usable on a phone and with reduced motion
The preview SHALL be usable at a 360 px wide viewport without horizontal scrolling. Pose changes SHALL stay immediate. With reduced motion requested, the idle loop and head-follow SHALL start switched off, and animations SHALL only play when Raymond presses their button.

#### Scenario: Mobile width
- **WHEN** the preview is opened at a 360 px wide viewport
- **THEN** the figure and all controls are reachable without horizontal scrolling

#### Scenario: Reduced motion
- **WHEN** the preview is opened with reduced motion requested
- **THEN** nothing moves until Raymond presses a play button

### Requirement: A front/side switch
The preview SHALL offer a switch between the front, the side and the swimming figure for posing. The turn-around control SHALL apply to the front figure.

#### Scenario: Showing the side figure
- **WHEN** Raymond switches to the side figure
- **THEN** the side figure is shown in its rest pose

#### Scenario: Showing the swimming figure
- **WHEN** Raymond switches to the swimming figure
- **THEN** the swimming figure is shown in its rest pose, with its own pose buttons and sliders

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
While the head-follow animation is chosen, Kálmán's head SHALL turn towards the pointer as it moves over the stage and his eyes SHALL look at it, in both moods; both return to rest when the pointer leaves.

#### Scenario: Pointer to the right
- **WHEN** head-follow is chosen and the pointer moves to the right edge of the stage
- **THEN** Kálmán's head turns to the right and his pupils move to the right

#### Scenario: Eyes in the professional mood
- **WHEN** head-follow is chosen in the professional mood and the pointer moves to the right edge of the stage
- **THEN** the professional pupils behind the glasses move to the right

### Requirement: Scrubbing through an animation
The preview SHALL offer a slider that shows and sets the position in the current animation, from its start to its end, so a moment can be held still and looked at. Moving the slider SHALL pause the animation at that moment.

#### Scenario: Holding a moment
- **WHEN** Raymond moves the slider to the middle of the dive animation
- **THEN** the animation pauses and Kálmán is shown at that moment of the dive

### Requirement: A stretch slider per stretchable layer
The preview SHALL offer a labelled stretch slider for each layer of the shown figure that has a stretch range, limited to that range and showing the current value; layers without a stretch range SHALL get none. Moving a slider SHALL squash or stretch that layer immediately, and selecting a named pose SHALL set every stretch slider to that pose's values.

#### Scenario: Squashing with the keyboard
- **WHEN** Raymond focuses the body's stretch slider and presses an arrow key
- **THEN** the body squashes or stretches by one step and the shown value updates

#### Scenario: Stretch slider limits
- **WHEN** the preview is loaded
- **THEN** every stretch slider's minimum and maximum equal its layer's stretch range, and only layers with a stretch range have one
