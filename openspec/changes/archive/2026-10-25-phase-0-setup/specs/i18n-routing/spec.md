# Spec Delta

## Purpose

Serves the site in Dutch, Hungarian and English under their own URLs, lets visitors move between the languages, and helps search engines and visitors find the right one without ever redirecting them against their will.

## ADDED Requirements

### Requirement: One URL prefix per language
The site SHALL serve each page in Dutch under `/nl/`, in Hungarian under `/hu/` and in English under `/en/`. Each page SHALL declare its language in the `lang` attribute of the `<html>` element.

#### Scenario: Dutch page
- **WHEN** a visitor opens `/nl/`
- **THEN** the page shows its text in Dutch and the `<html>` element has `lang="nl"`

#### Scenario: Hungarian page
- **WHEN** a visitor opens `/hu/`
- **THEN** the page shows its text in Hungarian and the `<html>` element has `lang="hu"`

#### Scenario: English page
- **WHEN** a visitor opens `/en/`
- **THEN** the page shows its text in English and the `<html>` element has `lang="en"`

### Requirement: The root shows English without redirecting
The site SHALL serve the English home page at `/` with HTTP status 200 and SHALL NOT redirect, whatever the visitor's browser language is. Its canonical URL SHALL be `/en/`.

#### Scenario: Visitor with a Dutch browser opens the root
- **WHEN** a visitor whose browser prefers Dutch opens `/`
- **THEN** the response is 200, the URL stays `/` and the page is in English

#### Scenario: Canonical link on the root
- **WHEN** the page at `/` is loaded
- **THEN** it contains `<link rel="canonical">` pointing to `/en/`

### Requirement: Language alternates for search engines
Every page SHALL contain `<link rel="alternate" hreflang="…">` links to its Dutch, Hungarian and English versions, plus an `x-default` link pointing to `/`.

#### Scenario: Alternates on a language page
- **WHEN** the page at `/hu/` is loaded
- **THEN** it contains alternate links with `hreflang` values `nl`, `hu`, `en` and `x-default`, pointing to `/nl/`, `/hu/`, `/en/` and `/`

### Requirement: Language switcher on every page
Every page SHALL show a language switcher with a link to the same page in each of the three languages. The switcher SHALL work without JavaScript, SHALL be reachable and usable with the keyboard, and SHALL mark the current language for assistive technology.

#### Scenario: Switching language
- **WHEN** a visitor on `/en/` activates the switcher's Hungarian link
- **THEN** the browser navigates to `/hu/`

#### Scenario: Current language is marked
- **WHEN** the page at `/nl/` is loaded
- **THEN** the switcher's Dutch link is marked as the current page (`aria-current="page"`)

#### Scenario: Switcher without JavaScript
- **WHEN** JavaScript is disabled and a visitor activates a switcher link
- **THEN** the browser navigates to that language's page

### Requirement: The visitor's language choice is remembered
When a visitor picks a language with the switcher or the language hint, the site SHALL remember that choice in the visitor's browser. The site SHALL NOT use cookies for this.

#### Scenario: Choice is stored
- **WHEN** a visitor activates the switcher's Dutch link
- **THEN** Dutch is stored as the visitor's choice in browser storage and no cookie is set

#### Scenario: Storage is unavailable
- **WHEN** browser storage is blocked and a visitor uses the switcher
- **THEN** navigation still works and no error is shown or logged

### Requirement: Language hint on the root
On `/`, the site SHALL show a dismissible hint offering the Dutch or Hungarian site when the visitor's stored choice is that language, or, with no stored choice, when the browser's preferred language is Dutch or Hungarian. The hint SHALL be written in the language it offers. No hint SHALL be shown when the stored choice is English.

#### Scenario: Hungarian browser, first visit
- **WHEN** a visitor with no stored choice whose browser prefers Hungarian opens `/`
- **THEN** a hint in Hungarian offers a link to `/hu/`

#### Scenario: English browser
- **WHEN** a visitor with no stored choice whose browser prefers English opens `/`
- **THEN** no language hint is shown

#### Scenario: Dismissing the hint
- **WHEN** a visitor dismisses the hint
- **THEN** the hint disappears, English is stored as the visitor's choice and the hint is not shown on later visits

#### Scenario: Stored choice wins over the browser language
- **WHEN** a visitor whose stored choice is Dutch, but whose browser prefers Hungarian, opens `/`
- **THEN** the hint offers the Dutch site

#### Scenario: Hint on language pages
- **WHEN** a visitor opens `/nl/`, `/hu/` or `/en/`
- **THEN** no language hint is shown

### Requirement: Unknown URLs return a real 404
For a URL that does not exist, the site SHALL respond with HTTP status 404 and a page that explains this in Dutch, Hungarian and English and links to `/nl/`, `/hu/` and `/en/`.

#### Scenario: Unknown URL
- **WHEN** a visitor opens `/does-not-exist`
- **THEN** the response status is 404 and the page links to the home page in all three languages
