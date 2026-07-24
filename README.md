# ⛳ Rochushof Caddie

Eine kleine **Progressive Web App** (PWA), die dich auf der Golfrunde im
**GC Rochushof** begleitet: Schläge zählen, Stableford live berechnen, Runden
speichern und einen **inoffiziellen Handicap-Index** fortschreiben.

Läuft auf dem iPhone-Home-Bildschirm, funktioniert **vollständig offline**
(der Platz hat schlechten Empfang) und speichert alle Daten **nur lokal** auf
dem Gerät (`localStorage`). Kein Backend, kein Login, keine Cloud.

> **Wichtig:** Der berechnete Handicap-Index ist **inoffiziell**. Offiziell
> zählt ausschließlich der vom DGV geführte Index. Diese App bildet die
> WHS-Formeln nach, berücksichtigt aber z. B. keinen PCC-Wetterfaktor.

## Funktionen

- **Runden-Setup:** Handicap-Index (wird gemerkt), Abschlag Gelb/Rot, 9 oder
  18 Loch. Course Handicap wird sofort inklusive **Rechenweg** angezeigt (zum
  Abgleich mit der Club-Tabelle).
- **Zähl-Modus:** ein Loch pro Bildschirm mit Par, Länge, Stroke-Index,
  Vorgabeschlägen, großen +/−-Buttons, **live Stableford & Netto** und einem
  „Ball aufnehmen"-Hinweis beim Netto-Doppelbogey. Loch-Übersicht mit
  Direktsprung. Eine angefangene Runde übersteht das Schließen der App.
- **Scorecard:** Tabelle aller Löcher, Summen, Vergleich mit dem Soll
  (36 bzw. 18 Punkte), Score Differential und neuer rechnerischer Index.
- **Archiv & Statistik:** gespeicherte Runden, Index-Verlauf und
  Stableford-Verlauf als Graph, Auswertung pro Loch.
- **Export/Import:** alle Daten als JSON (Teilen-Dialog → iCloud Drive) sowie
  CSV-Export der Runden für Excel.

## Platzdaten (fest hinterlegt)

Par 72 (2 × 36). Abschläge:

| Abschlag | Slope | Course Rating | Länge 18 Loch |
| --- | --- | --- | --- |
| Gelb (Herren) | 133 | 69,0 | 5.468 m |
| Rot (Damen) | 125 | 69,2 | 4.678 m |

Die Platzdaten liegen gekapselt in [`src/data/course.js`](src/data/course.js).
Weitere Plätze lassen sich als zusätzliche Einträge im `COURSES`-Array
ergänzen. Falls der Club offizielle **9-Loch-Ratings** ausweist, können diese
je Abschlag unter `slope9`/`cr9` eingetragen werden – die Rechenlogik nutzt sie
dann automatisch.

## Lokaler Start

Voraussetzung: Node.js ≥ 18.

```bash
npm install       # Abhängigkeiten (nur Build-Tooling, keine Runtime-Deps)
npm run dev       # Dev-Server (http://localhost:5173/rochushof-caddie/)
npm test          # Unit-Tests der Rechenlogik + UI-Smoke-Tests
npm run build     # Produktions-Build nach dist/
npm run preview   # gebautes Ergebnis lokal servieren
npm run icons     # App-Icons aus public/icons/favicon.svg neu erzeugen
```

## Deployment auf GitHub Pages

Das Repo ist als **Projektseite** angelegt und wird unter
`https://<user>.github.io/rochushof-caddie/` ausgeliefert. Der Basis-Pfad
`/rochushof-caddie/` ist in [`vite.config.js`](vite.config.js) gesetzt.

Der Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
deployt bei **jedem Push auf `main`** automatisch: `npm ci → npm test →
npm run build → Upload `dist/` → GitHub Pages`.

Einmalig in den Repo-Einstellungen aktivieren:
**Settings → Pages → Build and deployment → Source: „GitHub Actions"**.

> Trägt das Repo einen anderen Namen, muss `base` in `vite.config.js` und
> `scope`/`start_url` im Manifest entsprechend angepasst werden.

## Auf dem iPhone installieren

1. Die Seite in **Safari** öffnen:
   `https://<user>.github.io/rochushof-caddie/`
2. Auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben) tippen.
3. **„Zum Home-Bildschirm"** wählen und bestätigen.

Danach startet die App im Vollbild (standalone, Portrait) und funktioniert
offline. Beim ersten Öffnen mit Empfang werden alle Dateien gecacht.

## Datensicherung

Alle Daten liegen **nur auf dem Gerät**. Es gibt keine automatische Sicherung.
Deshalb regelmäßig unter **Daten sichern → „Alles als JSON sichern"**
exportieren und die Datei z. B. in **iCloud Drive** ablegen. Über
**„JSON-Datei wählen"** lässt sie sich – wahlweise zusammenführend oder
ersetzend – wieder importieren.

## Golf-Formeln (WHS)

Die Rechenlogik ist in reine, getestete Funktionen ausgelagert:

- **Course Handicap 18:** `CH = Index × (Slope ÷ 113) + (CR − 72)`
- **Course Handicap 9:** `CH9 = (Index ÷ 2) × (Slope ÷ 113) + (CR ÷ 2 − 36)`
- **Vorgabeverteilung** nach Stroke-Index (inkl. zweiter Runde bei CH > 18 und
  Abzug auf den leichtesten Löchern bei Plus-Handicaps)
- **Stableford:** `max(0, 2 + Par + Vorgabe − Brutto)`
- **Netto-Doppelbogey-Deckel:** `Par + Vorgabe + 2`
- **Score Differential:** `(113 ÷ Slope) × (Adjusted Gross − CR)`
- **Index:** Durchschnitt der besten 8 der letzten 20 Differentials, mit
  WHS-Staffel für weniger als 20 Runden; zwei 9-Loch-Runden ergeben zusammen
  ein 18-Loch-Differential.

Siehe [`src/core/`](src/core/) und die Tests in [`test/`](test/).

## Projektstruktur

```
src/
  data/course.js     Platzdaten (kapselt Rochushof, erweiterbar)
  core/format.js     Rundung & Komma-Zahlen
  core/scoring.js    Course Handicap, Vorgabe, Stableford, Netto-Doppelbogey
  core/handicap.js   Score Differential, Best-8-of-20, 9-Loch-Logik
  core/round.js      Runden-Assemblierung & Auswertung
  state/store.js     localStorage, Export/Import (JSON/CSV)
  ui/                Views (Home, Setup, Play, Scorecard, Archiv, Statistik, Daten)
  main.js            Hash-Router + Shell
test/                Vitest-Tests (Rechenlogik + UI-Smoke)
public/              manifest.json, Icons
.github/workflows/   Pages-Deployment
```

## Technik

Vanilla HTML/CSS/JavaScript, gebündelt mit **Vite**; PWA/Service-Worker über
`vite-plugin-pwa` (Workbox precacht zur Build-Zeit – keine Laufzeit-CDNs).
Systemfonts, damit die App offline und ohne externe Abhängigkeiten läuft.

## Später vorgesehen

Architektonisch berücksichtigt, aber (noch) nicht gebaut: GPS-Schlagweiten\-
messung pro Schlag und weitere Golfplätze.
