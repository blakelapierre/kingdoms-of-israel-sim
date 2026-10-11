// Kingdoms of Israel: A Commoner's Tale
// Core simulation engine

const game = {
  player: null,
  year: 1050, // BC
  started: false,
  currentEvent: null,
  historicalEvents: []
};

// Historical timeline (approximate BC years)
const TIMELINE = [
  { year: 1050, title: "Call for a King", text: "The people of Israel, pressed by the Philistines and weary of the judges, demand a king like the other nations. The prophet Samuel warns them of the cost, but the elders insist. Rumors spread that a man of Benjamin named Saul has been anointed." },
  { year: 1030, title: "Saul's Early Wars", text: "King Saul gathers the tribes and wins victories against the Ammonites and Philistines. Conscription and taxes begin to weigh on the villages. Some young men are called to fight." },
  { year: 1010, title: "Rise of David", text: "A young shepherd from Bethlehem named David becomes famous after defeating a Philistine champion. Saul grows jealous. Some in Judah speak of David's strength and the Lord's favor upon him." },
  { year: 1000, title: "David Unites the Kingdom", text: "After Saul's death, David is anointed king over all Israel. He captures Jerusalem and makes it his capital. The ark is brought up. For a time, the land knows relative peace and the borders expand." },
  { year: 970, title: "Solomon's Reign Begins", text: "Solomon succeeds David. Wisdom, wealth, and building projects mark the early years. Trade flourishes with Tyre and Egypt. The people are taxed to support the court and the great temple works." },
  { year: 960, title: "The Temple is Built", text: "Solomon completes the great Temple in Jerusalem. Priests and Levites serve there. Many from the tribes go up for the dedications. The glory of the Lord fills the house, and the people rejoice—yet the cost of cedar and gold has been heavy." },
  { year: 930, title: "The Kingdom Divides", text: "Solomon dies. His son Rehoboam refuses to lighten the yoke. The northern tribes under Jeroboam reject the house of David and form the Kingdom of Israel, with capitals eventually at Shechem, Tirzah, and Samaria. Judah remains under the Davidic line. You must choose or are forced by location which kingdom you inhabit." },
  { year: 910, title: "Jeroboam's Calves", text: "To keep the northern people from going to Jerusalem, Jeroboam sets up golden calves at Bethel and Dan. Many in the north worship there. Prophets warn against it. Border tensions with Judah rise." },
  { year: 870, title: "Omri and Ahab", text: "Omri builds Samaria as a strong capital. His son Ahab marries Jezebel of Sidon and promotes Baal worship. Elijah the prophet appears, challenging the king and calling for rain after drought." },
  { year: 850, title: "Elijah and the Drought", text: "A severe drought grips the land for years, as Elijah declared. Famine spreads. Some seek the prophets of Baal; others hide prophets of the Lord. The showdown on Mount Carmel is spoken of in the villages." },
  { year: 841, title: "Jehu's Coup", text: "Jehu, anointed by Elisha, destroys the house of Ahab, kills Jezebel, and purges Baal worship in the north. He becomes king of Israel. Blood and upheaval mark the year." },
  { year: 800, title: "Wars with Aram", text: "The Arameans of Damascus press hard against Israel. Border villages are raided. Kings of Israel and Judah sometimes ally, sometimes fight. Elisha's miracles are told around campfires." },
  { year: 760, title: "Prosperity under Jeroboam II", text: "Under Jeroboam II, Israel expands and grows wealthy. Amos the prophet denounces the rich for oppressing the poor and ignoring justice. Trade increases, but inequality grows." },
  { year: 750, title: "Hosea and the Prophets", text: "Hosea warns of coming judgment for idolatry and injustice. The northern kingdom is unstable with rapid successions of kings. Assyria's shadow grows longer." },
  { year: 734, title: "Assyrian Invasion Begins", text: "Tiglath-Pileser III of Assyria campaigns in the region, taking Galilee and Transjordan. Many are deported. Israel becomes a vassal. Fear spreads through the northern tribes." },
  { year: 722, title: "Fall of Samaria", text: "After a long siege, Samaria falls to Shalmaneser V and Sargon II of Assyria. The Northern Kingdom of Israel ceases to exist as an independent state. Large numbers of Israelites are exiled; foreign peoples are settled in the land. Those who remain must decide whether to flee south to Judah, submit, or hide." },
  { year: 701, title: "Sennacherib and Hezekiah", text: "Sennacherib of Assyria invades Judah, destroys Lachish, and besieges Jerusalem. King Hezekiah of Judah has prepared the city and digs a tunnel for water. The Assyrians withdraw after heavy tribute—or, as some say, by the hand of the Lord. The south survives, for now." }
];

function init() {
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });
}

function startGame() {
  const name = document.getElementById('player-name').value || "Eliab";
  const profession = document.getElementById('profession').value;
  const region = document.getElementById('region').value;

  game.player = {
    name,
    profession,
    region,
    age: 16,
    health: 100,
    wealth: profession === 'merchant' ? 40 : 20,
    food: 15,
    livestock: profession === 'shepherd' ? 12 : 5,
    family: 1,
    piety: 50,
    kingdom: "Tribal Confederation"
  };

  game.year = 1050;
  game.started = true;

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  updateStatus();
  addNarrative(`You are ${name}, a young ${profession} in the territory of ${region}. The land is divided among the tribes. The Philistines are a constant threat, and the people speak of needing a strong leader.\n\nYour household is small. You have some grain, a few animals, and the strength of your youth. The year is 1050 BC.`);

  // Trigger the starting historical moment
  const startEvent = TIMELINE.find(e => e.year === 1050);
  if (startEvent) {
    setTimeout(() => triggerHistoricalEvent(startEvent), 500);
  }
  showYearlyActions();
}

function updateStatus() {
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
  const el = document.getElementById('narrative');
  el.textContent += (el.textContent ? '\n\n' : '') + text;
  el.scrollTop = el.scrollHeight;
}

function clearChoices() {
  document.getElementById('choices').innerHTML = '';
}

function showYearlyActions() {
  clearChoices();
}

function handleAction(action) {
  if (!game.started || game.currentEvent) return;
  const p = game.player;

  switch (action) {
    case 'farm':
      const farmGain = p.profession === 'farmer' ? 8 + Math.floor(Math.random()*6) : 3 + Math.floor(Math.random()*4);
      p.food += farmGain;
      p.health = Math.min(100, p.health + 2);
      addNarrative(`You spend the year tending your ${p.profession === 'shepherd' ? 'flocks' : 'fields'}. You gain ${farmGain} measures of food. The rains were adequate this season.`);
      break;
    case 'trade':
      if (p.food >= 5) {
        const sold = Math.min(p.food, 5 + Math.floor(Math.random()*5));
        p.food -= sold;
        const silver = Math.floor(sold * (1.5 + Math.random()));
        p.wealth += silver;
        addNarrative(`You take goods to the local market or a nearby town. You sell ${sold} measures and gain ${silver} shekels.`);
      } else {
        addNarrative("You have little surplus to trade this year.");
      }
      break;
    case 'family':
      if (p.age >= 18 && p.family < 8 && p.wealth >= 10) {
        if (Math.random() > 0.4) {
          p.family += 1;
          p.wealth -= 8;
          p.food -= 3;
          addNarrative("A child is born to your household. The family grows, but so do the mouths to feed.");
        } else {
          addNarrative("You tend to household matters—repairs, weaving, teaching the young. The family is steady.");
        }
      } else {
        addNarrative("You look after the household. There is always work: grinding grain, mending tools, caring for the young or elderly.");
      }
      break;
    case 'pray':
      p.piety = Math.min(100, p.piety + 8);
      if (Math.random() > 0.6) {
        p.health = Math.min(100, p.health + 5);
        addNarrative("You offer a sacrifice and seek the Lord. You feel a measure of peace and strength.");
      } else {
        addNarrative("You go up to the high place or local shrine (or later, toward Jerusalem) and offer what you can. The priests accept your gift.");
      }
      break;
    case 'advance':
      advanceYear();
      return;
  }
  p.food = Math.max(0, p.food - (2 + Math.floor(p.family / 2)));
  if (p.food < 3) {
    p.health -= 10;
    addNarrative("Food is short. Hunger weakens the household.");
  }
  updateStatus();
  checkDeath();
}

function advanceYear() {
  if (game.currentEvent) return;
  game.year -= 1;
  game.player.age += 1;

  const event = TIMELINE.find(e => e.year === game.year);
  if (event) {
    triggerHistoricalEvent(event);
    return;
  }

  if (Math.random() < 0.35) {
    triggerPersonalEvent();
    return;
  }

  addNarrative(`The year ${game.year} BC passes. The seasons turn. Life continues in the village.`);
  game.player.food = Math.max(0, game.player.food - (2 + Math.floor(game.player.family / 2)));
  if (game.player.food < 3) {
    game.player.health -= 8;
    addNarrative("Food is short. Hunger weakens the household.");
  }
  updateStatus();
  checkDeath();
}

function triggerHistoricalEvent(event) {
  game.currentEvent = event;
  addNarrative(`\n=== ${event.title} (${event.year} BC) ===\n${event.text}`);

  if (event.year === 930) {
    showChoices([
      { text: "Remain where you are (follow local leaders)", effect: () => {
        if (['Ephraim','Manasseh','Benjamin'].includes(game.player.region)) {
          game.player.kingdom = "Kingdom of Israel (North)";
          addNarrative("You find yourself under the new northern kingdom of Israel.");
        } else {
          game.player.kingdom = "Kingdom of Judah";
          addNarrative("You remain under the house of David in Judah.");
        }
      }},
      { text: "Try to move south to Judah", effect: () => {
        game.player.region = "Judah";
        game.player.kingdom = "Kingdom of Judah";
        game.player.wealth -= 15;
        addNarrative("You journey south with what you can carry. The road is hard, but you settle in Judah.");
      }}
    ]);
    return;
  }

  if (event.year === 722) {
    showChoices([
      { text: "Flee south to Judah", effect: () => {
        game.player.region = "Judah";
        game.player.kingdom = "Kingdom of Judah";
        game.player.wealth = Math.max(0, game.player.wealth - 20);
        game.player.livestock = Math.floor(game.player.livestock / 2);
        addNarrative("You abandon much of your land and flee with your family to the safety of Judah. Many others do the same.");
      }},
      { text: "Stay and submit to Assyrian rule", effect: () => {
        game.player.kingdom = "Assyrian Province";
        game.player.health -= 15;
        addNarrative("You remain. Foreign settlers arrive. Taxes are heavy, and the old ways are disrupted. Life becomes harder.");
      }},
      { text: "Hide in the hills", effect: () => {
        game.player.health -= 20;
        game.player.food = Math.max(0, game.player.food - 10);
        addNarrative("You take your family into the hills and caves for a time. It is a hard existence, but you avoid the worst of the deportations.");
      }}
    ]);
    return;
  }

  showChoices([
    { text: "Endure and adapt", effect: () => addNarrative("You and your household weather the changes as best you can.") },
    { text: "Seek advantage or favor", effect: () => {
      if (Math.random() > 0.5) {
        game.player.wealth += 10;
        addNarrative("You manage to gain a little from the shifting fortunes of the powerful.");
      } else {
        game.player.wealth -= 5;
        addNarrative("Your attempts to profit bring risk and some loss.");
      }
    }},
    { text: "Turn more to the Lord (or local shrine)", effect: () => {
      game.player.piety += 10;
      addNarrative("In uncertain times you increase your offerings and prayers.");
    }}
  ]);
}

function triggerPersonalEvent() {
  const events = [
    {
      text: "A drought threatens the harvest.",
      choices: [
        { text: "Pray and wait on the rains", effect: () => { game.player.piety += 5; game.player.food -= 4; } },
        { text: "Buy grain from merchants", effect: () => { game.player.wealth -= 12; game.player.food += 5; } }
      ]
    },
    {
      text: "Raiders or bandits threaten the area.",
      choices: [
        { text: "Defend with neighbors", effect: () => { game.player.health -= 8; game.player.livestock -= 1; } },
        { text: "Pay them off or hide goods", effect: () => { game.player.wealth -= 10; } }
      ]
    },
    {
      text: "A good harvest or increase in the flocks.",
      choices: [
        { text: "Store and celebrate", effect: () => { game.player.food += 10; game.player.piety += 3; } },
        { text: "Sell the surplus", effect: () => { game.player.wealth += 15; game.player.food += 2; } }
      ]
    },
    {
      text: "Illness strikes the household.",
      choices: [
        { text: "Seek a healer or priest", effect: () => { game.player.wealth -= 8; game.player.health += 10; } },
        { text: "Endure it", effect: () => { game.player.health -= 15; } }
      ]
    }
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
      checkDeath();
      addNarrative("The year continues...");
    });
    container.appendChild(btn);
  });
}

function checkDeath() {
  const p = game.player;
  if (p.health <= 0 || p.age > 70 || game.year < 690) {
    let reason = p.health <= 0 ? "from hardship and illness" : p.age > 70 ? "of old age" : "as the simulation reaches its end around 700 BC";
    addNarrative(`\n\n*** Your life ends ${reason}. ***\nYou lived through the age of the judges, the united kingdom, the division, and the fall of the north. Your family, if any remain, carries on the memory of these years.\n\nFinal status: Age ${p.age}, Wealth ${p.wealth}, Family ${p.family}, Piety ${p.piety}.\n\nRefresh the page to live another life.`);
    document.querySelectorAll('.action-btn').forEach(b => b.disabled = true);
  }
}

document.addEventListener('DOMContentLoaded', init);
