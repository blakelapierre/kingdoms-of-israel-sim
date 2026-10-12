// Kingdoms of Israel: A Commoner's Tale
// Educational timeline + auto-priorities + generational continuity + dynamic map + PeerJS multiplayer

const INTRO_EVENTS = [
  { year: "~1850 BC", title: "Jacob is Named Israel", text: "After wrestling through the night at the Jabbok ford, Jacob is renamed Israel — 'he who strives with God.' He becomes the father of the twelve tribes.", video: "intro/jacob.mp4" },
  { year: "~1700 BC", title: "Joseph in Egypt", text: "Joseph is sold into slavery, rises to power under Pharaoh, and brings his family (including Jacob/Israel) into Egypt during a famine. The people of Israel settle in Goshen.", video: "intro/joseph.mp4" },
  { year: "~1446 BC", title: "The Exodus", text: "Moses leads the Israelites out of Egypt. They receive the Law at Sinai and wander in the wilderness.", video: "intro/exodus.mp4" },
  { year: "~1406 BC", title: "Conquest under Joshua", text: "Joshua leads the people into the Promised Land. Jericho falls and the tribes receive their allotments.", video: "intro/joshua.mp4" },
  { year: "~1375–1050 BC", title: "Period of the Judges", text: "There is no king in Israel. Cycles of apostasy, oppression, and deliverance. Judges include Deborah, Gideon, Jephthah, and Samson.", video: "intro/judges.mp4?v=2" },
  { year: "~1080–1050 BC", title: "Samuel the Prophet-Judge", text: "Samuel judges Israel. The ark is captured and returned. The people demand a king.", video: "intro/samuel.mp4?v=2" },
  { year: "1050 BC", title: "Call for a King", text: "The stage is set for the United Kingdom under Saul, David, and Solomon.", video: "intro/king.mp4" }
];

const BIBLICAL_NAMES = ["Eliab", "Abner", "Amaziah", "Boaz", "Caleb", "Daniel", "Elijah", "Gideon", "Hosea", "Isaac", "Joel", "Micah", "Nathan", "Obadiah", "Phinehas", "Reuben", "Samuel", "Tobiah", "Uriah", "Zechariah"];

const game = {
  player: null,
  year: 1050,
  started: false,
  currentEvent: null,
  paused: false,
  speedSecondsPerYear: 5,
  yearTimer: null,
  narrativeLines: [],
  maxNarrativeLines: 40,
  households: [],
  peer: null,
  connections: [],
  isHost: false,
  roomCode: null,
  introIndex: 0,
  introSound: true,
  generation: 1,
  priorities: { farm: true, trade: true, family: true, pray: false },
  mapMarkers: [],
  metricHistory: { health: [], wealth: [], food: [], livestock: [], family: [], piety: [] },
  witnessed: [],
  lineage: [],
  ended: false
};

const REGION_POSITIONS = {
  Manasseh: { x: 168, y: 150, color: '#6d4c41' },
  Ephraim: { x: 172, y: 210, color: '#5d4037' },
  Benjamin: { x: 180, y: 272, color: '#4e342e' },
  Judah: { x: 162, y: 355, color: '#3e2723' }
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
  document.getElementById('skip-intro').addEventListener('click', () => finishIntro());
  document.getElementById('intro-prev').addEventListener('click', () => showIntroSegment(game.introIndex - 1));
  document.getElementById('intro-next').addEventListener('click', () => showIntroSegment(game.introIndex + 1));
  document.getElementById('intro-start').addEventListener('click', () => startCurrentIntro());
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('mp-toggle').addEventListener('click', toggleMultiplayer);
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
  const copyBtn = document.getElementById('copy-summary');
  if (copyBtn) copyBtn.addEventListener('click', copySummary);

  ['farm','trade','family','pray'].forEach(p => {
    const el = document.getElementById('prio-' + p);
    if (el) el.addEventListener('change', () => { game.priorities[p] = el.checked; });
  });

  // Randomize name always on load
  const nameInput = document.getElementById('player-name');
  if (nameInput) {
    nameInput.value = BIBLICAL_NAMES[Math.floor(Math.random() * BIBLICAL_NAMES.length)];
  }

  playIntro();
}

let mpQrReady = false;
function renderMainQr() {
  const box = document.getElementById('main-qr');
  if (!box || box.dataset.ready === '1') return;
  const url = window.location.href.split('?')[0].split('#')[0];
  const urlEl = document.getElementById('main-url');
  if (urlEl) urlEl.textContent = url;
  box.innerHTML = '';
  const size = Math.max(128, Math.min(180, Math.floor(window.innerWidth * 0.5)));
  try {
    new QRCode(box, {
      text: url,
      width: size,
      height: size,
      correctLevel: QRCode.CorrectLevel.M
    });
    box.dataset.ready = '1';
  } catch (err) {
    box.textContent = url;
  }
}
function toggleMultiplayer() {
  const panel = document.getElementById('mp-section');
  panel.classList.toggle('hidden');
  const open = !panel.classList.contains('hidden');
  document.getElementById('mp-toggle').textContent = open ? 'Hide multiplayer' : 'Multiplayer';
}

let introBlobUrls = new Map();
let introFetches = new Map();
let introShowToken = 0;

function playIntro() {
  ensureIntroVideo();
  prefetchIntro(0);
  prefetchIntro(1);
  prefetchIntro(2);
  showIntroSegment(0);
}
function mediaUrl(rel) {
  return new URL(rel, window.location.href).href;
}
function prefetchIntro(index) {
  if (index < 0 || index >= INTRO_EVENTS.length) return Promise.resolve(null);
  const src = mediaUrl(INTRO_EVENTS[index].video);
  if (introBlobUrls.has(src)) return Promise.resolve(introBlobUrls.get(src));
  if (introFetches.has(src)) return introFetches.get(src);
  const task = fetch(src).then(response => {
    if (!response.ok) throw new Error('video ' + response.status);
    return response.blob();
  }).then(blob => {
    const url = URL.createObjectURL(blob);
    introBlobUrls.set(src, url);
    const next = INTRO_EVENTS.findIndex(ev => mediaUrl(ev.video) === src) + 1;
    if (next > 0 && next < INTRO_EVENTS.length && !introBlobUrls.has(mediaUrl(INTRO_EVENTS[next].video))) prefetchIntro(next);
    return url;
  }).catch(err => {
    introFetches.delete(src);
    throw err;
  });
  introFetches.set(src, task);
  return task;
}
function ensureIntroVideo() {
  let video = document.getElementById('intro-video');
  if (video) return video;
  video = document.createElement('video');
  video.id = 'intro-video';
  video.className = 'intro-video is-hidden';
  video.playsInline = true;
  video.controls = false;
  video.preload = 'auto';
  const wrap = document.getElementById('intro-video-wrap');
  wrap.insertBefore(video, document.getElementById('intro-start'));
  video.addEventListener('click', event => {
    video.controls = true;
    event.stopPropagation();
  });
  return video;
}
function showStartPrompt() {
  document.getElementById('intro-start').classList.remove('hidden');
}
function hideStartPrompt() {
  document.getElementById('intro-start').classList.add('hidden');
}
function startCurrentIntro() {
  const video = document.getElementById('intro-video');
  if (!video) return;
  hideStartPrompt();
  video.muted = false;
  video.volume = 1;
  const pending = video.play();
  if (pending && pending.catch) pending.catch(() => showStartPrompt());
}
function showIntroSegment(index) {
  if (index >= INTRO_EVENTS.length) { finishIntro(); return; }
  if (index < 0) index = 0;
  const token = ++introShowToken;
  game.introIndex = index;
  const ev = INTRO_EVENTS[index];
  document.getElementById('intro-content').innerHTML = `<strong>${ev.year}</strong><br><em>${ev.title}</em><br><br>${ev.text}`;
  document.getElementById('intro-progress').textContent = `Segment ${index + 1} of ${INTRO_EVENTS.length}`;

  const video = ensureIntroVideo();
  video.controls = false;
  video.onended = null;
  video.pause();
  video.classList.add('is-hidden');
  prefetchIntro(index + 1);
  prefetchIntro(index + 2);

  prefetchIntro(index).then(url => {
    if (token !== introShowToken || !url) return;
    if (video.src !== url) video.src = url;
    video.loop = false;
    video.muted = false;
    video.volume = 1;
    video.classList.remove('is-hidden');
    video.onended = () => {
      if (game.introIndex !== index) return;
      video.onended = null;
      video.pause();
      video.controls = false;
      video.classList.add('is-hidden');
      video.removeAttribute('src');
      video.load();
      showIntroSegment(index + 1);
    };
    video.onerror = () => {
      document.getElementById('intro-progress').textContent = 'Could not play this segment.';
    };
    const begin = () => {
      if (token !== introShowToken) return;
      try { if (video.currentTime > 0.05) video.currentTime = 0; } catch (err) {}
      const pending = video.play();
      if (pending && pending.then) {
        pending.then(() => hideStartPrompt()).catch(() => {
          if (token !== introShowToken) return;
          video.pause();
          showStartPrompt();
        });
      }
    };
    if (video.readyState >= 3) begin();
    else video.addEventListener('canplay', begin, { once: true });
  }).catch(() => {
    if (token !== introShowToken) return;
    document.getElementById('intro-progress').textContent = 'Could not load this segment.';
  });
}
function finishIntro() {
  introShowToken++;
  const video = document.getElementById('intro-video');
  if (video) {
    video.pause();
    video.onended = null;
    video.controls = false;
    video.classList.add('is-hidden');
  }
  document.getElementById('intro-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  requestAnimationFrame(() => requestAnimationFrame(renderMainQr));
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
  game.households = [{ name, region, generation: 1, isLocal: true }, ...simulatedHouseholds(name)];
  game.mapMarkers = [];
  game.metricHistory = { health: [], wealth: [], food: [], livestock: [], family: [], piety: [] };
  game.witnessed = [];
  game.lineage = [name];
  game.ended = false;
  noteMetrics();

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  document.getElementById('intro-screen').classList.add('hidden');

  updateStatus();
  updateTimeline();
  addNarrative(`Generation ${game.generation}: You are ${name}, a young ${profession} in ${region}. Year ${game.year} BC. Set priorities so your household produces food and wealth automatically each year.`);
  updateKingdom();
  drawMap();
  restartYearTimer();

  if (game.isHost) broadcast({ type: 'sync', year: game.year, speed: game.speedSecondsPerYear, households: game.households, markers: game.mapMarkers });
}

function simulatedHouseholds(playerName) {
  const neighbors = [
    { name: "Hanan", region: "Ephraim" },
    { name: "Miriam", region: "Judah" },
    { name: "Tola", region: "Manasseh" },
    { name: "Achsah", region: "Benjamin" },
    { name: "Zebulun", region: "Judah" }
  ];
  return neighbors
    .filter(n => n.name !== playerName)
    .map(n => ({ name: n.name, region: n.region, generation: 1, isLocal: false, simulated: true }));
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
  const familyName = document.getElementById('family-name');
  if (familyName) familyName.textContent = p.name;
  drawMeters();
}

const METER_MAX = { health: 100, wealth: 120, food: 50, livestock: 30, family: 10, piety: 100 };

function noteMetrics() {
  if (!game.player) return;
  Object.keys(game.metricHistory).forEach(key => {
    const series = game.metricHistory[key];
    series.push(Number(game.player[key]) || 0);
    if (series.length > 80) series.shift();
  });
  drawMeters();
}

function drawMeters() {
  if (!game.player) return;
  Object.keys(METER_MAX).forEach(key => {
    const value = Number(game.player[key]) || 0;
    const fill = document.getElementById('bar-' + key);
    if (fill) fill.style.width = Math.max(0, Math.min(100, (value / METER_MAX[key]) * 100)) + '%';
    const valueEl = document.getElementById('val-' + key);
    if (valueEl) valueEl.textContent = String(value);
    const canvas = document.getElementById('spark-' + key);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const series = game.metricHistory[key];
    if (!series.length) return;
    const max = Math.max(METER_MAX[key], ...series, 1);
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    series.forEach((n, i) => {
      const x = series.length === 1 ? w - 2 : (i / (series.length - 1)) * (w - 2) + 1;
      const y = h - 2 - (n / max) * (h - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
}

function updateTimeline() {
  const pastList = document.getElementById('past-list');
  const upcomingList = document.getElementById('upcoming-list');
  if (!pastList || !upcomingList) return;

  // Past = earlier years (higher BC numbers)
  const past = TIMELINE.filter(e => e.year > game.year).slice(-4);
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
  const lines = String(text).split('\n').map(line => line.trim()).filter(Boolean);
  game.narrativeLines.push(...lines);
  if (game.narrativeLines.length > game.maxNarrativeLines) {
    game.narrativeLines = game.narrativeLines.slice(-game.maxNarrativeLines);
  }
  const el = document.getElementById('narrative');
  el.replaceChildren();
  game.narrativeLines.forEach(line => {
    const row = document.createElement('div');
    row.className = 'log-line';
    row.textContent = line;
    el.appendChild(row);
  });
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
  noteMetrics();
  updateStatus();

  const event = TIMELINE.find(e => e.year === game.year);
  if (event) {
    triggerHistoricalEvent(event);
    broadcast({ type: 'event', text: `${event.year} BC: ${event.title}` });
    if (event.mapMarker) {
      game.mapMarkers.push(event.mapMarker);
      broadcast({ type: 'marker', marker: event.mapMarker });
    }
    updateKingdom();
    updateTimeline();
    drawMap();
    return;
  }

  if (Math.random() < 0.15 && game.player) triggerPersonalEvent();
  else addNarrative(`The year ${game.year} BC passes.`);

  updateStatus();
  updateKingdom();
  updateTimeline();
  drawMap();
  broadcast({ type: 'year', year: game.year });
  checkDeathOrSuccession();
}

function triggerHistoricalEvent(event) {
  game.currentEvent = event;
  if (game.witnessed && !game.witnessed.includes(event.title)) game.witnessed.push(event.title);
  addNarrative(`\n=== ${event.title} (${event.year} BC) ===\n${event.text}`);
  if (event.mapNote) addNarrative(`Map note: ${event.mapNote}`);
  showChoices([
    { text: "Endure and adapt", effect: () => addNarrative("You weather the changes.") },
    { text: "Seek advantage", effect: () => { game.player.wealth += Math.random() > 0.5 ? 12 : -4; addNarrative("Fortune shifts."); } },
    { text: "Turn more to the Lord", effect: () => { game.player.piety += 10; addNarrative("You increase offerings."); } }
  ], true);
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
  addNarrative(`Personal event: ${ev.text}`);
  showChoices(ev.choices, true);
}

let choiceTimer = null;
function showChoices(choices, autoPick) {
  if (choiceTimer) { clearTimeout(choiceTimer); choiceTimer = null; }
  const container = document.getElementById('choices');
  container.innerHTML = '';
  const resolve = (choice, auto) => {
    if (!game.currentEvent) return;
    if (choiceTimer) { clearTimeout(choiceTimer); choiceTimer = null; }
    game.currentEvent = null;
    choice.effect();
    if (auto) addNarrative(`No choice in 5 seconds. The household decided: ${choice.text}.`);
    clearChoices();
    noteMetrics();
    updateStatus();
    updateTimeline();
    drawMap();
    checkDeathOrSuccession();
    addNarrative("The year continues...");
  };
  if (autoPick && choices.length) {
    const timer = document.createElement('div');
    timer.className = 'choice-timer';
    timer.title = 'Time left to choose';
    const fill = document.createElement('div');
    fill.className = 'choice-timer-fill';
    timer.appendChild(fill);
    container.appendChild(timer);
    choiceTimer = setTimeout(() => {
      const choice = choices[Math.floor(Math.random() * choices.length)];
      resolve(choice, true);
    }, 5000);
  }
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.type = 'button';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => resolve(choice, false));
    container.appendChild(btn);
  });
}

function checkDeathOrSuccession() {
  if (!game.player) return;
  const p = game.player;
  if (game.year < 690) {
    if (game.yearTimer) clearInterval(game.yearTimer);
    showSummary();
    return;
  }
  if (p.health <= 0 || p.age > 65) {
    const reason = p.health <= 0 ? "from hardship" : "of old age";
    addNarrative("Generation " + p.generation + " ends " + reason + " (age " + p.age + ").");
    game.generation += 1;
    const newName = p.name.split(" ")[0] + " II";
    createNewHousehold(newName, p.profession, p.region);
    game.households = game.households.filter(h => !h.isLocal);
    game.households.push({ name: newName, region: p.region, generation: game.generation, isLocal: true });
    game.lineage.push(newName);
    addNarrative("A new generation begins: " + newName + ", age 16, continues the household in " + p.region + ". The story of the land goes on.");
    updateStatus();
    broadcast({ type: "household", household: { name: newName, region: p.region, generation: game.generation, isLocal: false } });
  }
}

function updateKingdom() {
  if (!game.player) return;
  const year = game.year;
  const region = game.player.region;
  if (year > 930) game.player.kingdom = "United Kingdom";
  else if (region === "Judah" || region === "Benjamin") game.player.kingdom = "Kingdom of Judah";
  else if (year <= 722) game.player.kingdom = "Assyrian province";
  else game.player.kingdom = "Kingdom of Israel";
  const el = document.getElementById('kingdom');
  if (el) el.textContent = game.player.kingdom;
  updateKingBios();
}

const KING_BIOS = {
  Saul: "First king of Israel, a Benjaminite anointed by Samuel. He ruled from Gibeah, fought the Ammonites and Philistines, and was rejected after he spared Agag and offered sacrifice at Gilgal. He died on Mount Gilboa. (1 Samuel 9–31)",
  David: "Of Bethlehem in Judah. Anointed by Samuel, he served Saul and killed Goliath, then fled Saul’s court. He reigned at Hebron over Judah about seven years, captured Jerusalem, and ruled all Israel. He brought up the ark and received the promise of a lasting house. (2 Samuel; 1 Kings 2)",
  Solomon: "Son of David and Bathsheba. He asked for wisdom, built the Temple and palace in Jerusalem, and widened trade. Heavy labor and high taxation marked the reign, and he turned to the gods of his foreign wives. (1 Kings 1–11)",
  Rehoboam: "Son of Solomon. At Shechem he refused to lighten his father’s yoke, and the northern tribes made Jeroboam king. He ruled Judah from Jerusalem. Shishak of Egypt plundered the Temple in his reign. (1 Kings 12; 14)",
  Abijah: "Son of Rehoboam. He reigned briefly in Judah and fought Jeroboam of Israel. Chronicles credits him with a victory and a speech against the golden calves. (1 Kings 15; 2 Chronicles 13)",
  Asa: "King of Judah. He removed idols and relied on the Lord against Zerah the Cushite. Later he hired Ben-hadad of Aram to draw Baasha away from Ramah. (1 Kings 15; 2 Chronicles 14–16)",
  Jehoshaphat: "King of Judah. He sent teachers of the law through the towns of Judah and allied with Ahab, including the campaign to Ramoth-gilead. (1 Kings 22; 2 Chronicles 17–20)",
  Jehoram: "Son of Jehoshaphat and husband of Athaliah, daughter of Ahab. He walked in the ways of the kings of Israel and lost Edom. (2 Kings 8; 2 Chronicles 21)",
  Athaliah: "Daughter of Ahab and Jezebel. After her son Ahaziah died she killed the royal family of Judah and took the throne. Joash was hidden in the Temple for six years, then she was overthrown. (2 Kings 11)",
  Joash: "Hidden as an infant in the Temple and crowned at seven. Under Jehoiada he repaired the Temple. After the priest’s death he turned aside. (2 Kings 12; 2 Chronicles 24)",
  Amaziah: "King of Judah. He defeated Edom, then challenged Jehoash of Israel, was captured, and saw part of Jerusalem’s wall broken down. (2 Kings 14)",
  Uzziah: "Also called Azariah. He strengthened Judah’s army and borders during a long reign, then entered the Temple to burn incense and was struck with a skin disease. (2 Kings 15; 2 Chronicles 26)",
  Jotham: "Son of Uzziah. He governed while his father lived apart, then reigned in his own right, and built the upper gate of the Temple. (2 Kings 15; 2 Chronicles 27)",
  Ahaz: "King of Judah in the days of Isaiah. He adopted foreign altars and, during the attack by Rezin and Pekah, appealed to Tiglath-pileser III of Assyria. (2 Kings 16; Isaiah 7)",
  Hezekiah: "King of Judah. He reformed worship and trusted the Lord when Sennacherib besieged Jerusalem in 701. The Assyrian army withdrew. His tunnel brought water into the city. (2 Kings 18–20)",
  Jeroboam: "An Ephraimite officer of Solomon. He led the northern tribes after Rehoboam’s refusal and set golden calves at Bethel and Dan. He built at Shechem and Penuel; the court was later at Tirzah. (1 Kings 11–14)",
  Nadab: "Son of Jeroboam. He reigned about two years over Israel and was killed by Baasha during the siege of Gibbethon. (1 Kings 15)",
  Baasha: "He seized Israel’s throne, wiped out Jeroboam’s house, and warred with Asa of Judah from Ramah until Ben-hadad broke the siege. (1 Kings 15–16)",
  Elah: "Son of Baasha. He reigned in Tirzah about two years and was killed by Zimri, who himself lasted only seven days. (1 Kings 16)",
  Omri: "Commander of the army. He overcame Tibni, bought the hill of Samaria, and made it the capital. The books of Kings condemn his religious policy. He was the father of Ahab. (1 Kings 16)",
  Ahab: "Son of Omri. He married Jezebel of Sidon and promoted Baal worship. Elijah confronted him, including on Mount Carmel. He took Naboth’s vineyard and died at Ramoth-gilead. (1 Kings 16–22)",
  Ahaziah: "Son of Ahab. After a fall he inquired of Baal-zebub and died, as Elijah had said. His brother Joram reigned in his place. (1 Kings 22; 2 Kings 1)",
  Joram: "Son of Ahab, also called Jehoram. He reigned in Samaria, fought Moab and Aram, and was killed by Jehu in the plot that ended Ahab’s house. (2 Kings 3; 9)",
  Jehu: "Anointed by a prophet sent from Elisha. He killed Joram, Ahaziah of Judah, and Jezebel, and destroyed the Baal temple in Samaria. He left Jeroboam’s calves in place. (2 Kings 9–10)",
  Jehoahaz: "Son of Jehu. In his reign Hazael of Aram oppressed Israel and left the army only a remnant. (2 Kings 13)",
  Jehoash: "Son of Jehoahaz, king of Israel. He visited the dying Elisha, defeated Aram, and broke down part of Jerusalem’s wall after Amaziah challenged him. (2 Kings 13–14)",
  "Jeroboam II": "Son of Jehoash. He restored Israel’s borders from Lebo-hamath to the Sea of the Arabah. It was a time of wealth and injustice, and of Amos and Hosea. (2 Kings 14)",
  Zechariah: "Son of Jeroboam II. He reigned six months in Samaria and was killed by Shallum, ending the dynasty of Jehu. (2 Kings 15)",
  Menahem: "He seized Israel’s throne and paid tribute to Pul, Tiglath-pileser of Assyria, exacting the silver from the wealthy. (2 Kings 15)",
  Pekahiah: "Son of Menahem. He reigned in Samaria about two years and was killed by Pekah, his officer. (2 Kings 15)",
  Pekah: "Son of Remaliah. With Rezin of Aram he attacked Ahaz of Judah. Tiglath-pileser then took Galilee and Gilead and carried people into exile. (2 Kings 15–16)",
  Hoshea: "Last king of Israel. He became Assyria’s vassal, then turned to Egypt. Shalmaneser V imprisoned him and besieged Samaria. The city fell in 722, and the northern kingdom ended. (2 Kings 17)"
};

function updateKingBios() {
  const el = document.getElementById('king-bios');
  if (!el || !game.started) return;
  const kings = kingsAt(game.year);
  el.innerHTML = kings.map(king => {
    const bio = KING_BIOS[king.who] || "";
    return `<article><h3>${king.who}</h3><p class="king-meta">King of ${king.realm} · ${king.where}</p><p>${bio}</p></article>`;
  }).join("");
}

function showSummary() {
  if (game.ended) return;
  game.ended = true;
  const p = game.player;
  const kings = [];
  for (let y = 1050; y >= game.year; y--) {
    kingsAt(y).forEach(king => {
      const label = king.who + " of " + king.realm;
      if (!kings.includes(label)) kings.push(label);
    });
  }
  const lines = [
    "House of " + (game.lineage[0] || p.name),
    "A " + p.profession + " household in " + p.region + ", about 1050–" + game.year + " BC.",
    "Generations: " + (game.lineage.length ? game.lineage.join(" → ") : p.name) + " (" + p.generation + ").",
    "At the end the land around them was the " + p.kingdom + ".",
    "Final stores: food " + p.food + ", livestock " + p.livestock + ", wealth " + p.wealth + " shekels, family " + p.family + ", piety " + p.piety + ", health " + p.health + ".",
    "Kings who ruled during this household's years: " + kings.join("; ") + ".",
    "Events they lived through: " + (game.witnessed.length ? game.witnessed.join("; ") : "the ordinary years of the land") + ".",
    "Share this account from Kingdoms of Israel."
  ];
  const text = lines.join("\n");
  const panel = document.getElementById('summary-panel');
  const box = document.getElementById('summary-text');
  if (box) box.textContent = text;
  if (panel) panel.classList.remove('hidden');
  addNarrative("The years of this simulation are complete. A summary of your household is ready to copy and share.");
}

function copySummary() {
  const box = document.getElementById('summary-text');
  const btn = document.getElementById('copy-summary');
  if (!box) return;
  const text = box.textContent;
  const done = () => { if (btn) btn.textContent = "Copied"; };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => {
      box.focus();
      document.execCommand("selectAll");
    });
  }
}

const PLACES = {
  Gibeah: { x: 186, y: 278 },
  Hebron: { x: 168, y: 388 },
  Jerusalem: { x: 178, y: 308 },
  Shechem: { x: 176, y: 186 },
  Tirzah: { x: 208, y: 176 },
  Samaria: { x: 152, y: 198 },
  Dan: { x: 190, y: 52 },
  Bethel: { x: 182, y: 252 }
};

function kingsAt(year) {
  if (year > 1050) return [];
  if (year > 1010) return [{ who: "Saul", where: "Gibeah", realm: "Israel" }];
  if (year > 1000) return [{ who: "David", where: "Hebron", realm: "Judah" }];
  if (year > 970) return [{ who: "David", where: "Jerusalem", realm: "Israel" }];
  if (year > 930) return [{ who: "Solomon", where: "Jerusalem", realm: "Israel" }];
  const judah = { who: kingOfJudah(year), where: "Jerusalem", realm: "Judah" };
  if (year < 722) return [judah];
  let israelWhere = "Shechem";
  if (year <= 910 && year > 870) israelWhere = "Tirzah";
  if (year <= 870) israelWhere = "Samaria";
  return [judah, { who: kingOfIsrael(year), where: israelWhere, realm: "Israel" }];
}

function kingOfJudah(year) {
  if (year > 913) return "Rehoboam";
  if (year > 910) return "Abijah";
  if (year > 869) return "Asa";
  if (year > 848) return "Jehoshaphat";
  if (year > 841) return "Jehoram";
  if (year > 835) return "Athaliah";
  if (year > 796) return "Joash";
  if (year > 767) return "Amaziah";
  if (year > 740) return "Uzziah";
  if (year > 732) return "Jotham";
  if (year > 716) return "Ahaz";
  return "Hezekiah";
}

function kingOfIsrael(year) {
  if (year > 909) return "Jeroboam";
  if (year > 908) return "Nadab";
  if (year > 886) return "Baasha";
  if (year > 885) return "Elah";
  if (year > 874) return "Omri";
  if (year > 853) return "Ahab";
  if (year > 852) return "Ahaziah";
  if (year > 841) return "Joram";
  if (year > 814) return "Jehu";
  if (year > 798) return "Jehoahaz";
  if (year > 782) return "Jehoash";
  if (year > 753) return "Jeroboam II";
  if (year > 752) return "Zechariah";
  if (year > 742) return "Menahem";
  if (year > 740) return "Pekahiah";
  if (year > 732) return "Pekah";
  return "Hoshea";
}

function drawPlace(ctx, x, y, label, fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = "#3e2723";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(x - 5, y - 5, 10, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3e2723";
  ctx.font = "bold 10px Georgia";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 8, y + 3);
}

function drawKing(ctx, king, index) {
  const place = PLACES[king.where];
  if (!place) return;
  const x = place.x + (king.realm === "Israel" && king.where === "Jerusalem" ? 0 : 0);
  const y = place.y - 16 - index * 14;
  ctx.fillStyle = "#f9a825";
  ctx.strokeStyle = "#3e2723";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3e2723";
  ctx.font = "bold 10px Georgia";
  ctx.textAlign = "left";
  ctx.fillText(`${king.who} · ${king.where}`, x + 10, y + 3);
}

function drawLand(ctx) {
  ctx.beginPath();
  ctx.moveTo(188, 28);
  ctx.lineTo(150, 46);
  ctx.lineTo(112, 78);
  ctx.lineTo(72, 118);
  ctx.lineTo(64, 168);
  ctx.lineTo(58, 240);
  ctx.lineTo(66, 320);
  ctx.lineTo(92, 400);
  ctx.lineTo(130, 462);
  ctx.lineTo(188, 482);
  ctx.lineTo(236, 460);
  ctx.lineTo(252, 390);
  ctx.lineTo(246, 300);
  ctx.lineTo(268, 220);
  ctx.lineTo(286, 140);
  ctx.lineTo(262, 70);
  ctx.lineTo(220, 32);
  ctx.closePath();
}

function drawMap() {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#7eb6d6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawLand(ctx);
  ctx.fillStyle = '#d7c4a3';
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  if (game.year <= 930) {
    ctx.save();
    drawLand(ctx);
    ctx.clip();
    ctx.fillStyle = 'rgba(46, 125, 50, 0.35)';
    ctx.fillRect(0, 0, canvas.width, 268);
    ctx.fillStyle = 'rgba(109, 76, 65, 0.28)';
    ctx.fillRect(0, 268, canvas.width, canvas.height);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(60, 268);
    ctx.lineTo(250, 258);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#1b5e20';
    ctx.font = 'bold 13px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(game.year < 722 ? 'Assyrian province' : 'Israel', 160, 120);
    ctx.fillStyle = '#4e342e';
    ctx.fillText('Judah', 160, 400);
  }

  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.ellipse(228, 108, 22, 14, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(228, 340, 18, 52, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4fc3f7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(228, 122);
  ctx.lineTo(232, 200);
  ctx.lineTo(226, 288);
  ctx.stroke();

  ctx.fillStyle = '#1a3a4a';
  ctx.font = '11px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('Great Sea', 8, 230);
  ctx.fillText('Galilee', 210, 96);
  ctx.fillText('Jordan', 238, 210);
  ctx.fillText('Dead Sea', 198, 348);

  Object.entries(REGION_POSITIONS).forEach(([name, pos]) => {
    ctx.fillStyle = pos.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8e1';
    ctx.font = 'bold 11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(name.slice(0, 8), pos.x, pos.y + 4);
  });

  // Dynamic historical markers
  game.mapMarkers.forEach(m => {
    if (/Jerusalem|Temple|Samaria/i.test(m.name || "")) return;
    ctx.fillStyle = m.color || '#ff9800';
    ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e2723'; ctx.font = '9px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(m.name, m.x + 10, m.y + 3);
  });

  // Households
  game.households.forEach(h => {
    const pos = REGION_POSITIONS[h.region] || REGION_POSITIONS.Ephraim;
    const same = game.households.filter(other => other.region === h.region);
    const i = same.indexOf(h);
    const angle = (i / Math.max(same.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const x = pos.x + Math.cos(angle) * 28;
    const y = pos.y + Math.sin(angle) * 22;
    ctx.fillStyle = h.isLocal ? '#c62828' : (h.simulated ? '#2e7d32' : '#1565c0');
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e2723'; ctx.font = '9px Georgia'; ctx.textAlign = 'left';
    ctx.fillText((h.name || '').slice(0, 10), x + 10, y + 3);
  });

  // Cities and the reigning king, derived from the year so they cannot be missed.
  if (game.year <= 1000) {
    const jerusalem = PLACES.Jerusalem;
    drawPlace(ctx, jerusalem.x, jerusalem.y, game.year <= 960 ? "Jerusalem · Temple" : "Jerusalem", "#8d6e63");
  }
  if (game.year <= 870) {
    const samaria = PLACES.Samaria;
    drawPlace(ctx, samaria.x, samaria.y, game.year < 722 ? "Samaria (fallen)" : "Samaria", "#6a1b9a");
  }
  kingsAt(game.year).forEach((king, i) => drawKing(ctx, king, i));

  ctx.fillStyle = '#0d2c3d';
  ctx.font = 'bold 14px Georgia';
  ctx.textAlign = 'right';
  ctx.fillText(`${game.year} BC`, canvas.width - 12, canvas.height - 12);

  const legend = document.getElementById('map-legend');
  if (legend) {
    const border = game.year <= 930 ? ' &nbsp; Dashed line = Israel / Judah' : '';
    legend.innerHTML = '<span style="color:#f9a825">●</span> King &nbsp; <span style="color:#8d6e63">■</span> Jerusalem &nbsp; <span style="color:#c62828">●</span> You &nbsp; <span style="color:#2e7d32">●</span> Neighbors' + border;
  }
}

document.addEventListener('DOMContentLoaded', init);
