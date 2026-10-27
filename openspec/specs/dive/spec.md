# dive Specification

## Purpose
The dive is the home page: scrolling down is diving with Kálmán from the ice to 564 m and back up, past the sections about Raymond, with a depth gauge that shows where you are and takes you anywhere in one click.

## Requirements

### Requirement: The sections of the dive
Each home page (`/nl/`, `/hu/`, `/en/`, and `/` in English) SHALL show, in this order, the sections The ice, Who I am, Work, Education, The catch and Contact, each with a heading and its text in the page's language, as plain HTML. Each section SHALL have its own anchor, so it can be linked to.

#### Scenario: Sections in order
- **WHEN** a home page is opened
- **THEN** it has the six sections in order, each with a heading in the page's language

#### Scenario: Linking to a section
- **WHEN** a visitor opens a home page with the anchor of The catch
- **THEN** the page opens at The catch

### Requirement: Scrolling is diving
The page SHALL map the scroll position to a depth: 0 m at the ice, rising with every section down to 564 m at the bottom of The catch, and then counting back to 0 m during the ascent to Contact. Each section SHALL start at its depth from README §2.3 (Who I am 0 m, Work 100 m, Education 250 m, The catch 400 m), and the mapping SHALL be continuous, without jumps.

#### Scenario: At the start of a section
- **WHEN** the visitor has scrolled to the start of Work
- **THEN** the depth is 100 m

#### Scenario: The ascent
- **WHEN** the visitor scrolls on past the bottom of The catch towards Contact
- **THEN** the depth goes back from 564 m to 0 m, reaching 0 m at Contact

### Requirement: The depth gauge
A depth gauge SHALL stay in view at the side of the page and show the current depth in metres. It SHALL list the sections at their depths as links, mark the section the visitor is in, and be usable with the keyboard and announced by screen readers as navigation.

#### Scenario: Following the depth
- **WHEN** the visitor scrolls into Education
- **THEN** the gauge shows a depth between 250 m and 400 m and marks Education as current

#### Scenario: On a phone
- **WHEN** the page is shown 360 px wide
- **THEN** the gauge stays in view without covering the text or causing horizontal scrolling

### Requirement: Express dive
Choosing a section in the depth gauge SHALL take the visitor there without scrolling by hand: in full mode with a quick dive (Kálmán diving at speed), in the fallback straight away. Focus SHALL move to the chosen section's heading.

#### Scenario: Express dive to The catch
- **WHEN** the visitor chooses The catch in the depth gauge
- **THEN** the page arrives at The catch within about a second and focus is on its heading

#### Scenario: Express dive with reduced motion
- **WHEN** a visitor with reduced motion chooses Work in the depth gauge
- **THEN** the page jumps to Work at once, without an animated scroll

### Requirement: The water follows the depth
The page background SHALL change with the depth: ice blue at the surface, through deep-sea blue, to ink black at 564 m, and back to the light during the ascent. All text and controls SHALL keep at least WCAG AA contrast against the background at every depth.

#### Scenario: Deep down
- **WHEN** the visitor is in The catch
- **THEN** the background is close to ink black and the text is light

#### Scenario: Contrast at every depth
- **WHEN** the background colour is computed for any depth from 0 m to 564 m
- **THEN** the text colour used at that depth has a contrast ratio of at least 4.5:1 against it

### Requirement: Kálmán dives along
In full mode Kálmán SHALL be shown next to the content and follow the dive: idle on the ice in The ice, diving when the visitor first scrolls down, swimming while the depth goes down, and launching out of the water onto the ice, with his belly landing, during the ascent to Contact. He SHALL be decorative only (hidden from screen readers) and never cover the text.

#### Scenario: The first scroll
- **WHEN** the visitor scrolls down from The ice for the first time
- **THEN** Kálmán dives and then swims

#### Scenario: The ascent
- **WHEN** the visitor scrolls from The catch to Contact
- **THEN** Kálmán launches out of the water and ends standing on the ice at Contact

#### Scenario: Scrolling back up
- **WHEN** the visitor scrolls back up from Work to The ice
- **THEN** Kálmán is standing on the ice again at The ice

### Requirement: The still dive
In the fallback the page SHALL show the same sections, texts and gauge links, the water as a fixed colour per section, and Kálmán as a still in a fitting pose per section, drawn from the front figure only (so the fallback downloads no other figures), without any animation.

#### Scenario: Reduced motion
- **WHEN** a visitor with reduced motion scrolls through the page
- **THEN** nothing moves by itself, each section shows its colour and a still Kálmán, and all texts and links are there

#### Scenario: Without JavaScript
- **WHEN** the page is opened with JavaScript disabled
- **THEN** all sections, their texts, the gauge links and a still Kálmán per section are visible

### Requirement: The dive loads quickly
The first paint SHALL not wait for the animation: the sections, the gauge and the first view of Kálmán SHALL show before the animation code and the figures needed later have loaded. The home pages SHALL score at least 90 for performance in Lighthouse on mobile and stay within their JavaScript budget.

#### Scenario: Lighthouse on mobile
- **WHEN** Lighthouse measures a home page on mobile
- **THEN** the performance score is at least 90
