import type { Config, Mode } from "./core.ts";

/** Narrow a direct command to one mode without executing any desktop actions. */
export function selectModes(config: Config, kind: string, modeId?: string): Mode[] {
  const modes = config.modes;
  if (!modeId) return modes;
  const mode = modes.find(candidate => candidate.id === modeId);
  if (!mode) throw new Error(`Unknown mode: ${modeId}`);
  if (kind === "focus" && mode.minutes === 0) throw new Error("Default has no focus session");
  return [mode];
}
