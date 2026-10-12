// Kingdoms of Israel: A Commoner's Tale
// Educational timeline + auto-priorities + generational continuity + dynamic map + PeerJS multiplayer

const INTRO_EVENTS = [
  { year: "~1850 BC", title: "Jacob is Named Israel", text: "After wrestling through the night at the Jabbok ford, Jacob is renamed Israel — 'he who strives with God.' He becomes the father of the twelve tribes.", anim: "⚔️ → ✨ Israel" },
  { year: "~1700 BC", title: "Joseph in Egypt", text: "Joseph is sold into slavery, rises to power under Pharaoh, and brings his family (including Jacob/Israel) into Egypt during a famine. The people of Israel settle in Goshen.", anim: "🐪 → 👑 Egypt" },
  { year: "~1446 BC", title: "The Exodus", text: "Moses leads the Israelites out of Egypt. They receive the Law at Sinai and wander in the wilderness.", anim: "🌊 → 🏔️ Sinai" },
  { year: "~1406 BC", title: "Conquest under Joshua", text: "Joshua leads the people into the Promised Land. Jericho falls and the tribes receive their allotments.", anim: "🏰 → 📜 Land" },
  { year: "~1375–1050 BC", title: "Period of the Judges", text: "There is no king in Israel. Cycles of apostasy, oppression, and deliverance. Judges include Deborah, Gideon, Jephthah, and Samson.", anim: "⚖️ Judges" },
  { year: "~1080–1050 BC", title: "Samuel the Prophet-Judge", text: "Samuel judges Israel. The ark is captured and returned. The people demand a king.", anim: "📖 → 👑" },
  { year: "1050 BC", title: "Call for a King", text: "The stage is set for the United Kingdom under Saul, David, and Solomon.", anim: "👑 United" }
];

const BIBLICAL_NAMES = ["Eliab", "Abner", "Amaziah", "Boaz", "Caleb", "Daniel", "Elijah", "Gideon", "Hosea", "Isaac", "Joel", "Micah", "Nathan", "Obadiah", "Phinehas", "Reuben", "Samuel", "Tobiah", "Uriah", "Zechariah"];

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
  peer: null,
  connections: [],
  isHost: false,
  roomCode: null,
  introIndex: 0,
  generation: 1,
  priorities: { farm: true, trade: false, family: false, pray: false },
  mapMarkers: [] // dynamic historical markers
};

const REGION_POSITIONS = {
  Manasseh: { x: 200, y: 120, color: '#8d6e63' },
  Ephraim: { x: 180, y: 180, color: '#6d4c41' },
  Benjamin: { x: 190, y: 230, color: '#5d4037' },
  Judah: { x: 200, y: 320, color: '#4e342e' }
};

const TIMELINE = [
  { year: 1050, title: "Call for a King", text: "The people demand a king like the other nations. Samuel warns them, but Saul of Benjamin is anointed.", mapNote: "Tribes unite under a king" },
  { year: 1030, title: "Saul's Early Wars", text: "Saul gathers the tribes and wins victories against Ammonites and Philistines. Taxes and conscription begin." },
  { year: 1010, title: "Rise of David", text: "David of Bethlehem defeats Goliath and becomes famous. Saul grows jealous." },
  { year: 1000, title: "David Unites the Kingdom & Captures Jerusalem", text: "David is king over all Israel. He captures Jerusalem (Jebus) and makes it his capital. The ark is brought up.", mapNote: "Jerusalem becomes capital", mapMarker: { name: "Jerusalem (Capital)", x: 195, y: 250, color: "#c62828" } },
  { year: 970, title: "Solomon's Reign Begins", text: "Solomon succeeds David. Wisdom, wealth, and great building projects begin. Trade flourishes." },
  { year: 960, title: "The Temple is Built in Jerusalem", text: "Solomon completes the Temple. Priests and Levites serve. Many go up for the dedications.", mapNote: "Temple dedicated in Jerusalem", mapMarker: { name: "Temple", x: 198, y: 248, color: "#ffd54f" } },
  { year: 930, title: "The Kingdom Divides", text: "Rehoboam's harsh answer causes the northern tribes to follow Jeroboam. Israel (north) and Judah (south) split.", mapNote: "Kingdom divided" },
  { year: 910, title: "Jeroboam's Golden Calves", text: "Jeroboam sets up calves at Bethel and Dan so the north will not go to Jerusalem." },
  { year: 870, title: "Omri Builds Samaria", text: "Omri establishes Samaria as the strong capital of the northern kingdom.", mapMarker: { name: "Samaria", x: 190, y: 160, color: "#6a1b9a" } },
  { year: 850, title: "Elijah and the Drought", text: "Elijah confronts Ahab. A severe drought and famine grip the land. The contest on Mount Carmel is told in the villages." },
  { year: 841, title: "Jehu's Coup", text: "Jehu destroys the house of Ahab and purges Baal worship in the north." },
  { year: 760, title: "Prosperity under Jeroboam II", text: "Israel expands and grows wealthy. Amos denounces injustice and oppression of the poor." },
  { year: 734, title: "Assyrian Campaigns Begin", text: "Tiglath-Pileser III takes Galilee and Transjordan. Deportations start. Fear spreads." },
  { year: 722, title: "Fall of Samaria", text: "Samaria falls to Assyria. The Northern Kingdom ends. Many Israelites are exiled; foreigners are settled in the land.", mapNote: "Samaria falls — Northern Kingdom ends" },
  { year: 701, title: "Sennacherib Invades Judah", text: "Sennacherib destroys Lachish and besieges Jerusalem. Hezekiah has prepared the city. The Assyrians withdraw after tribute (or by the hand of the Lord). Judah survives." }
];

function init() {
  document.getElementById('skip-intro').addEventListener('click', () => { clearTimeouts(); finishIntro(); });
  document.getElementById('intro-prev').addEventListener('click', () => { clearTimeouts(); game.introIndex = Math.max(0, game.introIndex - 2); showNextIntro(); });
  document.getElementById('intro-next').addEventListener('click', () => { clearTimeouts(); showNextIntro(); });
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('host-btn').addEventListener('click', hostRoom);
  document.getElementById('join-btn').addEventListener('click', joinRoom);
  document.getElementById('webrtc-host-btn').addEventListener('click', createWebRTCOffer);
  document.getElementById('webrtc-set-answer').addEventListener('click', setWebRTCAnswer);
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });
  document.getElementById('speed-select').addEventListener('change', (e) => {
    game.speedSecondsPerYear = parseInt(e.target.value, 10);
    if (game.started && !game.paused) restartYearTimer();
    broadcast({ type: 'speed', value: game.speedSecondsPerYear });
  });
  document.getElementById('pause-btn').addEventListener('click', togglePause);

  ['farm','trade','family','pray'].forEach(p => {
    const el = document.getElementById('prio-' + p);
    if (el) el.addEventListener('change', () => { game.priorities[p] = el.checked; });
  });

  // Randomize name always on load
  const nameInput = document.getElementById('player-name');
  if (nameInput) {
    nameInput.value = BIBLICAL_NAMES[Math.floor(Math.random() * BIBLICAL_NAMES.length)];
  }

  // Main game URL QR
  const url = window.location.href.split('?')[0];
  document.getElementById('main-url').textContent = url;
  new QRCode(document.getElementById('main-qr'), { text: url, width: 128, height: 128 });

  playIntro();
}

let introTimer = null;
function playIntro() {
  game.introIndex = 0;
  showNextIntro();
}
function showNextIntro() {
  const content = document.getElementById('intro-content');
  const progress = document.getElementById('intro-progress');
  const visual = document.getElementById('intro-visual');
  if (game.introIndex >= INTRO_EVENTS.length) { finishIntro(); return; }
  const ev = INTRO_EVENTS[game.introIndex];
  content.innerHTML = `<strong>${ev.year}</strong><br><em>${ev.title}</em><br><br>${ev.text}`;
  progress.textContent = `Segment ${game.introIndex + 1} of ${INTRO_EVENTS.length}`;
  // Graphical animation scene
  visual.innerHTML = `<div class="anim-scene">${ev.anim || ev.title}</div>`;
  game.introIndex++;
  introTimer = setTimeout(showNextIntro, 7000);
}
function clearTimeouts() { if (introTimer) clearTimeout(introTimer); }
function finishIntro() {
  document.getElementById('intro-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
}

function hostRoom() {
  game.isHost = true;
  game.peer = new Peer();
  game.peer.on('open', id => {
    game.roomCode = id.slice(0, 8).toUpperCase();
    document.getElementById('room-code').textContent = game.roomCode;
    document.getElementById('room-info').classList.remove('hidden');
    document.getElementById('mp-status').textContent = 'Hosting. Waiting for players...';
    document.getElementById('mp-indicator').textContent = 'Host';
    // QR for room
    const qrEl = document.getElementById('room-qr');
    qrEl.innerHTML = '';
    new QRCode(qrEl, { text: window.location.href.split('?')[0] + '?room=' + game.roomCode, width: 128, height: 128 });
  });
  game.peer.on('connection', conn => {
    game.connections.push(conn);
    conn.on('data', data => handlePeerData(data, conn));
    conn.on('open', () => {
      document.getElementById('mp-status').textContent = `${game.connections.length} player(s) connected`;
      if (game.started) conn.send({ type: 'sync', year: game.year, speed: game.speedSecondsPerYear, households: game.households, markers: game.mapMarkers });
    });
  });
}
function joinRoom() {
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!code) return;
  game.peer = new Peer();
  game.peer.on('open', () => {
    const conn = game.peer.connect(code);
    conn.on('open', () => {
      game.connections.push(conn);
      document.getElementById('mp-status').textContent = 'Joined village!';
      document.getElementById('mp-indicator').textContent = 'Joined';
      conn.on('data', data => handlePeerData(data, conn));
    });
  });
}
function handlePeerData(data) {
  if (data.type === 'sync') {
    game.year = data.year;
    game.speedSecondsPerYear = data.speed;
    game.households = data.households || [];
    game.mapMarkers = data.markers || [];
    updateStatus(); updateTimeline(); drawMap();
    addNarrative(`Synced to ${game.year} BC.`);
  } else if (data.type === 'year') {
    game.year = data.year;
    updateStatus(); updateTimeline(); drawMap();
  } else if (data.type === 'household') {
    const idx = game.households.findIndex(h => h.name === data.household.name && h.generation === data.household.generation);
    if (idx >= 0) game.households[idx] = data.household;
    else game.households.push(data.household);
    drawMap();
  } else if (data.type === 'marker') {
    game.mapMarkers.push(data.marker);
    drawMap();
  } else if (data.type === 'event') {
    addNarrative(`[Shared] ${data.text}`);
  }
}
// Pure WebRTC (no PeerJS) — simple 1:1 offer/answer for demonstration
let webrtcPC = null;
function createWebRTCOffer() {
  webrtcPC = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  const dc = webrtcPC.createDataChannel('game');
  dc.onopen = () => document.getElementById('mp-status').textContent = 'WebRTC data channel open!';
  dc.onmessage = e => handlePeerData(JSON.parse(e.data));
  game.connections.push({ open: true, send: msg => dc.send(JSON.stringify(msg)) });

  webrtcPC.onicecandidate = () => {
    if (webrtcPC.localDescription) {
      const offer = webrtcPC.localDescription.sdp;
      document.getElementById('webrtc-offer').value = offer;
      document.getElementById('webrtc-offer-box').classList.remove('hidden');
      const qr = document.getElementById('webrtc-offer-qr');
      qr.innerHTML = '';
      // QR of a shortened note; full SDP is long for QR so we show text primarily
      new QRCode(qr, { text: 'webrtc-offer-ready', width: 96, height: 96 });
    }
  };
  webrtcPC.createOffer().then(o => webrtcPC.setLocalDescription(o));
  document.getElementById('mp-status').textContent = 'Creating offer... copy the SDP or scan QR and send to joiner.';
}

function setWebRTCAnswer() {
  const answerSdp = document.getElementById('webrtc-answer').value.trim();
  if (!webrtcPC || !answerSdp) return;
  webrtcPC.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    .then(() => document.getElementById('mp-status').textContent = 'Answer set. Connection should establish.')
    .catch(err => document.getElementById('mp-status').textContent = 'Error: ' + err);
}

function startGame() {
  const name = document.getElementById('player-name').value || "Eliab";
  const profession = document.getElementById('profession').value;
  const region = document.getElementById('region').value;

  game.generation = 1;
  createNewHousehold(name, profession, region);

  game.year = 1050;
  game.started = true;
  game.paused = false;
  game.households = [{ name, region, generation: 1, isLocal: true }];
  game.mapMarkers = [];

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  document.getElementById('intro-screen').classList.add('hidden');

  updateStatus();
  updateTimeline();
  addNarrative(`Generation ${game.generation}: You are ${name}, a young ${profession} in ${region}. Year ${game.year} BC. Set priorities so your household produces food and wealth automatically each year.`);
  drawMap();
  restartYearTimer();

  if (game.isHost) broadcast({ type: 'sync', year: game.year, speed: game.speedSecondsPerYear, households: game.households, markers: game.mapMarkers });
}

function createNewHousehold(name, profession, region) {
  game.player = {
    name, profession, region, age: 16, health: 100,
    wealth: profession === 'merchant' ? 40 : 20,
    food: 15, livestock: profession === 'shepherd' ? 12 : 5,
    family: 1, piety: 50, kingdom: "Tribal Confederation", generation: game.generation
  };
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
    addNarrative("Time paused.");
  } else {
    restartYearTimer();
    addNarrative("Time resumed.");
  }
}

function updateStatus() {
  if (!game.player) return;
  const p = game.player;
  document.getElementById('year').textContent = `${game.year} BC (Gen ${p.generation})`;
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

function updateTimeline() {
  const pastList = document.getElementById('past-list');
  const upcomingList = document.getElementById('upcoming-list');
  if (!pastList || !upcomingList) return;

  // Past = earlier years (higher BC numbers)
  const past = TIMELINE.filter(e => e.year > game.year).slice(-4).reverse();
  // Upcoming = later years (lower BC numbers)
  const upcoming = TIMELINE.filter(e => e.year < game.year).slice(0, 4);

  pastList.innerHTML = past.map(e => `<li class="past-event">${e.year} BC — ${e.title}</li>`).join('') || '<li>None yet</li>';
  upcomingList.innerHTML = upcoming.map(e => `<li class="upcoming-event">${e.year} BC — ${e.title}</li>`).join('') || '<li>Approaching the end of the period</li>';

  // Scrolling line visualization
  const bar = document.getElementById('timeline-bar');
  const progress = document.getElementById('timeline-progress');
  const nowMarker = document.getElementById('timeline-now');
  const labels = document.getElementById('timeline-labels');
  if (!bar || !progress || !nowMarker) return;

  const startYear = 1050;
  const endYear = 690;
  const totalSpan = startYear - endYear;
  const elapsed = startYear - game.year;
  const pct = Math.max(0, Math.min(100, (elapsed / totalSpan) * 100));

  progress.style.width = pct + '%';
  nowMarker.style.left = pct + '%';

  // Place event dots
  bar.querySelectorAll('.timeline-event-dot').forEach(d => d.remove());
  TIMELINE.forEach(e => {
    const eventPct = ((startYear - e.year) / totalSpan) * 100;
    if (eventPct >= 0 && eventPct <= 100) {
      const dot = document.createElement('div');
      dot.className = 'timeline-event-dot';
      dot.style.left = eventPct + '%';
      dot.title = `${e.year} BC: ${e.title}`;
      bar.appendChild(dot);
    }
  });

  if (labels) {
    labels.innerHTML = `<span>${startYear} BC</span><span>Now: ${game.year} BC</span><span>${endYear} BC</span>`;
  }
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

function clearChoices() { document.getElementById('choices').innerHTML = ''; }

function handleAction(action) {
  if (!game.started || game.currentEvent || !game.player) return;
  const p = game.player;
  switch (action) {
    case 'farm':
      const farmGain = p.profession === 'farmer' ? 8 + Math.floor(Math.random()*6) : 3 + Math.floor(Math.random()*4);
      p.food += farmGain; p.health = Math.min(100, p.health + 2);
      addNarrative(`You tend your ${p.profession === 'shepherd' ? 'flocks' : 'fields'}. +${farmGain} food.`);
      break;
    case 'trade':
      if (p.food >= 5) {
        const sold = Math.min(p.food, 5 + Math.floor(Math.random()*5));
        p.food -= sold;
        const silver = Math.floor(sold * (1.5 + Math.random()));
        p.wealth += silver;
        addNarrative(`Traded ${sold} measures for ${silver} shekels.`);
      } else addNarrative("Little surplus to trade.");
      break;
    case 'family':
      if (p.age >= 18 && p.family < 8 && p.wealth >= 10 && Math.random() > 0.5) {
        p.family += 1; p.wealth -= 8; p.food -= 3;
        addNarrative("A child is born.");
      } else addNarrative("Household cared for.");
      break;
    case 'pray':
      p.piety = Math.min(100, p.piety + 8);
      addNarrative("You offer a sacrifice.");
      break;
  }
  updateStatus();
}

function applyPriorities() {
  if (!game.player || game.currentEvent) return;
  const p = game.player;
  const pr = game.priorities;
  let notes = [];

  if (pr.farm) {
    const gain = p.profession === 'farmer' ? 6 + Math.floor(Math.random()*5) : 2 + Math.floor(Math.random()*3);
    p.food += gain;
    notes.push(`+${gain} food`);
  }
  if (pr.trade && p.food >= 6) {
    const sold = Math.min(4, p.food - 3);
    p.food -= sold;
    const silver = Math.floor(sold * 1.8);
    p.wealth += silver;
    notes.push(`+${silver} shekels`);
  }
  if (pr.family && p.age >= 18 && p.family < 7 && Math.random() > 0.7) {
    p.family += 1; p.wealth = Math.max(0, p.wealth - 5);
    notes.push("family grows");
  }
  if (pr.pray) {
    p.piety = Math.min(100, p.piety + 4);
    notes.push("piety +");
  }
  if (notes.length) addNarrative(`Priorities this year: ${notes.join(', ')}.`);
}

function advanceYear() {
  if (game.currentEvent || game.paused) return;
  game.year -= 1;
  if (game.player) {
    game.player.age += 1;
    // Living costs
    game.player.food = Math.max(0, game.player.food - (2 + Math.floor(game.player.family / 2)));
    if (game.player.food < 2) {
      game.player.health -= 6;
      addNarrative("Hunger weakens the household.");
    }
    applyPriorities();
  }

  const event = TIMELINE.find(e => e.year === game.year);
  if (event) {
    triggerHistoricalEvent(event);
    broadcast({ type: 'event', text: `${event.year} BC: ${event.title}` });
    if (event.mapMarker) {
      game.mapMarkers.push(event.mapMarker);
      broadcast({ type: 'marker', marker: event.mapMarker });
    }
    return;
  }

  if (Math.random() < 0.15 && game.player) triggerPersonalEvent();
  else addNarrative(`The year ${game.year} BC passes.`);

  updateStatus();
  updateTimeline();
  drawMap();
  broadcast({ type: 'year', year: game.year });
  checkDeathOrSuccession();
}

function triggerHistoricalEvent(event) {
  game.currentEvent = event;
  addNarrative(`\n=== ${event.title} (${event.year} BC) ===\n${event.text}`);
  if (event.mapNote) addNarrative(`Map note: ${event.mapNote}`);
  showChoices([
    { text: "Endure and adapt", effect: () => addNarrative("You weather the changes.") },
    { text: "Seek advantage", effect: () => { game.player.wealth += Math.random() > 0.5 ? 12 : -4; addNarrative("Fortune shifts."); } },
    { text: "Turn more to the Lord", effect: () => { game.player.piety += 10; addNarrative("You increase offerings."); } }
  ]);
}

function triggerPersonalEvent() {
  const events = [
    { text: "A drought threatens the harvest.", choices: [
      { text: "Pray and wait", effect: () => { game.player.piety += 5; game.player.food -= 3; } },
      { text: "Buy grain", effect: () => { game.player.wealth -= 10; game.player.food += 4; } }
    ]},
    { text: "Raiders or bandits appear.", choices: [
      { text: "Defend with neighbors", effect: () => { game.player.health -= 6; } },
      { text: "Hide goods / pay off", effect: () => { game.player.wealth -= 8; } }
    ]}
  ];
  const ev = events[Math.floor(Math.random() * events.length)];
  game.currentEvent = ev;
  addNarrative(`\nPersonal event: ${ev.text}`);
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
      updateTimeline();
      drawMap();
      checkDeathOrSuccession();
      addNarrative("The year continues...");
    });
    container.appendChild(btn);
  });
}

function checkDeathOrSuccession() {
  if (!game.player) return;
  const p = game.player;
  if (game.year < 690) {
    addNarrative(`\n*** The simulation reaches its end around 700 BC. ***\nYour lineage has lived through the United Kingdom, the division, and the fall of the north.\nFinal generation: ${p.generation}.`);
    if (game.yearTimer) clearInterval(game.yearTimer);
    return;
  }
  if (p.health <= 0 || p.age > 65) {
    const reason = p.health <= 0 ? "from hardship" : "of old age";
    addNarrative(`\n*** Generation ${p.generation} ends ${reason} (age ${p.age}). ***`);
    // Succession: new household continues the lineage
    game.generation += 1;
    const newName = p.name.split(' ')[0] + " II"; // simple naming
    createNewHousehold(newName, p.profession, p.region);
    game.households = game.households.filter(h => !h.isLocal);
    game.households.push({ name: newName, region: p.region, generation: game.generation, isLocal: true });
    addNarrative(`A new generation begins: ${newName}, age 16, continues the household in ${p.region}. The story of the land goes on.`);
    updateStatus();
    broadcast({ type: 'household', household: { name: newName, region: p.region, generation: game.generation, isLocal: false } });
  }
}

function drawMap() {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#c8a882';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 40); ctx.lineTo(320, 50); ctx.lineTo(340, 450); ctx.lineTo(60, 440); ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#d4b896';
  ctx.fill();

  // Regions
  Object.entries(REGION_POSITIONS).forEach(([name, pos]) => {
    ctx.fillStyle = pos.color;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8e1'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(name.slice(0, 8), pos.x, pos.y + 4);
  });

  // Dynamic historical markers
  game.mapMarkers.forEach(m => {
    ctx.fillStyle = m.color || '#ff9800';
    ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e2723'; ctx.font = '9px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(m.name, m.x + 10, m.y + 3);
  });

  // Households
  game.households.forEach((h, i) => {
    const pos = REGION_POSITIONS[h.region] || REGION_POSITIONS.Ephraim;
    const offset = (i % 4) * 14 - 21;
    ctx.fillStyle = h.isLocal ? '#c62828' : '#1565c0';
    ctx.beginPath(); ctx.arc(pos.x + offset, pos.y - 28, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e2723'; ctx.font = '9px Georgia'; ctx.textAlign = 'left';
    ctx.fillText((h.name || '').slice(0, 10), pos.x + offset + 10, pos.y - 25);
  });

  // Year
  ctx.fillStyle = '#3e2723'; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(`${game.year} BC`, canvas.width / 2, 28);

  // Legend
  const legend = document.getElementById('map-legend');
  if (legend) {
    legend.innerHTML = '<span style="color:#c62828">●</span> Your household &nbsp; <span style="color:#1565c0">●</span> Other players &nbsp; Colored dots = historical sites';
  }
}

document.addEventListener('DOMContentLoaded', init);
