import fs from 'fs';
import https from 'https';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function translateText(text, from = 'en', to = 'pt') {
  if (!text || text.trim().length === 0) return text;
  const encoded = encodeURIComponent(text.substring(0, 400));
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${from}|${to}`;
  const result = await httpGet(url);
  if (result?.responseData?.translatedText) {
    let translated = result.responseData.translatedText;
    if (translated === text) return text;
    return translated;
  }
  return text;
}

async function main() {
  console.log('Step 1: Fetching PT cards from YGOPRODeck API...');
  const ptResponse = await httpGet('https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt');
  const ptData = ptResponse?.data || [];
  const ptMap = new Map();
  for (const card of ptData) {
    ptMap.set(card.id, { name: card.name, effect: card.desc?.trim() || null });
  }
  console.log(`Loaded ${ptMap.size} PT translations from API`);

  const cards = JSON.parse(fs.readFileSync('./public/json/cards.json', 'utf8'));
  console.log(`Total local cards: ${cards.length}`);

  let fromApi = 0;
  const needTranslation = [];

  for (const card of cards) {
    const enName = card.text?.en?.name || '';
    const enEffect = card.text?.en?.effect || '';
    if (!card.text?.pt) continue;

    if (card.text.pt.name === enName) {
      const ygoId = card.externalIDs?.ygoprodeck?.id;
      const ptFromApi = ygoId ? ptMap.get(ygoId) : null;

      if (ptFromApi) {
        card.text.pt.name = ptFromApi.name;
        fromApi++;
        if (card.text.pt.effect === enEffect && ptFromApi.effect) {
          card.text.pt.effect = ptFromApi.effect;
        }
      } else {
        needTranslation.push(card);
      }
    }
  }

  console.log(`Updated ${fromApi} cards from API`);
  console.log(`Cards needing translation: ${needTranslation.length}`);

  // Save intermediate progress
  fs.writeFileSync('./public/json/cards.json', JSON.stringify(cards, null, 2));
  console.log('Saved intermediate progress');

  if (needTranslation.length === 0) {
    console.log('All cards translated!');
    return;
  }

  console.log('\nStep 2: Translating remaining cards...');
  let translated = 0;
  let failed = 0;
  const batchSize = 3;
  const delayMs = 1500;

  for (let i = 0; i < needTranslation.length; i += batchSize) {
    const batch = needTranslation.slice(i, i + batchSize);
    const promises = batch.map(async (card) => {
      const enName = card.text.en.name;
      if (enName.length < 2) return;
      try {
        card.text.pt.name = await translateText(enName);
        const enEffect = card.text.en.effect;
        if (enEffect && card.text.pt.effect === enEffect) {
          await sleep(200);
          card.text.pt.effect = await translateText(enEffect);
        }
      } catch(e) {
        failed++;
      }
    });

    await Promise.all(promises);
    translated += batch.length;
    const pct = Math.round((translated / needTranslation.length) * 100);
    console.log(`  ${pct}% (${translated}/${needTranslation.length})`);

    if (i + batchSize < needTranslation.length) {
      await sleep(delayMs);
    }
  }

  console.log(`\nTranslated ${translated} cards (${failed} failed)`);
  console.log('Writing final cards.json...');
  fs.writeFileSync('./public/json/cards.json', JSON.stringify(cards, null, 2));
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
