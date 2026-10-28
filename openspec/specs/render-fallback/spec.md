# render-fallback Specification

## Purpose

Decides for each visitor whether the site runs its full animated experience or a static fallback, so that nobody ever gets a broken or empty page and all content stays readable as plain HTML.

## Requirements

### Requirement: The fallback is the starting point
Every page SHALL render in fallback mode by default, before and without any JavaScript. The full mode SHALL only be switched on by the client after the checks in this spec have passed.

#### Scenario: JavaScript disabled
- **WHEN** a visitor opens a page with JavaScript disabled
- **THEN** the page is in fallback mode and all its content is visible

### Requirement: Reduced motion selects the fallback
When the visitor's system asks for reduced motion (`prefers-reduced-motion: reduce`), the site SHALL stay in fallback mode.

#### Scenario: Reduced motion requested
- **WHEN** a visitor with `prefers-reduced-motion: reduce` opens a page
- **THEN** the page stays in fallback mode

### Requirement: Save-Data selects the fallback
When the browser reports that the visitor has asked to save data, the site SHALL stay in fallback mode. Browsers that do not report this setting SHALL be treated as not asking to save data.

#### Scenario: Save-Data on
- **WHEN** a visitor whose browser reports Save-Data opens a page
- **THEN** the page stays in fallback mode

#### Scenario: Browser without the Save-Data setting
- **WHEN** a visitor whose browser does not report a Save-Data setting, and that passes the other checks, opens a page
- **THEN** the page switches to full mode

### Requirement: Full mode when every check passes
When reduced motion is not requested and Save-Data is off, the site SHALL switch to full mode. In full mode the home pages show the animated dive scene (Kálmán following the dive); other pages show an empty scene slot.

#### Scenario: Capable browser
- **WHEN** a visitor without reduced motion and without Save-Data opens a page
- **THEN** the page switches to full mode and the scene slot is present

#### Scenario: The dive scene
- **WHEN** a visitor without reduced motion and without Save-Data opens a home page
- **THEN** the scene slot holds the animated Kálmán of the dive

### Requirement: The chosen mode is visible in the page
The page SHALL expose its current mode (`fallback` or `full`) as an attribute on the `<html>` element, so styles and automated tests can rely on it.

#### Scenario: Reading the mode
- **WHEN** a page has finished loading in fallback mode
- **THEN** the `<html>` element carries the mode value `fallback`

### Requirement: Content is identical in both modes
All text content and links SHALL be present as HTML in both modes. The scene slot SHALL be decorative only and hidden from assistive technology.

#### Scenario: Same content in both modes
- **WHEN** the same page is loaded once in fallback mode and once in full mode
- **THEN** both contain the same headings, text and links

#### Scenario: Scene slot is hidden from screen readers
- **WHEN** a page is in full mode
- **THEN** the scene slot is marked `aria-hidden="true"`
