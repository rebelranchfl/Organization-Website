# Planned change: Rebel Ranch Local small-town map integration

## Authorized scope

Integrate the owner-approved interactive **Small Town, USA — One town at a time** map concept into the authenticated Rebel Ranch Local seller dashboard hero.

## Files planned for modification

- `marketplace-seller-dashboard.html` — add the linked North Florida map and small-town location marker inside the existing approved hero; preserve the current hero statement, description, calls to action, manifesto copy, navigation, and dashboard functions.
- `assets/css/marketplace-seller.css` — lay out and animate the map, marker, steady light growth, and responsive/reduced-motion states using the dashboard's current dark-green, maroon, cream, and acid-green system.
- `assets/js/marketplace-seller-app.js` — start the map reveal when the seller workspace opens and replay it when the existing **Put Me on the Map** button is selected, while preserving that button's existing route to My Listings.

## New linked assets

- `assets/brand/Rebel Ranch Local/interface/rrl-north-florida-map.webp`
- `assets/brand/Rebel Ranch Local/interface/rrl-small-town-pin.webp`

No base64 images will be placed in HTML or CSS. No data, authentication, Supabase, Marketplace approval, pricing, listing, order, notification, account, navigation, or deployment behavior is included in this change.

AI-Agent: ChatGPT/Codex
Session: Rebel Ranch Local Interactive Dashboard Integration
