import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

import { InstagramCaptionStudio } from "../core/instagram-caption-studio.js";
import type { CaptionDirectionInput } from "../domain/instagram.js";
import { JsonFileInstagramRepository } from "../infrastructure/json-file-instagram-repository.js";

async function resolveBriefPath(): Promise<string> {
  const preferredPath = resolve(process.cwd(), "data/instagram-brief.json");

  try {
    await access(preferredPath, constants.F_OK);
    return preferredPath;
  } catch {
    return resolve(process.cwd(), "data/instagram-brief.example.json");
  }
}

async function main(): Promise<void> {
  const briefPath = await resolveBriefPath();
  const workspacePath = resolve(process.cwd(), "data/instagram-workspace.json");
  const repository = new JsonFileInstagramRepository(workspacePath);
  const studio = new InstagramCaptionStudio(repository);
  const content = await readFile(briefPath, "utf8");
  const brief = JSON.parse(content) as CaptionDirectionInput;
  const result = await studio.generateCaptions(brief);

  console.log(
    JSON.stringify(
      {
        briefPath,
        generatedAt: result.generatedAt,
        appliedRules: result.activeRules.slice(0, 6).map((rule) => rule.instruction),
        ideas: result.ideas,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
