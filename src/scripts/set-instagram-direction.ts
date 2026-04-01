import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { InstagramCaptionStudio } from "../core/instagram-caption-studio.js";
import type { InstagramDirection } from "../domain/instagram.js";
import { JsonFileInstagramRepository } from "../infrastructure/json-file-instagram-repository.js";

async function main(): Promise<void> {
  const directionPath = resolve(process.cwd(), "data/instagram-direction.json");
  const workspacePath = resolve(process.cwd(), "data/instagram-workspace.json");
  const repository = new JsonFileInstagramRepository(workspacePath);
  const studio = new InstagramCaptionStudio(repository);
  const content = await readFile(directionPath, "utf8");
  const direction = JSON.parse(content) as Omit<InstagramDirection, "updatedAt">;
  const workspace = await studio.setDirection(direction);

  console.log(JSON.stringify(workspace.direction, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
