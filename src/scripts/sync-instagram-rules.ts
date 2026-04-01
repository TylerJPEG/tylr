import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { InstagramCaptionStudio } from "../core/instagram-caption-studio.js";
import type { VoiceRule } from "../domain/instagram.js";
import { JsonFileInstagramRepository } from "../infrastructure/json-file-instagram-repository.js";

type ManualRuleInput = Omit<VoiceRule, "id" | "createdAt" | "updatedAt" | "source">;

async function main(): Promise<void> {
  const rulesPath = resolve(process.cwd(), "data/instagram-manual-rules.json");
  const workspacePath = resolve(process.cwd(), "data/instagram-workspace.json");
  const repository = new JsonFileInstagramRepository(workspacePath);
  const studio = new InstagramCaptionStudio(repository);
  const content = await readFile(rulesPath, "utf8");
  const rules = JSON.parse(content) as ManualRuleInput[];

  for (const rule of rules) {
    await studio.addRule(rule);
  }

  const workspace = await studio.getWorkspace();
  console.log(
    JSON.stringify(
      {
        totalRules: workspace.rules.length,
        manualRules: workspace.rules.filter((rule) => rule.source === "manual").length,
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
