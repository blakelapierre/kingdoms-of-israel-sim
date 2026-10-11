# Kingdoms of Israel: A Commoner's Tale

A browser-based historical simulation game of life in ancient Israel, from the late period of the Judges (~1050 BC) through the United Monarchy, the division of the kingdom, and the fall of the Northern Kingdom (~722–700 BC).

Play as an ordinary person—a farmer, shepherd, or small merchant—living through the major events of the biblical and historical record. Manage your farm, family, wealth, and faith while kings rise and fall, prophets speak, wars rage, and empires invade.

## Features

- **Historical timeline**: Major events from Samuel and Saul, David and Solomon, the kingdom split, the prophets (Elijah, Elisha, Amos, Hosea, etc.), wars with Aram and Philistia, and the Assyrian conquest.
- **Commoner perspective**: Focus on daily survival, agriculture (wheat, barley, olives, vines), livestock, family life, taxes, and local markets rather than royal politics.
- **Choices matter**: Decisions during personal and historical events affect your health, wealth, family, reputation, and survival.
- **Playable to ~700 BC**: Experience the end of the Northern Kingdom and the survival (or flight) into Judah.
- **Single-player narrative sim**: Designed for GitHub Pages (pure client-side HTML/CSS/JS). Multiplayer ideas are noted for future expansion (e.g., shared village via PeerJS or backend).

## How to Play

1. Open `index.html` in a browser (or host the folder on GitHub Pages).
2. Choose your starting profession and region.
3. Each turn represents a year (or major season). Take actions, respond to events, and advance time.
4. Survive and prosper through the turbulent centuries.

## Hosting on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this folder (or push the contents).
3. Go to Settings → Pages → Source: Deploy from branch (main, /root or /docs).
4. The site will be live at `https://<username>.github.io/<repo>/`.

## Multiplayer Potential

This version is a rich single-player narrative simulation. Because it is pure client-side (HTML/CSS/JS) and designed for GitHub Pages, true multiplayer requires peer-to-peer technology rather than a custom server.

**Easy path for multiplayer:**
- Use [PeerJS](https://peerjs.com/) (WebRTC) for browser-to-browser connections.
- One player hosts a "village room" and shares a short room code.
- Other players join and each controls their own household in the same timeline.
- Sync major historical events and optional shared market prices or village status.
- Many open-source examples exist of PeerJS games hosted on GitHub Pages with zero backend cost.

A simple hotseat mode (multiple family names on one device, taking turns) could also be added locally without any networking.

The current code is structured so that player state and event triggers can be extended for shared state.

Inspired by biblical narratives (Judges–Kings, Prophets) and archaeological understanding of Iron Age daily life in the southern Levant.

Enjoy your journey through the age of the kings!
