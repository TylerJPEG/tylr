import type { InstagramWorkspace } from "../domain/instagram.js";

export interface InstagramRepository {
  load(): Promise<InstagramWorkspace>;
  save(workspace: InstagramWorkspace): Promise<void>;
}
