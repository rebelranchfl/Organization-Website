// Store collections and product types.
// Since 2026-09-24 collections are owner-managed in the Store Manager (table
// merch_collection_settings: name, card text, logo, auto-sort title words, order, shown/retired).
// buildCatalog(rows) turns those rows into the helpers the store and Store Manager use.
// BUILT_IN_COLLECTIONS mirrors the original five and is used only if the table can't be loaded.

export const validTypes = ['apparel', 'hats', 'drinkware', 'bags', 'accessories'];

export const BUILT_IN_COLLECTIONS = [
  { collection: 'rrm', name: 'Official RRM', display_order: 1, match_priority: 1000, is_default: true, match_keywords: [] },
  { collection: 'creation-station', name: 'Creation Station', display_order: 2, match_priority: 20, match_keywords: ['creation station', 'create. learn. build. grow', 'passion to possibility'] },
  { collection: 'working-hands', name: 'Roots, Boots & Animal Poops', display_order: 3, match_priority: 10, match_keywords: [
    'roots, boots', 'animal poops', 'working hands', 'real people. real work',
    'ranch raised', 'dirt under our nails', 'purpose in our work', 'built by faith',
    'work hard', 'stay humble', 'faith, grit', 'barn raised', 'country roots'] },
  { collection: 'marketplace', name: 'Rebel Ranch Marketplace', display_order: 4, match_priority: 30, match_keywords: ['marketplace', 'digital farmers market', 'buy local', 'shop local', 'local makers'] },
  { collection: 'academy', name: 'Rebel Ranch Academy', display_order: 5, match_priority: 40, match_keywords: ['rebel ranch academy', 'real skills for real life', 'rra academy', 'academy'] },
];

const normalizedProductText = (product) => [product.title, product.category]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

export const detectType = (product) => {
  const text = normalizedProductText(product);
  if (/\b(hat|cap|snapback|trucker|beanie)\b/.test(text)) return 'hats';
  if (/\b(mug|cup|tumbler|bottle|drinkware|can cooler)\b/.test(text)) return 'drinkware';
  if (/\b(bag|tote|backpack|duffel|pouch|sack)\b/.test(text)) return 'bags';
  if (/\b(shirt|tee|tank|hoodie|sweatshirt|sweater|jersey|sleeve|jacket|shorts|leggings)\b/.test(text)) return 'apparel';
  return 'accessories';
};

export const typeName = (type) => ({
  apparel: 'Apparel',
  hats: 'Hats',
  drinkware: 'Drinkware',
  bags: 'Bags',
  accessories: 'Accessories'
}[type] || 'Accessories');

export const resolveType = (product, override) => override?.type_override || detectType(product);

/**
 * rows: merch_collection_settings rows (or BUILT_IN_COLLECTIONS).
 * Auto-sorting checks collections by match_priority (lowest first) and uses the first one whose
 * title words appear in the product title; otherwise the default collection. Retired collections
 * never auto-collect products.
 */
export function buildCatalog(rows) {
  const list = [...(rows && rows.length ? rows : BUILT_IN_COLLECTIONS)]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.collection.localeCompare(b.collection));
  const byKey = new Map(list.map((c) => [c.collection, c]));
  const fallback = list.find((c) => c.is_default) || list[0];
  const matchers = list
    .filter((c) => !c.archived && Array.isArray(c.match_keywords) && c.match_keywords.length)
    .sort((a, b) => (a.match_priority ?? 5) - (b.match_priority ?? 5));

  const detectCollection = (product) => {
    const text = normalizedProductText(product);
    const hit = matchers.find((c) => c.match_keywords.some((word) => word && text.includes(String(word).toLowerCase())));
    return (hit || fallback).collection;
  };
  // An owner override always wins over the auto-detected guess, as long as that collection still
  // exists and isn't retired (a retired collection's products fall back to automatic sorting).
  const resolveCollection = (product, override) => {
    const chosen = override?.collection_override && byKey.get(override.collection_override);
    return chosen && !chosen.archived ? chosen.collection : detectCollection(product);
  };
  const collectionName = (key) => byKey.get(key)?.name || 'Rebel Ranch Merchandise';

  return { list, byKey, keys: list.map((c) => c.collection), detectCollection, resolveCollection, collectionName };
}

// Backward-compatible exports (built-in five) for any page not yet reading the table.
const builtIn = buildCatalog(BUILT_IN_COLLECTIONS);
export const validCollections = builtIn.keys;
export const detectCollection = builtIn.detectCollection;
export const collectionName = builtIn.collectionName;
export const resolveCollection = builtIn.resolveCollection;
