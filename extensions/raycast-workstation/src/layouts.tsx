import { WorkmodeMenu } from "./menu";
import type { ReactElement } from "react";

// Raycast requires a default export for command entry points.
export default function Command(): ReactElement {
  return <WorkmodeMenu kind="layouts" />;
}
