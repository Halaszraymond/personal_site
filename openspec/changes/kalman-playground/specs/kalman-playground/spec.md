# Spec Delta

## Purpose

A dev-only page where Raymond shapes Kálmán by eye: Kálmán drawn live from a config, a control for every parameter, and a way to export the chosen values as the config for the repo.

## ADDED Requirements

### Requirement: Dev-only availability
The playground SHALL be served at `/playground/` in the development server and in builds made with the playground flag (CI and branch previews). A production build without the flag SHALL contain neither the playground page nor any 3D library code.

#### Scenario: Branch preview
- **WHEN** a build is made with the playground flag and `/playground/` is opened
- **THEN** the playground is shown

#### Scenario: Production build
- **WHEN** a build is made without the playground flag
- **THEN** `/playground/` returns the 404 page and the build output contains no Three.js code

### Requirement: Hidden from the public
The playground SHALL NOT be linked from any public page and SHALL be marked `noindex`. Its interface SHALL be in English, declared with `lang="en"`.

#### Scenario: Not indexed
- **WHEN** the playground is loaded
- **THEN** it carries `<meta name="robots" content="noindex">` and `<html lang="en">`

### Requirement: Kálmán drawn live from the current values
The playground SHALL show Kálmán drawn from the current control values, and SHALL redraw him within the same frame after any control changes, without reloading the page.

#### Scenario: Moving a slider
- **WHEN** Raymond moves the head-size slider
- **THEN** Kálmán's head changes size immediately and the page does not reload

### Requirement: A labelled control for every parameter
The playground SHALL show one control per config parameter, grouped by body part: a slider for each numeric parameter with its current value shown, a colour control for each colour, and a switch for each on/off parameter. Every control SHALL have a visible label and SHALL be fully usable with the keyboard.

#### Scenario: Keyboard only
- **WHEN** Raymond focuses the bill-length slider with Tab and presses the arrow keys
- **THEN** the value changes by one step per key press and the shown value updates

#### Scenario: Every parameter has a control
- **WHEN** the playground is loaded
- **THEN** there is exactly one control for each parameter in the config definitions

### Requirement: Turning Kálmán around
The view SHALL let Raymond turn Kálmán by dragging with a mouse or a finger, and SHALL offer a control that resets the view to the front.

#### Scenario: Reset the view
- **WHEN** Raymond has turned Kálmán and activates "Reset view"
- **THEN** Kálmán is shown from the front again

### Requirement: Swim preview
The playground SHALL offer a swim preview that plays Kálmán's flipper strokes using the current swim parameters, with a play/pause control. With reduced motion requested, the preview SHALL start paused.

#### Scenario: Play the stroke
- **WHEN** Raymond starts the swim preview
- **THEN** Kálmán's flippers move in strokes until it is paused

#### Scenario: Reduced motion
- **WHEN** the playground is opened with `prefers-reduced-motion: reduce`
- **THEN** the swim preview is paused until Raymond starts it

### Requirement: Reset to the repo config
The playground SHALL offer a control that sets every parameter back to the config stored in the repo.

#### Scenario: Reset
- **WHEN** Raymond has changed several values and activates "Reset"
- **THEN** every control and Kálmán show the repo config again

### Requirement: Copy config
The playground SHALL offer a "Copy config" control that copies the current values to the clipboard as versioned JSON that passes config validation. The same JSON SHALL also be visible as selectable text, so it can be copied by hand when the clipboard is unavailable.

#### Scenario: Copy
- **WHEN** Raymond activates "Copy config"
- **THEN** the clipboard holds JSON that validates as a Kálmán config with the current values

#### Scenario: No clipboard access
- **WHEN** the browser refuses clipboard access
- **THEN** the playground says so, the JSON stays visible as selectable text, and no error is logged

### Requirement: Values survive a reload
The playground SHALL keep the current values in browser storage and restore them on the next visit. Stored values that are no longer valid SHALL be ignored in favour of the repo config. Blocked storage SHALL NOT cause errors.

#### Scenario: Reload
- **WHEN** Raymond changes values and reloads the page
- **THEN** the controls and Kálmán show the changed values

#### Scenario: Outdated stored values
- **WHEN** the stored values fail validation
- **THEN** the playground starts from the repo config and logs no error

### Requirement: Without WebGL2
Without WebGL2, the playground SHALL explain that it needs WebGL2 instead of showing an empty or broken view, and SHALL log no errors.

#### Scenario: No WebGL2
- **WHEN** the playground is opened in a browser that cannot create a WebGL2 context
- **THEN** a message explains that the playground needs WebGL2 and there are no console errors

### Requirement: Draws only when needed
The playground SHALL draw a new frame only when a control changes, the view is turned, or the swim preview plays, and SHALL stop drawing while the tab is hidden.

#### Scenario: Idle
- **WHEN** nothing changes and the swim preview is paused
- **THEN** no new frames are drawn

#### Scenario: Hidden tab
- **WHEN** the swim preview plays and the tab is hidden
- **THEN** drawing stops until the tab is visible again
