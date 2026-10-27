# Spec Delta

## MODIFIED Requirements

### Requirement: Language alternates for search engines
Every indexable language page (`/`, `/nl/`, `/hu/`, `/en/` and their sub-pages) SHALL contain `<link rel="alternate" hreflang="…">` links to its Dutch, Hungarian and English versions, plus an `x-default` link pointing to `/`. Pages that are not indexed, such as the 404 page and dev tools, SHALL NOT contain them.

#### Scenario: Alternates on a language page
- **WHEN** the page at `/hu/` is loaded
- **THEN** it contains alternate links with `hreflang` values `nl`, `hu`, `en` and `x-default`, pointing to `/nl/`, `/hu/`, `/en/` and `/`

#### Scenario: No alternates on a page that is not indexed
- **WHEN** the 404 page or the dev-only preview is loaded
- **THEN** it contains no `hreflang` alternate links and is marked `noindex`

### Requirement: Language switcher on every page
Every public page SHALL show a language switcher with a link to the same page in each of the three languages. The switcher SHALL work without JavaScript, SHALL be reachable and usable with the keyboard, and SHALL mark the current language for assistive technology. Dev tools that are not part of the public site, such as the dev-only preview, are exempt.

#### Scenario: Switching language
- **WHEN** a visitor on `/en/` activates the switcher's Hungarian link
- **THEN** the browser navigates to `/hu/`

#### Scenario: Current language is marked
- **WHEN** the page at `/nl/` is loaded
- **THEN** the switcher's Dutch link is marked as the current page (`aria-current="page"`)

#### Scenario: Switcher without JavaScript
- **WHEN** JavaScript is disabled and a visitor activates a switcher link
- **THEN** the browser navigates to that language's page

#### Scenario: Dev-only preview
- **WHEN** the dev-only preview is loaded
- **THEN** it has no language switcher
