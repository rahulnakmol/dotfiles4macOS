import { lock } from "proper-lockfile";
import { join } from "node:path";

/** Cross-command exclusion with crash recovery; the heartbeat exists only during a switch. */
export async function withModeLock<T>(supportPath:string,action:()=>Promise<T>):Promise<T> {
  let release:()=>Promise<void>;
  try {
    release=await lock(supportPath,{
      lockfilePath:join(supportPath,"mode-switch.lock"),
      stale:60000,update:10000,retries:0,
    });
  } catch(error) {
    if(error instanceof Error&&"code" in error&&error.code==="ELOCKED") {
      throw new Error("A mode switch is still active. Wait for it to finish. After an interrupted run, retry in 60 seconds; recovery is automatic.");
    }
    throw error;
  }
  try {return await action();} finally {await release();}
}
