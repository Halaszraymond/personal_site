# Werkafspraken voor Claude Code

- **Lees eerst `README.md`.** Daar staan het concept, alle besluiten en de fases. Het is de bron van waarheid: wijzigt er een besluit, werk dan eerst de README bij.
- **Taal:** praat Nederlands met Raymond. Code, commits en codecommentaar zijn in het Engels. Sitecontent komt in NL, HU en EN.
- **Werk per fase** (README §7) en vink af wat klaar is. Begin niet aan een volgende fase zonder akkoord.
- **De keizer bouwen we samen:** maak eerst de speelplaats met schuifjes (fase 1) en laat Raymond kiezen. Leg zijn gekozen waarden vast in een config-bestand.
- **Origineel personage:** de keizer mag niet lijken op bestaande pinguïnpersonages of -mascottes.
- **Bouwlogboek:** noteer na elke werksessie in `docs/making-of.md` wat er besloten en gebouwd is, met screenshots waar mogelijk. Dit wordt later de case study "deze website".
- **Kwaliteit:** respecteer `prefers-reduced-motion`, houd inhoud in HTML (niet alleen in canvas), test op mobiele breedte, en mik op Lighthouse ≥ 90.
- **Codeerafspraken (README §5.4) zijn verplicht.** De belangrijkste:
  - Raymond moet elke regel kunnen begrijpen en uitleggen. Hij kent Python/R/SQL goed en TypeScript minder: schrijf duidelijk, met een kopcommentaar per bestand, *waarom*-commentaar, en waar nuttig een vergelijking met Python. Leesbaarheid gaat nooit ten koste van kwaliteit.
  - TypeScript `strict`, geen `any`. Python met Ruff + mypy.
  - Elke nieuwe logica komt met tests. Een taak is pas klaar als lint, type check, alle tests, de build, Playwright en Lighthouse groen zijn.
  - Houd `docs/architecture.md` en `docs/glossary.md` bij als de structuur verandert of er nieuwe begrippen bijkomen.
  - Voeg geen dependency toe zonder het aan Raymond te vragen en uit te leggen waarom.
- **Leg uit wat je bouwt:** sluit elke taak af met een korte uitleg in gewone taal van hoe het werkt, zodat Raymond het leert en het kan navertellen.
- **Commits:** kleine, beschrijvende commits. Werk op een feature-branch en push alleen als Raymond dat vraagt.
- **Raak het `stamlijst`-subdomein of de bestaande DNS niet aan** zonder expliciete vraag.
