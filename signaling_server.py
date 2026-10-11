# Simple Signaling Server for Kingdoms of Israel Multiplayer
# Run with: python3 signaling_server.py
# Then point the client at ws://YOUR_MACHINE:8080

import asyncio
import json
import websockets

rooms = {}  # room_code -> set of websockets

async def handler(ws):
    room = None
    try:
        async for message in ws:
            data = json.loads(message)
            if data.get('type') == 'join':
                room = data['room']
                if room not in rooms:
                    rooms[room] = set()
                rooms[room].add(ws)
                # Notify others
                for peer in rooms[room]:
                    if peer != ws:
                        await peer.send(json.dumps({'type': 'peer-joined'}))
            elif data.get('type') == 'signal' and room:
                # Relay offer/answer/ICE to others in room
                for peer in list(rooms.get(room, [])):
                    if peer != ws:
                        try:
                            await peer.send(json.dumps(data))
                        except:
                            pass
    finally:
        if room and room in rooms:
            rooms[room].discard(ws)
            if not rooms[room]:
                del rooms[room]

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8080):
        print("Signaling server running on ws://0.0.0.0:8080")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
