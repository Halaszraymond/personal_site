# Spec Delta

## ADDED Requirements

### Requirement: The figure loads only what it shows
The figure SHALL be drawable without the turntable views and without the drawn poses, so a page that doesn't turn him or show a drawn pose doesn't download them. Its layer images SHALL be served in a modern compressed format (WebP) at no more than twice the size they are shown at, with the same look as the original images.

#### Scenario: The dive without the turntable
- **WHEN** a home page is loaded
- **THEN** none of the turntable views is downloaded

#### Scenario: Compressed layers
- **WHEN** the figure's layer images are built
- **THEN** each is a WebP image no wider than twice its width on the page at desktop size
