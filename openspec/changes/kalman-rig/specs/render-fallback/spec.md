# Spec Delta

## MODIFIED Requirements

### Requirement: Full mode when every check passes
When reduced motion is not requested and Save-Data is off, the site SHALL switch to full mode. Until the animated scene arrives, the full mode shows an empty scene slot.

#### Scenario: Capable browser
- **WHEN** a visitor without reduced motion and without Save-Data opens a page
- **THEN** the page switches to full mode and the scene slot is present

## REMOVED Requirements

### Requirement: Missing WebGL2 selects the fallback
**Reason**: The site is 2D now (README §2.1, §5.1): layered images, SVG and canvas 2D, no WebGL. A browser without WebGL2 can run the full mode, so the check would only send capable visitors to the fallback.
**Migration**: None for visitors. The `hasWebGL2` signal and its detection are removed from the render-mode logic and its tests. Weak devices are caught by the frame-time check (README §5.2, step 3), which arrives with the animated scene.
