# FASTag Chain Reaction — Pitch Deck Diagrams

Two Excalidraw source files ready for the pitch deck.

## Files
- `system-architecture.excalidraw` — end-to-end system: phone → GPS → geofence → backend → NPCI/NETC → UPI → toll plaza, plus the NHAI Live Toll Health Dashboard moat.
- `cascade-visualization.excalidraw` — two-panel comparison showing the traffic cascade WITHOUT the app vs the cascade prevented WITH the app.

## How to open and export to PNG for the slides

1. Open https://excalidraw.com in your browser (no login required).
2. Click the hamburger menu (top-left) → **Open**.
3. Pick one of the `.excalidraw` files from this folder.
4. Once loaded, you can tweak positions / colors if you want.
5. To export for the deck: hamburger menu → **Export image…**
   - Choose **PNG**
   - Tick **Background** (white)
   - Set scale to **2x** or **3x** for retina-quality slides
   - Click **Export to PNG**, save into `../deck/`.

## Tips
- Both files are valid Excalidraw v2 JSON — they will open cleanly.
- The cascade visualization has stacked panels; if it feels too wide, select all (Ctrl/Cmd-A) and shrink before export.
- Colors used: red (`#fa5252`) = jammed traffic, green (`#2f9e44`) = healthy flow, blue (`#1971c2`) = app-using vehicles.
