export const validCollections = ['rrm', 'creation-station', 'working-hands', 'marketplace', 'academy'];
export const validTypes = ['apparel', 'hats', 'drinkware', 'bags', 'accessories'];

const normalizedProductText = (product) => [product.title, product.category]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

export const detectCollection = (product) => {
  const text = normalizedProductText(product);
  const workingHandsPhrases = [
    'roots, boots', 'animal poops', 'working hands', 'real people. real work',
    'ranch raised', 'dirt under our nails', 'purpose in our work', 'built by faith',
    'work hard', 'stay humble', 'faith, grit', 'barn raised', 'country roots'
  ];
  if (workingHandsPhrases.some((phrase) => text.includes(phrase))) return 'working-hands';
  if (text.includes('creation station') || text.includes('create. learn. build. grow') || text.includes('passion to possibility')) return 'creation-station';
  const marketplacePhrases = ['marketplace', 'digital farmers market', 'buy local', 'shop local', 'local makers'];
  if (marketplacePhrases.some((phrase) => text.includes(phrase))) return 'marketplace';
  const academyPhrases = ['rebel ranch academy', 'real skills for real life', 'rra academy', 'academy'];
  if (academyPhrases.some((phrase) => text.includes(phrase))) return 'academy';
  return 'rrm';
};

export const detectType = (product) => {
  const text = normalizedProductText(product);
  if (/\b(hat|cap|snapback|trucker|beanie)\b/.test(text)) return 'hats';
  if (/\b(mug|cup|tumbler|bottle|drinkware|can cooler)\b/.test(text)) return 'drinkware';
  if (/\b(bag|tote|backpack|duffel|pouch|sack)\b/.test(text)) return 'bags';
  if (/\b(shirt|tee|tank|hoodie|sweatshirt|sweater|jersey|sleeve|jacket|shorts|leggings)\b/.test(text)) return 'apparel';
  return 'accessories';
};

export const collectionName = (collection) => ({
  rrm: 'Official RRM',
  'creation-station': 'Creation Station',
  'working-hands': 'Working Hands',
  marketplace: 'Rebel Ranch Marketplace',
  academy: 'Rebel Ranch Academy'
}[collection] || 'Rebel Ranch Merchandise');

export const typeName = (type) => ({
  apparel: 'Apparel',
  hats: 'Hats',
  drinkware: 'Drinkware',
  bags: 'Bags',
  accessories: 'Accessories'
}[type] || 'Accessories');

// Effective collection/type: an owner override always wins over the auto-detected guess.
export const resolveCollection = (product, override) => override?.collection_override || detectCollection(product);
export const resolveType = (product, override) => override?.type_override || detectType(product);
