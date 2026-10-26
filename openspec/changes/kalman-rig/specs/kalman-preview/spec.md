# Spec Delta

## Purpose

A dev-only page where Raymond views Kálmán's rig and poses, tries new poses by hand and exports them as data for the repo, without it ever reaching the public site.

## ADDED Requirements

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
The preview SHALL offer one button per named pose in the repo. Activating a button SHALL put Kálmán in that pose without reloading the page and SHALL mark that button as the current pose.

#### Scenario: Choosing a pose
- **WHEN** Raymond activates the "Bow" button
- **THEN** Kálmán is shown in the bow pose and the "Bow" button is marked as pressed

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
The preview SHALL offer a "Copy pose" control that copies the current slider values to the clipboard as pose JSON that passes pose validation. The same JSON SHALL also be visible as selectable text, so it can be copied by hand when the clipboard is unavailable.

#### Scenario: Copy
- **WHEN** Raymond activates "Copy pose"
- **THEN** the clipboard holds JSON that validates as a pose with the current slider values

#### Scenario: No clipboard access
- **WHEN** the browser refuses clipboard access
- **THEN** the preview says so, the JSON stays visible as selectable text, and no error is logged

### Requirement: Usable on a phone and with reduced motion
The preview SHALL be usable at a 360 px wide viewport without horizontal scrolling, and SHALL behave the same with reduced motion requested, since pose changes are immediate and not animated.

#### Scenario: Mobile width
- **WHEN** the preview is opened at a 360 px wide viewport
- **THEN** the figure and all controls are reachable without horizontal scrolling
