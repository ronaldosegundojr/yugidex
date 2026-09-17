import fs from 'fs';
import path from 'path';

const translationsDir = './scripts/translations';
const cardsPath = './public/json/cards.json';

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

const dict = {};
const effectMap = {};
for (const file of fs.readdirSync(translationsDir).sort()) {
  const parsed = loadJson(path.join(translationsDir, file));
  if (file === 'e-tokens.json') {
    Object.assign(effectMap, parsed);
    continue;
  }
  Object.assign(dict, parsed);
}

const cards = loadJson(cardsPath);
const store = loadJson('./scripts/pt-dictionary.json');
Object.assign(store, dict);
fs.writeFileSync('./scripts/pt-dictionary.json', JSON.stringify(store, null, 2));

let appliedName = 0;
let appliedEffect = 0;
let skipped = 0;

for (const card of cards) {
  const enName = card.text?.en?.name;
  if (!dict[enName]) continue;

  const entry = dict[enName];
  const pt = card.text.pt || (card.text.pt = {});
  const enEffect = card.text.en.effect || '';
  const curEffect = pt.effect === undefined ? enEffect : pt.effect;

  if (pt.name === enName && entry.name && entry.name !== enName) {
    pt.name = entry.name;
    appliedName++;
  }
  if (curEffect === enEffect && entry.effect) {
    pt.effect = entry.effect;
    appliedEffect++;
  }
  if (curEffect === enEffect && effectMap[enEffect]) {
    pt.effect = effectMap[enEffect];
    appliedEffect++;
  }
  if (pt.name === enName && !entry.name) skipped++;
}

fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log(`Applied ${appliedName} names, ${appliedEffect} effects. Skipped (name only, no entry): ${skipped}.`);