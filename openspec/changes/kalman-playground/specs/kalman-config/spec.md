# Spec Delta

## Purpose

Defines Kálmán's shape and colours as one validated config: which parameters exist, their allowed ranges and defaults, what every valid Kálmán must always look like, and the JSON format used to move a config between the playground and the repo.

## ADDED Requirements

### Requirement: One config describes Kálmán
Kálmán's shape, colours and accessories SHALL be determined entirely by one config. Building Kálmán twice from the same config SHALL give the same model.

#### Scenario: Same config, same model
- **WHEN** Kálmán is built twice from the same config
- **THEN** both models have identical geometry and colours

#### Scenario: The repo config is used
- **WHEN** the site or the playground starts without saved playground values
- **THEN** Kálmán is built from the config stored in the repo

### Requirement: Every parameter has a range and a default
Every config parameter SHALL have a name, a label, an allowed range or set of values, and a default inside that range. The playground controls and the validation SHALL use the same parameter definitions.

#### Scenario: Defaults are valid
- **WHEN** the default config is validated
- **THEN** it passes

#### Scenario: Controls match the definitions
- **WHEN** the playground shows a slider for a parameter
- **THEN** the slider's minimum, maximum and step equal that parameter's definition

### Requirement: Invalid configs are rejected with a clear reason
Validating a config SHALL fail when a parameter is missing, has the wrong type, lies outside its range, or when the config contains an unknown parameter. The failure SHALL name every offending parameter.

#### Scenario: Value out of range
- **WHEN** a config has a head size above its maximum
- **THEN** validation fails and the error names the head-size parameter and its allowed range

#### Scenario: Unknown and missing parameters
- **WHEN** a config contains an unknown key and lacks a required one
- **THEN** validation fails and the error names both

### Requirement: The emperor's features survive every valid config
Every valid config SHALL produce a Kálmán with a black head and back, a white belly, golden-orange ear patches that fade towards the chest, and a slender bill with an orange-to-pink stripe on the lower mandible. The ranges SHALL NOT allow removing or recolouring these features beyond recognition.

#### Scenario: Extremes keep the features
- **WHEN** Kálmán is built with every parameter at its minimum, and again at its maximum
- **THEN** both models still have the dark back, white belly, golden-orange ear patches and bill stripe

### Requirement: Kálmán stays low-poly
At every valid config, including maximum faceting with both accessories on, the model SHALL stay within 8,000 triangles and 20 draw calls.

#### Scenario: Maximum detail
- **WHEN** Kálmán is built at maximum faceting with the tie and glasses on
- **THEN** the model has at most 8,000 triangles and needs at most 20 draw calls

### Requirement: Accessories are part of the config
The tie and the reading glasses of Kálmán's professional side SHALL each be switchable on and off in the config, together with their size and the tie's colour.

#### Scenario: Tie on, glasses off
- **WHEN** a config switches the tie on and the glasses off
- **THEN** the model contains a tie and no glasses

### Requirement: Configs move as versioned JSON
A config SHALL be exportable as JSON with a format version and every parameter value. Importing an exported config SHALL give back exactly the same config, and importing JSON with an unknown format version SHALL fail with a clear reason.

#### Scenario: Round trip
- **WHEN** a config is exported to JSON and imported again
- **THEN** the imported config equals the original

#### Scenario: Unknown format version
- **WHEN** JSON with an unsupported format version is imported
- **THEN** the import fails and says which versions are supported
