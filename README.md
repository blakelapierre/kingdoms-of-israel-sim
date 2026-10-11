# Kingdoms of Israel: A Commoner's Tale

Browser-based historical simulation from the renaming of Jacob as Israel through the Judges, the United Kingdom, the division, and the fall of the Northern Kingdom (~722–700 BC).

## Features
- **Intro animation**: Major events from Jacob/Israel through Joseph, Exodus, Conquest, and the Judges leading into ~1050 BC.
- **Real-time progression**: Default 1 year / 30 seconds; selectable up to 1 year / second. Pause/resume.
- **Map**: Canvas map of tribal regions with household markers (local player in red, others in blue).
- **Bounded log**: Narrative keeps only the last ~40 lines and auto-scrolls.
- **Multiplayer (PeerJS / WebRTC)**: Host a village room and share a short code, or join an existing room. Year and major events sync from the host. Other players' households appear on the map. Personal actions and stats stay local. Supports several concurrent players (practical limit ~4–8 for pure WebRTC).
- **Vendored PeerJS**: `peerjs.min.js` is included in the repo (no external CDN required at runtime).

## How to Play
1. Open `index.html` (or the GitHub Pages site).
2. Watch (or skip) the intro animation.
3. Optionally host or join a multiplayer room.
4. Choose name, profession, and starting region.
5. Manage your household while time advances and historical events occur.

## Multiplayer Notes
- The host controls the shared year clock.
- Room codes are short prefixes of PeerJS IDs for convenience in this demo; for production a full peer ID or custom signaling is recommended.
- Requires a modern browser with WebRTC support. PeerJS uses its free cloud signaling server by default.

## Hosting
Static files — works on any static host including GitHub Pages. Deploy the contents of this folder to the root of a Pages site.

Inspired by biblical narratives and Iron Age archaeology of the southern Levant.
