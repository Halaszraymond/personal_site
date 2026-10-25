# halaszraymond.com — portfolio v2

De nieuwe versie van halaszraymond.com: een portfolio met een echte wow-factor, gericht op werkgevers, rond één origineel personage: **een vissende keizerspinguïn in 3D**.

> Status: concept staat vast, bouw nog niet begonnen. Dit document is de bron van waarheid. Wijzigt er een besluit, pas dan eerst dit bestand aan.

---

## 1. Doel en publiek

- **Wat:** een portfoliosite die mensen onthouden en doorsturen.
- **Voor wie:** werkgevers en recruiters (data / data science / analytics), plus iedereen die Raymond wil leren kennen.
- **Wat ze moeten meenemen:** Raymond vindt patronen in rommelige data, bouwt dingen zelf van begin tot eind, en doet dat in drie talen.
- **Must-haves voor werkgevers:** case studies (probleem → aanpak → resultaat), een duidelijke contactroute en een cv-download.

## 2. Het concept: de vissende pinguïn

**De kern.** *Visser* (Nederlands) en *Halász* (Hongaars) betekenen allebei "visser". Raymond vist patronen uit data. Een keizerspinguïn jaagt door te duiken: hij is de diepst duikende vogel ter wereld en komt tot meer dan 500 meter. De site is daarom **één duik**, en de pinguïn neemt de bezoeker mee naar beneden.

### 2.1 De keizer (het personage)

- **Soort:** keizerspinguïn (*Aptenodytes forsteri*).
- **Stijl:** **gestileerd low-poly 3D**, volledig in code gebouwd (Three.js), geen gekocht model. Hij moet lezen als design, niet als stockmodel.
- **Herkenningspunten** om te behouden in de stilering: zwarte kop en rug, witte buik, de **goud-oranje oorvlekken** die naar de borst toe vervagen, en een slanke snavel met een oranje/roze streep op de ondersnavel.
- **Eerst bouwen we de speelplaats:** een pagina met de keizer en schuifjes voor de lijfvorm, de grootte van kop en snavel, de kleur en intensiteit van de nekvlek, de hoekigheid (aantal polygonen) en de zwembeweging. Raymond speelt ermee tot hij goed voelt, en die waarden worden de definitieve config.
- **Animaties:** staan op het ijs (idle), duiken, zwemmen (vleugelslag), een vis najagen, buigen bij een klik, met de kop de cursor volgen, en zich als finale uit het water lanceren met een spoor van luchtbelletjes.

### 2.2 Naam: Keizer Kálmán ✅

Nederlands "keizer" + de Hongaarse naam Kálmán. Rudolf Kálmán was een Hongaarse wiskundige; het **Kalman-filter** schat uit ruisende data waar iets heen beweegt, precies wat een jagende pinguïn doet met een vis. Dat verhaal mag terugkomen in de "Wie ik ben"-sectie of in de making-of.

In de rest van dit document: **Kálmán** of **de keizer**.

### 2.3 De duik: verhaallijn en secties

Scrollen = duiken. Een **dieptemeter** aan de zijkant loopt mee.

| Diepte | Sectie | Inhoud | Sfeer |
|---|---|---|---|
| 0 m | **Het ijs (hero)** | De keizer op de ijsrand, met een school lichtgevende vissen onder water die samen "Raymond Visser / Halász Raymond" vormen. Duikt bij de eerste scroll. | Ijsblauw, zuiderlicht (aurora australis) |
| 0–100 m | **Wie ik ben** | Visser = Halász, Nederland → Boedapest, drie talen. Vissen ordenen zich tot grafieken (zie 2.4). | Licht valt nog door het water |
| 100–250 m | **Werk** | FrieslandCampina, Leger des Heils, eerder EY. | Schemerzone |
| 250–400 m | **Studie** | ELTE MSc, Windesheim BSc + Honours. | Bijna donker |
| 400–564 m | **De vangst** | Projecten (zie §4), lichtgevend zoals diepzeedieren. Plus de **sonar** met live Pi-cijfers. | Inktzwart, bioluminescent |
| ↑ | **Contact** | De keizer schiet omhoog en lanceert zich uit het water het ijs op. LinkedIn, GitHub, e-mail, cv-download. | Terug naar het licht |

**De bodem ligt op 564 m** ✅: de diepste nauwkeurig gemeten duik van een vogel ooit, door een keizerspinguïn voor de kust van Oost-Antarctica. Het onderzoek, met 93 pinguïns met diepte-tijdrecorders, kwam van de Australian Antarctic Division en Phillip Island Nature Park en werd gepubliceerd in *Polar Biology* (2006). Bron: [Guinness World Records – Deepest dive by a bird](https://www.guinnessworldrecords.com/world-records/deepest-dive-by-a-bird). Idee: onderaan een klein bordje "564 m · wereldrecord · keizerspinguïn".

Aanvullend (bron: [BBC Science Focus](https://www.sciencefocus.com/planet-earth/penguin-depth-swim), nog verifiëren): een gezenderde keizer bleef **ruim een half uur** onder water, en normale duiken gaan naar **100–200 m**, precies de diepte van de sectie "Werk", waar de keizer dagelijks jaagt.

### 2.4 Het datastuk (wat de site "data" maakt)

- **Duikprofiel:** de dieptemeter tekent tijdens het scrollen een lijn, net als echte grafieken van gezenderde keizerspinguïns. Het bezoek van de gebruiker wordt zo een dataset. Onderaan of bij contact kan het eigen profiel getoond worden ("jouw duik: 2:14 min, max 564 m — Kálmán houdt het ruim een half uur vol").
- **Vissen worden grafieken:** de school die de keizer bijeendrijft, valt in "Wie ik ben" op zijn plek als visualisaties van talen (NL/HU/EN), tools (Python, R, SQL, Java, Power BI, Databricks, Grafana) en de route Nederland → Boedapest.
- **Sonar:** live cijfers van Raymonds Raspberry Pi-homeserver (uptime, door Pi-hole geblokkeerde verzoeken, eventueel temperatuur), weergegeven als sonarmeting. Zie §5.3 voor de veilige opzet.

### 2.5 Persoonlijkheid en verrassingen

- De keizer volgt de cursor met zijn kop en buigt als je hem aanklikt.
- Als de bezoeker stopt met scrollen, zweeft hij rustig en jaagt hij af en toe een visje na.
- Geheime toetscombinatie (bijv. de Konami-code) → een hele kolonie op het ijs.
- **404-pagina:** de keizer dobbert verdwaald op een ijsschots.
- Optioneel onderwatergeluid, **standaard uit**, met een duidelijke knop.

### 2.6 Kleur en typografie

- **Palet:** ijswit → diepzeeblauw → inktzwart (de kleur volgt de diepte), met het **goud-oranje van de oorvlek** als enige accentkleur: knoppen, dieptemeter, kernwoorden.
- Alle tekst moet WCAG AA-contrast halen, ook in de donkerste laag.
- **Typografie:** nog te kiezen. Richting: één karaktervol display-font voor koppen en namen, één heel leesbaar font voor tekst, plus een monospace voor de dieptemeter en data-labels. Moet Hongaarse tekens goed weergeven (ő, ű, á, é).

## 3. Inhoud over Raymond

Uitgangspunt (van de huidige site, **laten verifiëren voor publicatie**):

- **Naam:** Raymond Visser / Halász Raymond. Woont en werkt in Boedapest.
- **Studie:**
  - MSc Survey Statistics and Data Analytics, ELTE Boedapest (2025–2027), VSBfonds-beurs.
  - BSc ICT – Applied Data Science & AI, Windesheim (2022–2025), met Honours Programme Technology & Society (2023–2024).
  - Eerder: accountancy aan Windesheim (niet afgerond).
- **Werk:**
  - HR Trainee, HR Time & Attendance, FrieslandCampina Boedapest (parttime, sinds sep 2026).
  - Junior AI Specialist + afstudeerstage, Leger des Heils (data engineering en analytics in Azure Databricks en Grafana, opzet van een datascienceteam, Luisterlijn, Elasticsearch).
  - Auditstage EY, Utrecht (2020).
- **Overig:** vrijwilligersreis Bulgarije (2024).
- **Talen:** Nederlands (moedertaal), Hongaars (moedertaal/tweetalig), Engels (C1).
- **Tools:** Python, R, SQL, Java, Power BI, Azure Databricks, Grafana.
- **Links:** LinkedIn `visser-raymond`, GitHub `Halaszraymond`. E-mailadres op de site: nog te kiezen.

## 4. Projecten: de vangst

Alle code is van Raymond en mag gebruikt worden als bron voor de case studies.

### Uitgelicht (3 volledige case studies)

1. **r-Frica Predicts:** voorspelt de uitslagen van de Afrika Cup (AFCON). Idee: een interactief element, bijvoorbeeld de voorspelde kansen per wedstrijd.
2. **Raspberry Pi-homeserver:** Pi-hole, Tailscale, Jellyfin, Uptime Kuma met WhatsApp-meldingen, Cloudflare Tunnel, SSH-hardening, en een kiosk-dashboard. Met de live sonar.
3. **Deze website:** vibe-codingproject, gebouwd met Claude Code. Een "making of": van concept tot de keizer, met screenshots van de speelplaats en tussenversies. **Houd daarom vanaf dag 1 een bouwlogboek bij** (`docs/making-of.md`) met beslissingen en screenshots.

Vorm per case study: één zin pitch · probleem · aanpak · resultaat/impact · tools · links (repo/demo) · 1–3 beelden.

### Meer vangst (kaarten)

- **Blocky:** eigen applicatie (onder meer een instellingen-tab met thema's en lettertypes).
- **Notificatiesystemen:** automatische meldingen bij wijzigingen op webpagina's en prijsalerts als een product onder een drempelprijs komt.
- **Veiligheidsregio IJsselland:** datascienceproject.
- **4Vitae:** datascienceproject.
- **Leger des Heils:** datascienceproject (patronen in zorg- en ondersteuningstrajecten).

### Materiaal nog nodig (per project)

- [ ] Repo-link(s) of toegang tot de code
- [ ] Probleem, aanpak, resultaat in een paar zinnen
- [ ] Screenshots / grafieken / demo
- [ ] Wat er wel en niet publiek mag (namen van opdrachtgevers mogen; ruwe data niet tonen)

## 5. Techniek

### 5.1 Stack

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Framework | **Astro** | Snel, statisch, goede i18n-routing, islands voor het 3D-deel |
| 3D | **Three.js** | De keizer, de visschool en het water |
| Scroll/animatie | **GSAP + ScrollTrigger**, eventueel Lenis voor smooth scroll | Dieptegestuurde animaties |
| Talen | **NL / HU / EN** via Astro i18n | `/nl`, `/hu`, `/en`; standaard op basis van de browsertaal, met een schakelaar |
| Grafieken | D3 of eigen SVG | Datavisualisaties in "Wie ik ben" en het duikprofiel |
| Hosting | **Cloudflare Pages** | Domein staat al bij Cloudflare; previewlink per branch |
| Taal (site) | **TypeScript (strict)** | Zie §5.4 waarom geen Python in de browser |
| Taal (data) | **Python** in `data/` | Scripts die bij het bouwen de data voor grafieken en r-Frica-voorspellingen als JSON genereren |
| Taal (Pi) | **Python (FastAPI)** | Het read-only sonar-eindpunt op de Raspberry Pi |
| Analytics | **Cloudflare Web Analytics** | Zonder cookies, dus geen cookiebanner. Eén schakelaar in Cloudflare Pages |

### 5.2 Kwaliteitseisen

- **Prestaties:** Lighthouse ≥ 90 op mobiel. Het 3D-deel wordt lui geladen; de eerste weergave is direct zichtbaar zonder te wachten op WebGL.
- **Fallback:** bij `prefers-reduced-motion`, geen WebGL of een zwak toestel krijg je een mooie statische versie (gerenderde stills van de keizer). Nooit een kapotte of lege site.
- **Toegankelijkheid:** alle inhoud is gewone, leesbare HTML (niet in canvas), toetsenbord-navigeerbaar, met alt-teksten en AA-contrast.
- **Mobiel:** eerst ontworpen voor telefoons, met touch in plaats van een cursor.
- **SEO/delen:** goede titel, beschrijving en Open Graph-afbeelding (de keizer op het ijs), per taal.

### 5.3 Live Pi-cijfers (sonar): veilige opzet

- De Pi publiceert **alleen** een klein, read-only JSON-eindpunt met geaggregeerde cijfers (geen IP's, geen domeinnamen, geen logs).
- Bereikbaar via een **Cloudflare Tunnel** op een eigen subdomein. Het bestaande `stamlijst`-subdomein en de tunnel daarvan blijven ongemoeid.
- De site leest het eindpunt met caching (bijv. elke 60 s) en toont "laatste meting" als de Pi offline is, zodat de site nooit hapert.

### 5.4 Codeerafspraken

**Uitgangspunt:** topkwaliteit, en tegelijk zo geschreven dat Raymond (sterk in Python/R/SQL, nieuw in TypeScript) elke regel kan lezen en in een sollicitatiegesprek kan uitleggen. Werkgevers lezen deze repo ook.

**Waarom TypeScript voor de site en geen Python in de browser:** Python in de browser (PyScript/Pyodide) laadt eerst een Python-runtime van meerdere MB's. Dat is funest voor de eerste indruk en voor Lighthouse, en het heeft geen volwaardige 3D-bibliotheek. Server-frameworks zoals Streamlit of Reflex hebben een draaiende server nodig en zijn niet gemaakt voor dit soort WebGL-ervaringen. Python krijgt daarom de plekken waar het het sterkst is: de **datapijplijn** (`data/`) en het **Pi-eindpunt**. Zo laat de repo beide talen op hun best zien.

**Leesbaarheid**
- TypeScript in `strict`-modus; geen `any`.
- Elk bestand begint met een kort commentaarblok: wat het doet en hoe het in het geheel past.
- Commentaar legt het *waarom* uit. Bij 3D- en animatiecode wordt ook de wiskunde of het concept kort uitgelegd (bijv. "quaternion = rotatie zonder gimbal lock").
- Kleine functies met beschrijvende namen, benoemde constanten in plaats van magische getallen, en geen slimme one-liners als een duidelijke variant even goed is.
- Waar TypeScript iets doet dat in Python anders werkt, een korte vergelijking in het commentaar ("zoals een dataclass in Python").
- `docs/architecture.md`: een overzicht met diagram van hoe de onderdelen samenhangen (content → pagina's, scroll → diepte → scene, data-scripts → JSON → grafieken).
- `docs/glossary.md`: 3D- en frontendbegrippen in gewone taal.

**Structuur**
- `src/content/`: teksten, projecten en vertalingen (Markdown/JSON, Astro content collections). Inhoud aanpassen = nooit code aanpassen.
- `src/components/`: UI-componenten.
- `src/scene/`: alles 3D, opgesplitst in `kalman/` (model, config, animaties), `school/` (vissen), `environment/` (water, licht, zuiderlicht) en `scroll/` (diepte → scene).
- `src/i18n/`, `src/lib/` (pure logica, goed testbaar), `data/` (Python), `docs/`, `tests/`.
- Kálmán is **config-gedreven**: vorm en kleur in één bestand (uitkomst van de speelplaats).

**Kwaliteit en tooling**
- ESLint + Prettier (TS), Ruff + mypy (Python). Automatisch bij opslaan en bij elke commit (pre-commit hooks).
- Minimale dependencies: elk pakket moet zijn plek verdienen. Renovate/Dependabot houdt ze bij.
- Prestatiebudgetten worden **afgedwongen**, niet alleen gehoopt: basis-JS ≈ 50 KB, Three.js en de scene in een aparte, uitgestelde chunk, Kálmán low-poly, de visschool via instancing, 60 fps op een gemiddelde telefoon, gecapte pixel ratio, en geen rendering als het tabblad niet zichtbaar is.

**Testen** (kwaliteit gaat voor; "overkill" bestaat niet)
- **Unit tests (Vitest):** alle pure logica, zoals diepte-mapping, duikprofiel, i18n en config-validatie.
- **Python-tests (pytest):** de data-scripts en het Pi-eindpunt.
- **End-to-end (Playwright):** elke pagina in NL/HU/EN, zonder consolefouten, met werkende navigatie en taalschakelaar, de reduced-motion- en no-WebGL-fallback, en mobiele en desktop-breedte.
- **Visuele regressie:** screenshot-baselines per sectie; een onbedoelde visuele wijziging laat de test falen.
- **Toegankelijkheid:** axe-checks in Playwright op elke pagina.
- **Lighthouse CI** met harde drempels (≥ 90 in alle vier categorieën) en een **bundle-size check**.

**CI en Git**
- GitHub Actions bij elke push en PR: lint → type check → unit tests → Python-tests → build → Playwright → Lighthouse. Een rode build wordt niet gemerged.
- `main` is altijd deploybaar en live. Werk gebeurt op feature-branches met een eigen Cloudflare-preview, via pull requests.
- Conventional commits (`feat:`, `fix:`, `docs:`, `test:`).

**Privacy en beveiliging**
- Geen cookies en geen tracking behalve Cloudflare Web Analytics (cookieloos).
- Security headers (CSP, HSTS, enz.) via een `_headers`-bestand in Cloudflare Pages.
- Pi-eindpunt: alleen geaggregeerde cijfers (§5.3), met rate limiting.

## 6. Repo, hosting en live gaan

- **Nieuwe repo** (bijv. `Halaszraymond/portfolio`). De huidige site in de `halaszraymond.github.io`-repo blijft live tot v2 klaar is en dient als fallback.
- **Ontwikkelen:** lokaal in VS Code met Claude Code. `npm run dev` voor de dev-server.
- **Previews:** de repo koppelen aan Cloudflare Pages; elke branch krijgt een eigen preview-URL.
- **Live gaan (fase 4):**
  1. In Cloudflare Pages het custom domain `halaszraymond.com` (en `www`) toevoegen.
  2. In Cloudflare DNS de vier A-records naar GitHub (185.199.108–111.153) en de `www`-CNAME naar `halaszraymond.github.io` verwijderen. Pages maakt de juiste records aan.
  3. Het `stamlijst`-record **niet** aanraken.
  4. In de oude repo GitHub Pages uitzetten of het custom domain verwijderen, zodat er geen conflict ontstaat.

## 7. Fases

- [ ] **Fase 0: opzet.** Repo, Astro-skelet (TS strict), alle tooling en de volledige CI-pijplijn uit §5.4 (eerst met één lege testpagina, zodat alles vanaf dag 1 groen moet blijven), Cloudflare Pages-preview, `docs/making-of.md`, `docs/architecture.md`.
- [ ] **Fase 1: de keizer.** Speelplaats met schuifjes → Raymond kiest de vorm → definitieve config. Daarna de animaties (idle, duiken, zwemmen, lanceren). Naam: Keizer Kálmán.
- [ ] **Fase 2: de duik.** Alle secties met dieptemeter, kleurverloop, visschool, en vissen die grafieken worden. Eerst met tijdelijke tekst.
- [ ] **Fase 3: inhoud.** Echte teksten, de 3 case studies, de "meer vangst"-kaarten en een cv-download.
- [ ] **Fase 4: afwerking.** NL/HU/EN, mobiel, fallback, prestaties, toegankelijkheid, SEO. Daarna live gaan.
- [ ] **Fase 5: extra's.** Live Pi-sonar, kolonie-easter-egg, 404 op de ijsschots, geluid, duikprofiel van de bezoeker.

## 8. Open beslissingen

- [x] Naam van de keizer: Keizer Kálmán (§2.2)
- [x] Recordduikdiepte geverifieerd: 564 m, Guinness World Records (§2.3)
- [ ] Lettertypes (§2.6)
- [ ] E-mailadres en cv-bestand voor de contactsectie
- [ ] Repo-naam
- [ ] Eventueel: een foto van Raymond, ja of nee, en waar
