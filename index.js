const WebSocket = require('ws');
const ws = new WebSocket('wss://sim3.psim.us/showdown/websocket');

const BOT_NAME = 'CryoxeticBotX2';
const PASSWORD = 'iceninja';

let currentRoom = '';
let quotes = [];

const AUTH_RANKS = ['~', '&', '@', '%', '#', '★', '*', '+'];
const CRYOXETIC_NAME = 'Cryoxetic';

ws.on('open', () => {
  console.log('✅ Connected to Pokémon Showdown');
});

ws.on('message', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.startsWith('>') && !line.startsWith('>|')) {
      currentRoom = line.slice(1).trim();
    }

    if (line.startsWith('|challstr|')) {
      const parts = line.split('|');
      const challstr = parts[2] + '|' + parts[3];

      const req = require('https').request({
        hostname: 'play.pokemonshowdown.com',
        path: '/action.php',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const assertion = JSON.parse(body.slice(1)).assertion;
          ws.send(`|/trn ${BOT_NAME},0,${assertion}`);
          ws.send(`|/join trickhouse`);
          ws.send(`|/join botdevelopment`);
          ws.send(`|/join lobby`);
        });
      });

      req.write(`act=login&name=${BOT_NAME}&pass=${PASSWORD}&challstr=${challstr}`);
      req.end();
    }

    if (line.startsWith('|c:|')) {
      const parts = line.split('|');
      const user = parts[3]?.trim();
      const message = parts[4]?.trim();
      if (user && message && currentRoom) {
        handleCommand(currentRoom, user, message);
      }
    }

    if (line.startsWith('|pm|')) {
      const parts = line.split('|');
      const sender = parts[2].trim();
      const message = parts[4].trim();
      handleCommand(sender, sender, message, true);
    }

    if (line.startsWith('|updatechallenges|')) {
      try {
        const json = JSON.parse(line.split('|')[2]);
        const challenges = json.challengesFrom;
        for (const challenger in challenges) {
          ws.send(`|/accept ${challenger}`);
        }
      } catch {}
    }
  }
});

function handleCommand(target, user, message, isPM = false) {
  const reply = (text) => {
    if (isPM) {
      ws.send(`|/msg ${user}, ${text}`);
    } else {
      ws.send(`${target}|${text}`);
    }
  };

  const cleaned = message.trim().replace(/^\[+/, '[');

  // Only respond to auth or Cryoxetic
  const rank = user.charAt(0);
  const username = AUTH_RANKS.includes(rank) ? user.slice(1) : user;
  const isCryoxetic = username.toLowerCase() === CRYOXETIC_NAME.toLowerCase();
  if (!AUTH_RANKS.includes(rank) && !isCryoxetic) return;

  if (cleaned.startsWith('[quote add ')) {
    const quote = cleaned.slice(11).trim();
    if (quote.length > 0) {
      quotes.push(quote);
      reply(`Quote #${quotes.length} added.`);
    } else {
      reply('Please provide a quote to add.');
    }
    return;
  }

  if (cleaned === '[quotelist') {
    if (quotes.length === 0) {
      reply('No quotes stored yet.');
    } else {
      const list = quotes.map((q, i) => `${i + 1}. ${q}`).join('\n');
      reply(list);
    }
    return;
  }

  if (cleaned.startsWith('[quote remove ')) {
    const index = parseInt(cleaned.slice(14).trim());
    if (!isNaN(index) && index >= 1 && index <= quotes.length) {
      const removed = quotes.splice(index - 1, 1);
      reply(`Removed quote #${index}: "${removed[0]}"`);
    } else {
      reply('Invalid quote number.');
    }
    return;
  }

  if (cleaned.startsWith('[quote ')) {
    const index = parseInt(cleaned.slice(7).trim());
    if (!isNaN(index) && index >= 1 && index <= quotes.length) {
      reply(`Quote #${index}: "${quotes[index - 1]}"`);
    } else {
      reply('Invalid quote number.');
    }
    return;
  }

  if (cleaned.startsWith('[say')) {
    const text = cleaned.slice(4).trim();
    if (text.length > 0) {
      reply(text);
    } else {
      reply('Say what?');
    }
    return;
  }

  switch (cleaned) {
    case '[ping':
      reply('Pong!');
      break;
    case '[hello':
      reply("Hey there, I'm CryoxeticBotX2");
      break;
    case '[celebrate':
      reply('Congratulations!');
      break;
    case '[moo':
      reply('Moo!');
      break;
    case '[mish':
      reply('Mish!');
      break;
    case '[disappointed':
      reply('Tsk. Tsk. Tsk. You should really do better');
      break;
  }
}
