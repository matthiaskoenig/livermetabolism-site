# Projektoutput - KI-gestützte Aktualisierung der Forschungsgruppen-Website

**Website:** [livermetabolism.com](https://livermetabolism.com)
**Aktueller Release:** 0.10.2, September 2026

## Projektidee

Im Projekt wurde die Website der Forschungsgruppe König als Kommunikationssystem neu aufgebaut. Agentische KI-Workflows unterstützten die Analyse des alten Auftritts, die Strukturierung und Redaktion der Inhalte, die technische Migration, die Fehlersuche und die Qualitätssicherung. Die Website wurde dadurch nicht autonom von einer KI betrieben: Fachliche Entscheidungen, Quellenprüfung, Bildrechte, Datenschutz und Veröffentlichungsfreigabe blieben menschlich verantwortlich.

## Umgesetzte Ergebnisse

### Kommunikationskonzept und Zielgruppen

- Zielgruppen und ihre Informationsbedürfnisse ermittelt: Öffentlichkeit, Patientinnen und Patienten, Ärztinnen und Ärzte, Studierende, Kooperationen, Förderorganisationen, Fachkollegium und Medien.
- Vision, Positionierung und vier Kernbotschaften formuliert.
- Fünf Forschungsbereiche als Orientierungssystem eingeführt: Digital Twins, AI, Digital Pathology, Pharmacometrics und Open & FAIR.
- Website als nachgelagerte Anlaufstelle für LinkedIn, Vorträge, Poster, Publikationen und persönliche Kontakte positioniert.

### Inhalte und Struktur

- Personen, Publikationen, Projekte, Software, News, Lehre und Veranstaltungen gesammelt, gekürzt, vereinheitlicht und miteinander verknüpft.
- Redundante Inhalte von der Startseite entfernt; News auf eine eigene Kartenübersicht verschoben.
- Projekte, Software, Funding und Editorial Roles unter Research gebündelt.
- Teamseite in aktuelle Mitglieder und Alumni gegliedert.
- Standardisierte Detailansichten und Querverweise für Personen, Publikationen, Projekte, Software und News eingeführt.
- Eine News-Meldung zum Willkommenstag der Universität zu Lübeck ergänzt, mit dem Hauptbild des Ursprungsartikels und Credit für Olaf Malzahn.

### Design und Usability

- Responsive Layouts für Desktop, Tablet und Smartphone umgesetzt.
- Logo, Favicon, Typografie, Farbpalette, Icons und Grafiken für Forschungsbereiche entwickelt.
- Startseite als fokussierter One-Pager mit Vision, Kennzahlen, Team, Einstiegskarten und Forschungsbereichen gestaltet.
- Suchfunktion, Netzwerkgraph, mobile Navigation und zugängliche Detaildialoge ergänzt.
- Bilder optimiert und Kontaktinformationen im Footer gebündelt.

### Daten und Technik

- Migration von Jekyll zu Astro mit TypeScript, Vue und Tailwind.
- YAML als zentrale Datenbasis mit eindeutigen IDs, Tags und Beziehungen etabliert.
- Pydantic- und Zod-Schemas sowie automatische Prüfungen für Daten, Bilder, PDFs und Querverweise eingeführt.
- Pull-Request-Checks, Unit-Tests, Browsertests, Release Notes und tägliche Daten-Workflows eingerichtet.
- GitHub-, Google-Scholar- und OpenAlex-Snapshots für aktuelle Kennzahlen integriert.
- `search.json`, `robots.txt`, `llms.txt` und `llms-full.txt` für Auffindbarkeit durch Suchmaschinen und KI-Systeme erzeugt.

### Sicherheit und Verantwortung

- Content-Security-Policy, sichere URL-Grenzen, Datenvalidierung und sichere Detailrouten umgesetzt.
- Google Analytics hinter Einwilligung geschaltet; Widerruf deaktiviert die laufende Messung und entfernt Analytics-Cookies.
- Datenschutzseite um Google Fonts, GitHub-Snapshots und YouTube-Ressourcen ergänzt.
- Nginx-Weiterleitungen für tiefe HTTP-Pfade, Query-Strings und ACME-Challenges geprüft.
- KI-generierte Vorschläge werden vor Veröffentlichung durch Tests und menschliches Review kontrolliert.

## Agentischer Arbeitsprozess

Der wiederholbare Prozess besteht aus Auftrag, Analyse, Redaktion, Umsetzung, unabhängiger Prüfung und menschlicher Freigabe. Jeder Agent erhält einen begrenzten Kontext und eine konkrete Aufgabe. Ergebnisse werden als Diff, Test, Quelle oder Prüfbericht sichtbar gemacht. Dadurch lassen sich KI-Vorschläge zurückweisen, verbessern oder erneut ausführen, ohne die Kontrolle über den Inhalt zu verlieren.

## Status und Nachweis

- Release 0.10.2 veröffentlicht und auf GitHub Pages deployed.
- 448 JavaScript-Tests, 36 Python-Tests und 50 Browsertests bestanden.
- 394 Inhaltseinträge in 16 Tabellen validiert.
- Nginx-Konfigurationen mit 120 lokalen HTTP-Prüfungen getestet.
- `npm audit`: keine bekannten Schwachstellen in 560 Abhängigkeiten.

## Offene nächste Schritte

- Nutzungsdaten nach mehreren Monaten systematisch auswerten.
- Social-Media-Entwürfe aus News kontrolliert vorbereiten.
- Live-Daten aus PK-DB und interaktive Werkzeuge wie visFEM prüfen.
- Pydantic- und Zod-Schema langfristig aus einer gemeinsamen Spezifikation ableiten.
- Deployment mit atomarem Releasewechsel und Rollback ausbauen.

## Zusammenfassung

Das Projekt zeigt, wie agentische KI-Workflows Wissenschaftskommunikation praktisch unterstützen können. Durch die Verbindung von Zielgruppenanalyse, redaktioneller Arbeit, strukturierter Datenpflege, moderner Webtechnik und automatisierter Qualitätssicherung wurde aus einem veralteten Webauftritt eine aktuelle, verständliche und wartbare Forschungswebsite. Die KI beschleunigt die Arbeit und hilft, Inkonsistenzen zu finden; Verantwortung und Freigabe bleiben beim Menschen.
