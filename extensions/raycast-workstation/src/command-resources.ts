// Resources live for one command only. New commands always read fresh app/Space state.
export type InstalledApp = { path: string; bundleId?: string };
export type AvailableDesktop = { id: string; type: string; size: { width: number; height: number } };
export type Inventory = { apps: InstalledApp[]; desktops: AvailableDesktop[] };

export function alreadyPlaced(
  window: { desktopId: string; bounds: "fullscreen" | { position: { x: number; y: number }; size: { width: number; height: number } } },
  targetDesktopId: string, rect: { x: number; y: number; width: number; height: number },
): boolean {
  if(window.desktopId!==targetDesktopId||window.bounds==="fullscreen")return false;
  const {position,size}=window.bounds;
  return Math.abs(position.x-rect.x)<=1&&Math.abs(position.y-rect.y)<=1&&Math.abs(size.width-rect.width)<=1&&Math.abs(size.height-rect.height)<=1;
}

export function placementRequest(
  window: { id: string; desktopId: string }, targetDesktopId: string,
  rect: { x: number; y: number; width: number; height: number },
): { id: string; desktopId?: string; bounds: { position: { x: number; y: number }; size: { width: number; height: number } } } {
  return {
    // Raycast can reject an explicit move to the window's existing Space.
    id: window.id, ...(window.desktopId === targetDesktopId ? {} : { desktopId: targetDesktopId }),
    bounds: { position: { x: rect.x, y: rect.y }, size: { width: rect.width, height: rect.height } },
  };
}

export async function retryWindowLookup<T>(
  operation: () => Promise<T>, wait: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
): Promise<T> {
  for (let attempt=0;;attempt++) {
    try { return await operation(); }
    catch(error) {
      if (!(error instanceof Error) || error.message !== "Cannot get window" || attempt>=2) throw error;
      await wait(200);
    }
  }
}

export async function ensurePlacement<T>(
  read: () => Promise<T>, apply: (value:T) => Promise<void>, matches: (value:T) => boolean, message:string,
  options: { attempts?:number; intervalMs?:number; wait?:(ms:number)=>Promise<void> } = {},
): Promise<T> {
  for(let attempt=0;attempt<3;attempt++) {
    const current=await read();
    if(matches(current))return current;
    await apply(current);
    try { return await waitForState(read,matches,message,{attempts:10,...options}); }
    catch(error) { if(attempt===2)throw error; }
  }
  throw new Error(message);
}

export async function readInventory(readers: {
  apps(): Promise<InstalledApp[]>;
  desktops(): Promise<AvailableDesktop[]>;
}): Promise<Inventory> {
  const [apps, desktops] = await Promise.all([readers.apps(), readers.desktops()]);
  return { apps, desktops };
}

// Check immediately; wait only between unsuccessful reads. No startup delay.
export async function waitForState<T>(
  read: () => Promise<T>, matches: (value: T) => boolean, message: string,
  options: { attempts?: number; intervalMs?: number; wait?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  const { attempts = 30, intervalMs = 200, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = options;
  if (!Number.isInteger(attempts) || attempts < 1 || intervalMs < 0) throw new Error("Invalid polling budget");
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const value = await read();
      if (matches(value)) return value;
    } catch { /* A window can be temporarily unavailable during launch or a Space transition. */ }
    if (attempt + 1 < attempts) await wait(intervalMs);
  }
  throw new Error(message);
}

export type WindowGeometry = {
  desktopId: string;
  bounds: "fullscreen" | { position: { x:number; y:number }; size: { width:number; height:number } };
};
export type WindowRect = { x:number; y:number; width:number; height:number };

/** Detect a right third constrained by an application's minimum width after a resize. */
export function constrainedRightThird(window:WindowGeometry,target:string,rect:WindowRect):WindowRect|undefined {
  if(window.desktopId!==target||window.bounds==="fullscreen")return undefined;
  const {position,size}=window.bounds;
  const edge=rect.x+rect.width;
  if(size.width<=rect.width+40||size.width>edge/2||
    Math.abs(position.x+size.width-edge)>2||Math.abs(position.y-rect.y)>40||
    Math.abs(size.height-rect.height)>100)return undefined;
  return {x:edge-size.width,y:rect.y,width:size.width,height:rect.height};
}
