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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function translateText(text, from = 'en', to = 'pt') {
  if (!text || text.trim().length === 0) return text;
  const encoded = encodeURIComponent(text);
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${from}|${to}`;
  const result = await httpGet(url);
  if (result?.responseData?.translatedText) {
    return result.responseData.translatedText;
  }
  return text; // fallback to original
}

async function main() {
  const cards = JSON.parse(fs.readFileSync('./public/json/cards.json', 'utf8'));
  
  // Get all PT cards from API to build a set of existing IDs
  console.log('Fetching PT cards from YGOPRODeck API...');
  const ptResponse = await httpGet('https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt');
  const ptIds = new Set((ptResponse?.data || []).map(c => c.id));
  console.log(`PT API has ${ptIds.size} cards`);

  // Find cards that need translation
  const needTranslation = cards.filter(c => {
    const ygoId = c.externalIDs?.ygoprodeck?.id;
    const enName = c.text?.en?.name || '';
    const enEffect = c.text?.en?.effect || '';
    const isUntranslatedName = c.text?.pt?.name === enName;
    const isUntranslatedEffect = c.text?.pt?.effect === enEffect;
    
    return (isUntranslatedName || isUntranslatedEffect) && (!ygoId || !ptIds.has(ygoId));
  });

  console.log(`Cards needing translation (not in PT API): ${needTranslation.length}`);
  
  // Show sample
  console.log('Sample cards to translate:');
  needTranslation.slice(0, 10).forEach(c => {
    console.log(`  - ${c.text.en.name} (ygoprodeck: ${c.externalIDs?.ygoprodeck?.id || 'none'})`);
  });

  // Translate in batches with delays
  let translated = 0;
  let skipped = 0;
  const batchSize = 5;
  const delayMs = 2000;

  for (let i = 0; i < needTranslation.length; i += batchSize) {
    const batch = needTranslation.slice(i, i + batchSize);
    
    for (const card of batch) {
      const enName = card.text.en.name;
      const enEffect = card.text.en.effect;
      
      // Translate name if needed
      if (card.text.pt.name === enName) {
        card.text.pt.name = await translateText(enName);
      }
      
      // Translate effect if needed
      if (card.text.pt.effect === enEffect) {
        card.text.pt.effect = await translateText(enEffect);
      }
      
      translated++;
    }

    console.log(`Processed ${Math.min(i + batchSize, needTranslation.length)}/${needTranslation.length}...`);
    
    if (i + batchSize < needTranslation.length) {
      console.log(`Waiting ${delayMs/1000}s before next batch...`);
      await sleep(delayMs);
    }
  }

  console.log(`\nTranslated ${translated} cards`);
  console.log('Writing updated cards.json...');
  fs.writeFileSync('./public/json/cards.json', JSON.stringify(cards, null, 2));
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
