# Alatro

Roguelike Poker-Deckbuilder als Web-App (PWA) fürs iPad. Privates Hobbyprojekt.

## Spielen

Nach dem Deployment: `https://eric-yeah.github.io/Alatro-/` in Safari auf dem iPad öffnen →
Teilen → **Zum Home-Bildschirm**. Danach startet das Spiel im Vollbild und funktioniert offline.

## Entwickeln

```bash
npm install
npm run dev      # Dev-Server, auch im WLAN erreichbar (iPad: http://<IP-des-Rechners>:5173)
npm test         # Tests der Spiellogik
npm run build    # Produktions-Build nach dist/
```

## Aufbau

- `src/core/` – reine Spiellogik (Karten, Hand-Erkennung, Punkte, Joker, Blinds, Run), ohne Grafik, getestet
- `src/ui/` – Darstellung mit PixiJS (Spieltisch, Animationen, Shader-Hintergrund)
- `docs/PLAN.md` – Spieldesign und Meilensteine
