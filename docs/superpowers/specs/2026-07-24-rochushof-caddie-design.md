# Rochushof Caddie – Design

Stand: 2026-07-24

## Zweck

Golf-PWA für den GC Rochushof (9-Loch-Platz, doppelt für 18 Loch). Begleitet
die Runde: Schläge zählen, Stableford live, Runden speichern, inoffiziellen
Handicap-Index fortschreiben. iPhone-Home-Bildschirm, vollständig offline,
alle Daten lokal (`localStorage`). Kein Backend/Login.

## Entscheidungen

- **Build:** Vite + Vitest. **Deployment:** GitHub Pages als Projektseite unter
  `/rochushof-caddie/` (base gesetzt, relative Pfade). Repo öffentlich.
- **PWA:** eigenes `manifest.json` (standalone, portrait), Service Worker via
  `vite-plugin-pwa` (Workbox precache = offline, keine Runtime-Deps),
  Golffahnen-Icon (SVG → PNG).
- **Icon-Motiv:** Golffahne auf Grün.

## Architektur & Modulgrenzen

Strikte Trennung von **reiner Rechenlogik** (kein DOM/Storage, unit-getestet)
und dünnem UI/State-Layer.

- `data/course.js` – Platzdaten, erweiterbar (COURSES-Array, optional `slope9/cr9`).
- `core/format.js` – kaufmännische Rundung, Komma-Parse/Format.
- `core/scoring.js` – Course Handicap 18/9, Vorgabeverteilung, Stableford,
  Netto-Doppelbogey, Adjusted Gross.
- `core/handicap.js` – Score Differential, Best-8-of-20 + WHS-Kleinserien,
  9-Loch-Paarung („wartend"), Index-Verlauf.
- `core/round.js` – Runden-Assemblierung/Auswertung/Archivierung.
- `state/store.js` – localStorage, Export/Import (JSON merge/replace, CSV).
- `ui/*` – Views (Home, Setup, Play, Scorecard, Archiv, Statistik, Daten),
  Hash-Router in `main.js`.

## Datenmodell (`localStorage`, ein JSON-Wurzelobjekt `rochushof.v1`)

```
{ version, settings{ handicapIndex, teeId, defaultHoles, courseId },
  activeRound|null, rounds[ { id, datum, courseId, teeId, holes, handicapIndex,
  ch, vorgaben[], bruttos[], adjGross, cr, slope, bruttoSumme, nettoSumme,
  stablefordSumme, differential|null } ] }
```

Export/Import = dieses Objekt als JSON; CSV wird aus `rounds` erzeugt.

## WHS-Formeln (reine Funktionen)

- CH18 = `Index × Slope/113 + (CR − 72)`, kaufmännisch gerundet.
- CH9 = `(Index/2) × Slope/113 + (CR/2 − 36)`; offizielle 9-Loch-Ratings
  austauschbar.
- Vorgabeverteilung nach Stroke-Index; zweite Runde bei CH > n; negative CH
  (Plus) ziehen auf leichtesten Löchern ab.
- Stableford = `max(0, 2 + Par + Vorgabe − Brutto)`; Netto-Doppelbogey-Deckel
  = `Par + Vorgabe + 2` (→ „Ball aufnehmen").
- SD = `(113/Slope) × (Adjusted Gross − CR)`, 1 NK; 9-Loch paarweise zu 18-Loch,
  sonst „wartend".
- Index = Ø beste 8 der letzten 20; WHS-Staffel für < 20; Kennzeichnung
  **inoffiziell**.

## UI-Fluss

Setup → Zähl-Modus (ein Loch/Screen, große +/−, live Stableford/Netto,
„Ball aufnehmen", Loch-Übersicht, Persistenz je Aktion, „fortsetzen?") →
Scorecard (Tabelle, Summen, Soll-Vergleich, SD, neuer Index) →
Archiv/Statistik (SVG-Graphen, Loch-Auswertung). Deutsch, Komma-Dezimal,
hoher Kontrast, ≥ 44pt Touch, Systemfonts.

## Qualität

Rechenlogik testgetrieben (Vitest): u. a. HCP 24,5/Gelb/18 = 26, 9-Loch,
Plus-Handicap, CH > 18, Score Differential, Best-8-of-20. UI-Smoke-Tests
(happy-dom) rendern jede View fehlerfrei.

## Später (nur vorgesehen)

GPS-Schlagweitenmessung pro Schlag; weitere Golfplätze.
