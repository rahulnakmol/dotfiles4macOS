import { requirePreset, type Config, type Mode } from "./core.ts";
export const desktopRoles = [
  { number: 1, name: "Home", description: "Finder, Session and everyday apps" },
  { number: 2, name: "Connect", description: "Browser and chat" },
  { number: 3, name: "Create", description: "AI, coding and creative tools" },
  { number: 4, name: "Focus", description: "Terminal, notes and focused work" },
] as const;
export type Space = { id: string; active: boolean; screenId: string; type: string };
export function unassignedDesktops(config: Config, mode: Mode): number[] {
  return [...new Set(mode.placements.map(p => p.desktop))]
    .filter(role => !config.desktopIds[String(role)]).sort((a,b) => a-b);
}
export function currentSpace(spaces: Space[], activeWindowDesktopId?: string): Space {
  const visible = spaces.filter(s => s.type === "User" && s.active);
  if (visible.length === 1) return visible[0];
  const focused = visible.find(s => s.id === activeWindowDesktopId);
  if (focused) return focused;
  throw new Error("Open a normal app window on the Space you want to assign, then reopen Raycast and retry. For first-time setup, one connected display is easiest.");
}
export function modeNeeds(config: Config, mode: Mode, installed: Set<string>, spaces: Space[], presets: string): string[] {
  const missing: string[] = [];
  for (const p of mode.placements) {
    const app = config.apps.find(a => a.id === p.app)!;
    if (!installed.has(app.bundleId)) missing.push(`Install ${app.name}`);
  }
  for (const role of new Set(mode.placements.map(p => p.desktop))) {
    if (!spaces.some(s => s.type === "User" && s.id === config.desktopIds[String(role)])) missing.push(`Assign Desktop ${role}`);
  }
  try { requirePreset(mode.dock, presets); } catch { missing.push(`Add one DockFlow preset named “${mode.dock}”`); }
  return missing;
}
