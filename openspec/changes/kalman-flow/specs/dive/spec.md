# Spec Delta

## ADDED Requirements

### Requirement: Kálmán's tempo follows the scroll
While Kálmán swims in full mode, his swimming tempo SHALL follow how fast the visitor scrolls: slower and lazier while they stop to read, faster when they scroll quickly, within a set range, and every change of tempo SHALL be gradual.

#### Scenario: Reading
- **WHEN** the visitor stops scrolling while Kálmán swims
- **THEN** he swims more slowly than at an ordinary scroll

#### Scenario: Scrolling fast
- **WHEN** the visitor scrolls much faster than usual
- **THEN** he swims faster, up to the top of the range

## MODIFIED Requirements

### Requirement: Kálmán dives along
In full mode Kálmán SHALL be shown next to the content and follow the dive as one continuous movement: idle on the ice in The ice, diving when the visitor first scrolls down, swimming while the depth goes down, and launching out of the water onto the ice, with his belly landing, during the ascent to Contact, each flowing into the next without a jump. When the visitor scrolls back up into The ice he SHALL climb out of the water onto the ice the same way. He SHALL be decorative only (hidden from screen readers) and never cover the text.

#### Scenario: The first scroll
- **WHEN** the visitor scrolls down from The ice for the first time
- **THEN** Kálmán dives and then swims

#### Scenario: The ascent
- **WHEN** the visitor scrolls from The catch to Contact
- **THEN** Kálmán launches out of the water and ends standing on the ice at Contact

#### Scenario: Scrolling back up
- **WHEN** the visitor scrolls back up from Work to The ice
- **THEN** Kálmán launches out of the water and ends standing on the ice at The ice
