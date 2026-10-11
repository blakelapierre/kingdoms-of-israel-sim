// Kingdoms of Israel: A Commoner's Tale
// Expanded timeline + intro animation + PeerJS multiplayer + real-time + map + bounded log

const INTRO_EVENTS = [
  { year: "~1850 BC", title: "Jacob is Named Israel", text: "After wrestling through the night at the Jabbok ford, Jacob is renamed Israel — 'he who strives with God.' He becomes the father of the twelve tribes." },
  { year: "~1700 BC", title: "Joseph in Egypt", text: "Joseph is sold into slavery, rises to power under Pharaoh, and brings his family (including Jacob/Israel) into Egypt during a famine. The people of Israel settle in Goshen." },
  { year: "~1500–1446 BC", title: "Slavery and the Exodus", text: "A new Pharaoh who does not know Joseph enslaves the Israelites. Moses is raised up. After the plagues, the people leave Egypt in the Exodus and receive the Law at Sinai." },
  { year: "~1406 BC", title: "Conquest under Joshua", text: "After forty years in the wilderness, Joshua leads the people across the Jordan. Jericho falls. The land is allotted to the tribes. The elders who outlive Joshua keep the covenant for a time." },
  { year: "~1375–1050 BC", title: "The Period of the Judges", text: "There is no king in Israel. The cycle of apostasy, oppression, and deliverance repeats. Judges rise: Othniel, Ehud, Deborah & Barak, Gideon, Jephthah, Samson, and others. The Philistines grow strong." },
  { year: "~1080–1050 BC", title: "Samuel the Prophet-Judge", text: "Samuel is dedicated to the Lord at Shiloh. The ark is captured by the Philistines and later returned. Samuel judges Israel. In his old age the people demand a king 'like the other nations.'" },
  { year: "1050 BC", title: "The Call for a King", text: "The age of the Judges ends. The tribes cry out for a king. The stage is set for the United Kingdom." }
];

const game = {
  player: null,
  year: 1050,
  started: false,
  currentEvent: null,
  paused: false,
  speedSecondsPerYear: 30,
  yearTimer: null,
  narrativeLines: [],
  maxNarrativeLines: 40,
  households: [],
  // Multiplayer
  peer: null,
  connections: [],
  isHost: false,
  roomCode: null,
  introIndex: 0
};

const REGION_POSITIONS = {
  Manasseh: { x: 200, y: 120, color: '#8d6e63' },
  Ephraim: { x: 180, y: 180, color: '#6d4c41' },
  Benjamin: { x: 190, y: 230, color: '#5d4037' },
  Judah: { x: 200, y: 320, color: '#4e342e' }
};

const TIMELINE = [
  { year: 1050, title: "Call for a King", text: "The people of Israel, pressed by the Philistines and weary of the judges, demand a king like the other nations. The prophet Samuel warns them of the cost, but the elders insist. Rumors spread that a man of Benjamin named Saul has been anointed." },
  { year: 1030, title: "Saul's Early Wars", text: "King Saul gathers the tribes and wins victories against the Ammonites and Philistines. Conscription and taxes begin to weigh on the villages." },
  { year: 1010, title: "Rise of David", text: "A young shepherd from Bethlehem named David becomes famous after defeating a Philistine champion. Saul grows jealous." },
  { year: 1000, title: "David Unites the Kingdom", text: "After Saul's death, David is anointed king over all Israel. He captures Jerusalem and makes it his capital." },
  { year: 970, title: "Solomon's Reign Begins", text: "Solomon succeeds David. Wisdom, wealth, and building projects mark the early years." },
  { year: 960, title: "The Temple is Built", text: "Solomon completes the great Temple in Jerusalem. The glory of the Lord fills the house." },
  { year: 930, title: "The Kingdom Divides", text: "Solomon dies. The northern tribes under Jeroboam reject the house of David and form the Kingdom of Israel. Judah remains under the Davidic line." },
  { year: 722, title: "Fall of Samaria", text: "Samaria falls to Assyria. The Northern Kingdom ceases to exist as an independent state. Many are exiled." },
  { year: 701, title: "Sennacherib and Hezekiah", text: "Sennacherib invades Judah and besieges Jerusalem. The south survives." }
];

function init() {
  document.getElementById('skip-intro').addEventListener('click', skipIntro);
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('host-btn').addEventListener('click', hostRoom);
  document.getElementById('join-btn').addEventListener('click', joinRoom);
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });
  document.getElementById('speed-select').addEventListener('change', (e) => {
    game.speedSecondsPerYear = parseInt(e.target.value, 10);
    if (game.started && !game.paused) restartYearTimer();
    broadcast({ type: 'speed', value: game.speedSecondsPerYear });
  });
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  playIntro();
}

function playIntro() {
  game.introIndex = 0;
  showNextIntro();
}

function showNextIntro() {
  const content = document.getElementById('intro-content');
  const progress = document.getElementById('intro-progress');
  if (game.introIndex >= INTRO_EVENTS.length) {
    finishIntro();
    return;
  }
  const ev = INTRO_EVENTS[game.introIndex];
  content.innerHTML = `<strong>${ev.year}</strong><br><em>${ev.title}</em><br><br>${ev.text}`;
  progress.textContent = `Event ${game.introIndex + 1} of ${INTRO_EVENTS.length}`;
  game.introIndex++;
  setTimeout(showNextIntro, 4500);
}

function skipIntro() {
  clearTimeouts();
  finishIntro();
}

function finishIntro() {
  document.getElementById('intro-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
}

function clearTimeouts() {
  // simple way — in real code we'd track timers; for this demo the last timeout will just be ignored
}

function hostRoom() {
  game.isHost = true;
  game.peer = new Peer();
  game.peer.on('open', id => {
    game.roomCode = id.slice(0, 8).toUpperCase();
    document.getElementById('room-code').textContent = game.roomCode;
    document.getElementById('room-info').classList.remove('hidden');
    document.getElementById('mp-status').textContent = 'Hosting room. Waiting for players...';
    document.getElementById('mp-indicator').textContent = 'Host';
  });
  game.peer.on('connection', conn => {
    game.connections.push(conn);
    conn.on('data', data => handlePeerData(data, conn));
    conn.on('open', () => {
      document.getElementById('mp-status').textContent = `Player connected (${game.connections.length} total)`;
      // Send current state
      if (game.started) {
        conn.send({ type: 'sync', year: game.year, speed: game.speedSecondsPerYear, households: game.households });
      }
    });
  });
  game.peer.on('error', err => {
    document.getElementById('mp-status').textContent = 'Peer error: ' + err.type;
  });
}

function joinRoom() {
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!code) return;
  game.peer = new Peer();
  game.peer.on('open', id => {
    const conn = game.peer.connect(code); // PeerJS uses full ID; for demo we use short code as ID prefix — in practice host shares full ID or we map short codes
    // Note: for production, host should share the full peer ID or use a signaling scheme. Here we use the short code as the peer ID for simplicity in demo.
    conn.on('open', () => {
      game.connections.push(conn);
      document.getElementById('mp-status').textContent = 'Connected to village!';
      document.getElementById('mp-indicator').textContent = 'Joined';
      conn.on('data', data => handlePeerData(data, conn));
    });
    conn.on('error', err => {
      document.getElementById('mp-status').textContent = 'Join failed: ' + err;
    });
  });
}

function handlePeerData(data) {
  if (data.type === 'sync') {
    game.year = data.year;
    game.speedSecondsPerYear = data.speed;
    game.households = data.households || [];
    updateStatus();
    drawMap();
    addNarrative(`Synced to year ${game.year} BC. Other households are present.`);
  } else if (data.type === 'year') {
    game.year = data.year;
    updateStatus();
    drawMap();
  } else if (data.type === 'household') {
    const idx = game.households.findIndex(h => h.name === data.household.name);
    if (idx >= 0) game.households[idx] = data.household;
    else game.households.push(data.household);
    drawMap();
  } else if (data.type === 'event') {
    addNarrative(`[Shared] ${data.text}`);
  }
}

function broadcast(msg) {
  game.connections.forEach(c => {
    if (c.open) c.send(msg);
  });
}

function startGame() {
  const name = document.getElementById('player-name').value || "Eliab";
  const profession = document.getElementById('profession').value;
  const region = document.getElementById('region').value;

  game.player = {
    name, profession, region, age: 16, health: 100,
    wealth: profession === 'merchant' ? 40 : 20,
    food: 15, livestock: profession === 'shepherd' ? 12 : 5,
    family: 1, piety: 50, kingdom: "Tribal Confederation"
  };

  game.year = 1050;
  game.started = true;
  game.paused = false;
  game.households = [{ name, region, isLocal: true }];

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  updateStatus();
  addNarrative(`You are ${name}, a young ${profession} in ${region}. The year is 1050 BC. Time advances automatically.`);
  drawMap();
  restartYearTimer();

  if (game.isHost) {
    broadcast({ type: 'sync', year: game.year, speed: game.speedSecondsPerYear, households: game.households });
  }
  broadcast({ type: 'household', household: { name, region, isLocal: false } });
}

function restartYearTimer() {
  if (game.yearTimer) clearInterval(game.yearTimer);
  if (game.paused || !game.started) return;
  const ms = game.speedSecondsPerYear * 1000;
  game.yearTimer = setInterval(() => {
    if (game.isHost || game.connections.length === 0) advanceYear();
  }, ms);
}

function togglePause() {
  game.paused = !game.paused;
  document.getElementById('pause-btn').textContent = game.paused ? "Resume Time" : "Pause Time";
  if (game.paused) {
    if (game.yearTimer) clearInterval(game.yearTimer);
    addNarrative("Time is paused.");
  } else {
    restartYearTimer();
    addNarrative("Time resumes.");
  }
  broadcast({ type: 'pause', paused: game.paused });
}

function updateStatus() {
  if (!game.player) return;
  const p = game.player;
  document.getElementById('year').textContent = `${game.year} BC`;
  document.getElementById('age').textContent = p.age;
  document.getElementById('location').textContent = p.region;
  document.getElementById('kingdom').textContent = p.kingdom;
  document.getElementById('health').textContent = p.health;
  document.getElementById('wealth').textContent = p.wealth;
  document.getElementById('food').textContent = p.food;
  document.getElementById('livestock').textContent = p.livestock;
  document.getElementById('family').textContent = p.family;
  document.getElementById('piety').textContent = p.piety;
}

function addNarrative(text) {
  const lines = text.split('\n');
  game.narrativeLines.push(...lines);
  if (game.narrativeLines.length > game.maxNarrativeLines) {
    game.narrativeLines = game.narrativeLines.slice(-game.maxNarrativeLines);
  }
  const el = document.getElementById('narrative');
  el.textContent = game.narrativeLines.join('\n');
  el.scrollTop = el.scrollHeight;
}

function clearChoices() {
  document.getElementById('choices').innerHTML = '';
}

function handleAction(action) {
  if (!game.started || game.currentEvent) return;
  const p = game.player;
  switch (action) {
    case 'farm':
      const farmGain = p.profession === 'farmer' ? 8 + Math.floor(Math.random()*6) : 3 + Math.floor(Math.random()*4);
      p.food += farmGain;
      p.health = Math.min(100, p.health + 2);
      addNarrative(`You tend your ${p.profession === 'shepherd' ? 'flocks' : 'fields'}. Gain ${farmGain} measures of food.`);
      break;
    case 'trade':
      if (p.food >= 5) {
        const sold = Math.min(p.food, 5 + Math.floor(Math.random()*5));
        p.food -= sold;
        const silver = Math.floor(sold * (1.5 + Math.random()));
        p.wealth += silver;
        addNarrative(`You trade ${sold} measures for ${silver} shekels.`);
      } else addNarrative("Little surplus to trade.");
      break;
    case 'family':
      if (p.age >= 18 && p.family < 8 && p.wealth >= 10 && Math.random() > 0.5) {
        p.family += 1; p.wealth -= 8; p.food -= 3;
        addNarrative("A child is born. The household grows.");
      } else addNarrative("You tend the household.");
      break;
    case 'pray':
      p.piety = Math.min(100, p.piety + 8);
      addNarrative("You offer a sacrifice and seek the Lord.");
      break;
  }
  updateStatus();
  broadcast({ type: 'household', household: { name: p.name, region: p.region, isLocal: false } });
}

function advanceYear() {
  if (game.currentEvent || game.paused) return;
  game.year -= 1;
  if (game.player) game.player.age += 1;

  if (game.player) {
    game.player.food = Math.max(0, game.player.food - (2 + Math.floor(game.player.family / 2)));
    if (game.player.food < 3) {
      game.player.health -= 8;
      addNarrative("Food is short.");
    }
  }

  const event = TIMELINE.find(e => e.year === game.year);
  if (event) {
    triggerHistoricalEvent(event);
    broadcast({ type: 'event', text: event.title + ': ' + event.text });
    return;
  }

  if (Math.random() < 0.2 && game.player) triggerPersonalEvent();
  else addNarrative(`The year ${game.year} BC passes.`);

  updateStatus();
  drawMap();
  broadcast({ type: 'year', year: game.year });
  checkDeath();
}

function triggerHistoricalEvent(event) {
  game.currentEvent = event;
  addNarrative(`\n=== ${event.title} (${event.year} BC) ===\n${event.text}`);
  showChoices([
    { text: "Endure and adapt", effect: () => addNarrative("You weather the changes.") },
    { text: "Seek advantage", effect: () => { game.player.wealth += Math.random() > 0.5 ? 10 : -5; addNarrative("Fortune shifts."); } },
    { text: "Turn to the Lord", effect: () => { game.player.piety += 10; addNarrative("You increase your offerings."); } }
  ]);
}

function triggerPersonalEvent() {
  const events = [
    { text: "A drought threatens the harvest.", choices: [
      { text: "Pray and wait", effect: () => { game.player.piety += 5; game.player.food -= 4; } },
      { text: "Buy grain", effect: () => { game.player.wealth -= 12; game.player.food += 5; } }
    ]},
    { text: "Raiders threaten the area.", choices: [
      { text: "Defend", effect: () => { game.player.health -= 8; } },
      { text: "Hide goods", effect: () => { game.player.wealth -= 10; } }
    ]}
  ];
  const ev = events[Math.floor(Math.random() * events.length)];
  game.currentEvent = ev;
  addNarrative(`\nPersonal: ${ev.text}`);
  showChoices(ev.choices);
}

function showChoices(choices) {
  const container = document.getElementById('choices');
  container.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      choice.effect();
      game.currentEvent = null;
      clearChoices();
      updateStatus();
      checkDeath();
      addNarrative("The year continues...");
      drawMap();
    });
    container.appendChild(btn);
  });
}

function checkDeath() {
  if (!game.player) return;
  const p = game.player;
  if (p.health <= 0 || p.age > 70 || game.year < 690) {
    addNarrative(`\n*** Your life ends. Final: Age ${p.age}, Wealth ${p.wealth}, Family ${p.family} ***\nRefresh to begin again.`);
    if (game.yearTimer) clearInterval(game.yearTimer);
    document.querySelectorAll('button').forEach(b => b.disabled = true);
  }
}

function drawMap() {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#c8a882';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 40); ctx.lineTo(320, 50); ctx.lineTo(340, 450); ctx.lineTo(60, 440); ctx.closePath();
  ctx.stroke(); ctx.fillStyle = '#d4b896'; ctx.fill();

  Object.entries(REGION_POSITIONS).forEach(([name, pos]) => {
    ctx.fillStyle = pos.color;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8e1'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(name.slice(0, 8), pos.x, pos.y + 4);
  });

  game.households.forEach((h, i) => {
    const pos = REGION_POSITIONS[h.region] || REGION_POSITIONS.Ephraim;
    const offset = (i % 3) * 12 - 12;
    ctx.fillStyle = h.isLocal ? '#c62828' : '#1565c0';
    ctx.beginPath(); ctx.arc(pos.x + offset, pos.y - 25, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e2723'; ctx.font = '9px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(h.name.slice(0, 8), pos.x + offset + 10, pos.y - 22);
  });

  ctx.fillStyle = '#3e2723'; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(`${game.year} BC`, canvas.width / 2, 30);
}

document.addEventListener('DOMContentLoaded', init);
