import fs from 'fs';
import https from 'https';

async function fetchPTCards() {
  console.log('Fetching PT cards from YGOPRODeck API...');
  
  return new Promise((resolve, reject) => {
    let data = '';
    https.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt', (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        resolve(parsed.data);
      });
    }).on('error', reject);
  });
}

async function main() {
  const ptCards = await fetchPTCards();
  console.log(`Fetched ${ptCards.length} PT cards from API`);

  // Build map: ygoprodeck id -> pt translation
  const ptMap = new Map();
  for (const card of ptCards) {
    ptMap.set(card.id, {
      name: card.name,
      effect: card.desc?.trim() || card.name
    });
  }

  // Load local cards
  const localCards = JSON.parse(fs.readFileSync('./public/json/cards.json', 'utf8'));
  console.log(`Loaded ${localCards.length} local cards`);

  let updated = 0;
  let alreadyTranslated = 0;
  let notFound = 0;

  for (const card of localCards) {
    const ygoId = card.externalIDs?.ygoprodeck?.id;
    if (!ygoId || !ptMap.has(ygoId)) {
      notFound++;
      continue;
    }

    const pt = ptMap.get(ygoId);
    const enName = card.text?.en?.name || '';
    const enEffect = card.text?.en?.effect || '';

    const wasUntranslatedName = card.text?.pt?.name === enName;
    const wasUntranslatedEffect = card.text?.pt?.effect === enEffect;

    // Only update if currently untranslated (name matches English)
    if (wasUntranslatedName) {
      card.text.pt.name = pt.name;
      updated++;
    }

    if (wasUntranslatedEffect) {
      card.text.pt.effect = pt.effect;
      updated++;
    }

    if (!wasUntranslatedName && !wasUntranslatedEffect) {
      alreadyTranslated++;
    }
  }

  console.log(`Updated ${updated} fields across cards`);
  console.log(`Already translated: ${alreadyTranslated}`);
  console.log(`No PT match found: ${notFound}`);

  // Write updated JSON
  console.log('Writing updated cards.json...');
  fs.writeFileSync('./public/json/cards.json', JSON.stringify(localCards, null, 2));
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
