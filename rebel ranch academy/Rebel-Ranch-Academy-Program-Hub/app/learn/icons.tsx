// Line icons for the learner area (24px grid, stroke = currentColor).
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
type P = { size?: number };
const base = (size = 24) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const LibraryIcon = ({ size }: P) => <svg {...base(size)}><path d="M4 4h3v16H4zM9 4h3v16H9z"/><path d="M14.5 4.8l2.9-.8 3.6 15.4-2.9.8z"/></svg>;
export const HomeIcon = ({ size }: P) => <svg {...base(size)}><path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/></svg>;
export const ArrowIcon = ({ size }: P) => <svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
export const CloseIcon = ({ size }: P) => <svg {...base(size)}><path d="M6 6l12 12M18 6L6 18"/></svg>;
export const MenuIcon = ({ size }: P) => <svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
export const CheckIcon = ({ size }: P) => <svg {...base(size)}><path d="M5 12.5l4.5 4.5L19 7"/></svg>;
export const AllIcon = ({ size }: P) => <svg {...base(size)}><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>;

// One icon per learning area (ids match academy_learning_areas / app/lib/academy-content.ts).
export function AreaIcon({ id, size }: { id: string; size?: number }) {
  switch (id) {
    case "personal-strength": return <svg {...base(size)}><path d="M3 19l6-10 4 6 3-4 5 8z"/><circle cx="16.5" cy="6" r="1.8"/></svg>;
    case "communication": return <svg {...base(size)}><path d="M4 5h11v8H9l-3.5 3V13H4z"/><path d="M17 9h3v7h-1.5v2.5L16 16h-4"/></svg>;
    case "business": return <svg {...base(size)}><rect x="3.5" y="7.5" width="17" height="11" rx="2"/><path d="M9 7.5V5.5h6v2M3.5 12.5h17"/></svg>;
    case "money": return <svg {...base(size)}><circle cx="12" cy="12" r="8"/><path d="M14.5 9.3c-.5-.8-1.4-1.3-2.5-1.3-1.5 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.5-2.6-1.3M12 6.5V8M12 16v1.5"/></svg>;
    case "sustainability": return <svg {...base(size)}><path d="M12 20v-7"/><path d="M12 13c0-4 3-7 7.5-7 0 4.5-3 7-7.5 7z"/><path d="M12 15.5c0-3-2.3-5.5-6.5-5.5 0 3.5 2.3 5.5 6.5 5.5z"/></svg>;
    case "family": return <svg {...base(size)}><circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5M11.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5"/></svg>;
    default: return <AllIcon size={size} />;
  }
}
