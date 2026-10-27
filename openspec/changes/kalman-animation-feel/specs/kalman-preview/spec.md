# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: A stretch slider per stretchable layer
The preview SHALL offer a labelled stretch slider for each layer of the shown figure that has a stretch range, limited to that range and showing the current value; layers without a stretch range SHALL get none. Moving a slider SHALL squash or stretch that layer immediately, and selecting a named pose SHALL set every stretch slider to that pose's values.

#### Scenario: Squashing with the keyboard
- **WHEN** Raymond focuses the body's stretch slider and presses an arrow key
- **THEN** the body squashes or stretches by one step and the shown value updates

#### Scenario: Stretch slider limits
- **WHEN** the preview is loaded
- **THEN** every stretch slider's minimum and maximum equal its layer's stretch range, and only layers with a stretch range have one
