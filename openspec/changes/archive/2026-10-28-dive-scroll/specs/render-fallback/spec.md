# Spec Delta

## MODIFIED Requirements

### Requirement: Full mode when every check passes
When reduced motion is not requested and Save-Data is off, the site SHALL switch to full mode. In full mode the home pages show the animated dive scene (Kálmán following the dive); other pages show an empty scene slot.

#### Scenario: Capable browser
- **WHEN** a visitor without reduced motion and without Save-Data opens a page
- **THEN** the page switches to full mode and the scene slot is present

#### Scenario: The dive scene
- **WHEN** a visitor without reduced motion and without Save-Data opens a home page
- **THEN** the scene slot holds the animated Kálmán of the dive
