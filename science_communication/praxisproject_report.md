# Praxisprojekt-Bericht

**Start des Praxisprojekts / Anmeldung:** 08.01.2026  
**Abschluss / Berichtsabgabe:** 15.09.2026  
**Arbeitsaufwand:** 70 Arbeitseinheiten à 45 Minuten

## Vorbereitung und Planung

### Relevante Kurse

Die Planung und Umsetzung knüpften besonders an diese Kurse des Zertifikatsprogramms an:

- Kommunikationsstrategien in der Wissenschaftskommunikation
- Auf geht's! Mit klarem Konzept in die Wissenschaftskommunikation
- Sprechen auf den Punkt - Wissen klar formulieren
- Visual Communication Techniques for Scientists
- Slidewriting - Optimize your slides
- Designing a Graphic Abstract
- KI@TUB - Forschungsanträge schreiben mit ChatGPT

Die Kurse lieferten die Grundlagen für Zielgruppenanalyse, Kernbotschaften, verständliche Sprache, visuelle Hierarchien und einen reflektierten Einsatz generativer KI.

### Titel

**Agentische Workflows für Wissenschaftskommunikation: KI-gestützte Aktualisierung einer Forschungsgruppen-Website**

### Thema

Das Praxisprojekt untersucht, wie agentische, KI-gestützte Arbeitsabläufe die kontinuierliche Pflege und Weiterentwicklung einer wissenschaftlichen Website unterstützen können. Am Beispiel der Website der Forschungsgruppe König wurde die bestehende Jekyll-Website analysiert, ein Kommunikationskonzept entwickelt und die Website zu einer modernen, responsiven Astro-Anwendung weiterentwickelt.

Der Schwerpunkt lag nicht auf einer vollständig autonomen Veröffentlichung. KI wurde als arbeitsteilige Unterstützung eingesetzt: zur Strukturierung großer Informationsbestände, zum Auffinden von Inkonsistenzen, zur Entwicklung und Überprüfung von Code, zur Formulierung und Kürzung von Texten sowie zur Vorbereitung wiederholbarer Daten- und Qualitätssicherungsprozesse. Fachliche Aussagen, Quellen, Bildrechte, Daten und die finale Veröffentlichung blieben in menschlicher Verantwortung.

### Ergebnisse

Das Projekt brachte folgende konkrete Ergebnisse hervor:

- ein überarbeitetes Kommunikationskonzept mit Zielgruppen, Positionierung, Kernbotschaften, Kanälen und Erfolgskriterien;
- eine responsive Website unter [livermetabolism.com](https://livermetabolism.com) mit klarer Navigation, konsistentem visuellen System und eigener News-Seite;
- eine validierte, verknüpfte YAML-Datenbasis für Personen, Publikationen, Projekte, Software, News und weitere Inhalte;
- automatische Prüfungen von Daten, Querverweisen, Typen, Unit- und End-to-End-Funktionen;
- Suchfunktion, Standard-Detailansichten, Netzwerkgraph und strukturierte Ausgaben für Suchmaschinen und KI-Systeme;
- täglich aktualisierte Kennzahlen aus GitHub, Google Scholar und OpenAlex;
- Datenschutz-, Sicherheits- und Barrierefreiheitsverbesserungen;
- eine dokumentierte, wiederholbare Pflege- und Veröffentlichungsroutine mit Pull Requests, Tests, Release Notes und versionierten Releases.

### Lernziele

Am Ende des Projekts wollte ich:

1. ein wissenschaftliches Kommunikationsproblem systematisch analysieren und in Zielgruppen, Kernbotschaften und konkrete Nutzerwege übersetzen;
2. komplexe Forschungsinhalte auf unterschiedlichen Verständnisebenen verständlich, knapp und visuell konsistent darstellen;
3. agentische KI-Workflows so einsetzen, dass sie Recherche, Strukturierung, Programmierung und Qualitätskontrolle beschleunigen, ohne die fachliche Verantwortung zu ersetzen;
4. KI-generierte Vorschläge kritisch prüfen, Quellen und Daten nachvollziehbar halten und Risiken wie Halluzinationen, Datenschutzprobleme oder unsicheren Code erkennen;
5. eine größere Website mit wiederverwendbaren Komponenten, validierten Daten und automatisierten Tests nachhaltig pflegen können.

### Maßnahmen und Aktivitäten

Der geplante Arbeitsablauf war:

1. **Analyse und Recherche:** Bestandsaufnahme der alten Website, Benchmarking vergleichbarer Forschungsgruppen-Websites, Sichtung der vorhandenen Inhalte und Ermittlung der Zielgruppen.
2. **Konzeption:** Entwicklung von Mission, Vision, Kernbotschaften, Informationsarchitektur und visueller Leitidee.
3. **Daten- und Inhaltsarbeit:** Zusammenführen, Kürzen, Vereinheitlichen und Verknüpfen der Inhalte; Definition von Namens- und Validierungsregeln.
4. **Technische Umsetzung:** Migration von Jekyll zu Astro, Aufbau der Komponenten, responsives Design, Suche, Detailansichten, Netzwerkgraph und automatisierte Live-Daten.
5. **Agentische Qualitätssicherung:** Einsatz von KI zur Aufteilung von Aufgaben, Code-Review, Fehlersuche, Testentwurf und Sicherheitsprüfung; anschließend menschliche Prüfung aller relevanten Ergebnisse.
6. **Evaluation und Veröffentlichung:** Browser-, Inhalts- und Sicherheitstests, Überarbeitung nach visueller Prüfung, Release über Pull Request und Dokumentation der nächsten Schritte.

## Durchführung

### Projektablauf

Der Ablauf entsprach im Wesentlichen der Planung, wurde aber iterativ statt linear durchgeführt. Die Analyse und das Kommunikationskonzept bildeten den Rahmen. Während der Umsetzung wurden Datenmodell, Navigation und Detailansichten mehrfach angepasst, weil sich neue Querverbindungen, Dubletten und Inkonsistenzen zeigten.

Die KI-Unterstützung funktionierte am besten mit kleinen, überprüfbaren Arbeitspaketen: Ein Agent analysierte beispielsweise eine klar abgegrenzte Daten- oder Codegruppe, schlug Änderungen vor und formulierte Tests. Die Änderungen wurden anschließend im Kontext der gesamten Website geprüft. Besonders hilfreich waren automatisierte Tests, Browser-Szenarien und visuelle Screenshots, weil sie Vorschläge gegen das tatsächliche Nutzererlebnis prüften.

Hindernisse waren die Größe und Heterogenität des alten Datenbestands, unterschiedliche Anforderungen von Python- und TypeScript-Schemata, die Pflege großer Bild- und PDF-Bestände sowie die Abhängigkeit von externen Datenquellen. Diese Punkte führten zu zusätzlichen Validierungsregeln, Fallbacks und manuellen Prüfungen.

## Auswertung und Nachbereitung

**Kommunikationskonzept:** [communication_concept.md](communication_concept.md)  
**Projektoutput:** [project_output.md](project_output.md)  
**Website:** [livermetabolism.com](https://livermetabolism.com)

### Lerneffekte

Ich habe gelernt, dass eine gute wissenschaftliche Website zuerst ein Kommunikations- und erst danach ein Technikprojekt ist. Zielgruppen, Kernbotschaften und Nutzerwege müssen vor der Auswahl von Frameworks und Komponenten geklärt werden.

Technisch habe ich meine Fähigkeiten in Astro, TypeScript, Vue, YAML-Datenmodellen, automatisierter Validierung, Browser-Tests, Content-Security-Policy und responsivem Design erweitert. Im Umgang mit KI habe ich gelernt, Aufgaben so zu formulieren, dass Ergebnisse prüfbar bleiben: mit klaren Eingaben, begrenztem Umfang, Tests, Quellen und expliziten Akzeptanzkriterien.

Nicht jede KI-Antwort war zuverlässig. Vorschläge konnten veraltete Annahmen enthalten, reale Daten falsch interpretieren oder gültige Sonderfälle zu streng behandeln. Die wichtigste Gegenmaßnahme war deshalb eine Kombination aus kleinen Änderungen, unabhängigen Prüfungen und menschlicher Endabnahme.

### Transfer

Die Kursinhalte ließen sich unmittelbar in die praktische Arbeit übertragen. Die Zielgruppenanalyse führte zu einer klareren Informationsarchitektur. Das Prinzip „Weniger ist mehr“ führte zu kürzeren Texten, einer fokussierten Startseite und eigenen Übersichtsseiten. Kenntnisse zu visueller Kommunikation beeinflussten Typografie, Farben, Icons, Karten und die Hierarchie der Informationen.

Der Transfer zeigte auch eine Grenze theoretischer Modelle: Eine Website ist ein lebendes System. Kommunikationsentscheidungen müssen mit Datenpflege, Barrierefreiheit, Suchmaschinen, Datenschutz, Performance und technischer Wartbarkeit zusammenpassen. Agentische Workflows sind dabei besonders nützlich, wenn sie diese Perspektiven verbinden und ihre Ergebnisse sichtbar prüfbar machen.

### Nachhaltigkeit

Die Website ist durch strukturierte Daten, wiederverwendbare Komponenten, automatisierte Tests und tägliche Daten-Workflows langfristig leichter zu pflegen. Neue Inhalte können nach denselben Regeln ergänzt und vor der Veröffentlichung geprüft werden. Die Kommunikation ist an eine nachvollziehbare Daten- und Komponentenstruktur gebunden.

Für die weitere Arbeit möchte ich agentische Workflows auch für redaktionelle Vorprüfungen, Social-Media-Entwürfe, Barrierefreiheitschecks und regelmäßige Inhaltsaudits einsetzen. Jede Veröffentlichung soll weiterhin eine menschliche fachliche und kommunikative Freigabe benötigen.

## Sonstiges

Das Projekt hat die Rolle der Website verändert: Sie ist nicht mehr nur ein digitales Archiv, sondern eine Schnittstelle zwischen Forschung, Öffentlichkeit, Studierenden, klinischen Partnern, Förderorganisationen und technischen Kooperationspartnern. Durch strukturierte Ausgaben wie `search.json`, `llms.txt` und `llms-full.txt` werden zusätzlich Suchmaschinen und KI-Systeme als neue Vermittler berücksichtigt.

## Zusammenfassung

Im Praxisprojekt wurde die Website der Forschungsgruppe König mit agentischen, KI-gestützten Workflows neu strukturiert und technisch modernisiert. Ausgehend von einer Zielgruppen- und Kommunikationsanalyse entstanden ein klares Konzept, eine responsive Astro-Website, eine validierte und verknüpfte Datenbasis sowie automatisierte Tests und Live-Daten. KI unterstützte Analyse, Textarbeit, Programmierung und Qualitätssicherung; fachliche Prüfung und Veröffentlichung blieben menschlich verantwortlich. So entstand ein nachhaltiger Prozess für verständliche und aktuelle Wissenschaftskommunikation.
