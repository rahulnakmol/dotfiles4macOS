import { applyDock } from "./runtime";
import { showToast, Toast } from "@raycast/api";
export default async function Command(): Promise<void> {
  try { await applyDock("6. Video"); } catch (error) { await showToast({style:Toast.Style.Failure,title:"DockFlow stopped",message:String(error)}); }
}
