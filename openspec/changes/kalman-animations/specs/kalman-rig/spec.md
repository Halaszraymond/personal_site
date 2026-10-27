# Spec Delta

## MODIFIED Requirements

### Requirement: The rig has Kálmán's parts
There SHALL be a rig for the front figure and one for the side figure. The front rig SHALL contain exactly these layers: body, head, left flipper, right flipper, left foot, right foot, tail, tie and glasses. The side rig SHALL contain exactly these layers: body, head, flipper, front foot, back foot, tail, tie and glasses (the far flipper is hidden behind the body). In each rig the body SHALL be the only layer without a parent.

#### Scenario: Layer set
- **WHEN** the rig config in the repo is checked
- **THEN** the front rig has exactly its nine layers, the side rig exactly its eight, and in both the body is the only one without a parent

### Requirement: Poses are data
Named poses SHALL be stored as data per figure, each giving per-layer rotations and offsets relative to the rest position. Layers a pose does not mention SHALL stay at rest. The repo SHALL contain at least the front poses rest, bow, flippers up, head tilt left and head tilt right, and the side poses rest, stroke up, stroke down and dive.

#### Scenario: Partial pose
- **WHEN** a pose mentions only the head
- **THEN** every other layer is at its rest position

#### Scenario: Poses per figure
- **WHEN** the poses in the repo are checked
- **THEN** every pose belongs to the front or the side figure and only names layers of that figure's rig

### Requirement: Layers come from the design images
Every layer image SHALL be cut from Raymond's final-design images: the front figure from the goofy and professional front views, the side figure from the goofy and professional side views made for posing plus a side view without the near flipper. The body parts come from the goofy view (the side figure's body from the view without the flipper), the side flipper from where the goofy view differs from the one without it, and the tie and the glasses (with the calmer professional eyes) from where the professional view differs from the goofy one. The cutting SHALL be done by a script in the repo, so the same images always give the same layers.

#### Scenario: Layers in place
- **WHEN** the rig config in the repo is checked
- **THEN** every layer of both rigs points to an existing image cut from the final design

#### Scenario: Cutting again
- **WHEN** the cutting script is run again on the same images
- **THEN** it produces the same layer images and the same rig config

#### Scenario: A swinging flipper
- **WHEN** the side figure's flipper is turned to the end of its range
- **THEN** the body where the flipper was at rest shows painted body, not a copy of the flipper

#### Scenario: Images that don't line up
- **WHEN** a professional view is not the same size as its goofy view
- **THEN** the script stops with a message instead of producing misaligned accessories
