# README

## Preamble

Hello, I started this project under the name `Skriva` to create my own MD editor with some optional features such as Excalidraw and more.

Unfortunately, my cat `Feli` passed away on 27 April 2026 with only 8 years old … so I wanted to dedicate this project to her and have renamed it “Feli.md”.

She was such a lovely cat, with her own unique funny way of doing things, who always made you smile whenever you saw her.

Rest in peace Feli
<img width="512" height="512" alt="grafik" src="https://github.com/user-attachments/assets/c8457fd5-0e46-4391-883d-6a10e2f5717f" />


---

This project is vibe-coded with gemini

## How to build

```bash
npm install
```

```bash
npm run electron:dev
```

## Features

### Dynamische Task-Listen
Mit der Syntax `--[]--` kannst du automatisch alle Checkboxen aus dem aktuellen Ordner und allen Unterordnern in einer interaktiven Vorschau anzeigen.

- **Verwendung:** Schreibe `--[]--` in eine eigene Zeile in deiner Notiz.
- **Interaktiv:** Checkboxen können direkt in der Vorschau abgehakt werden. Die Änderungen werden sofort in die ursprünglichen Dateien zurückgeschrieben.
- **Sortierung:** Offene Aufgaben werden automatisch oben angezeigt.
- **Navigation:** Ein Klick auf den Notiz-Titel unter einer Aufgabe bringt dich direkt zur entsprechenden Datei.
