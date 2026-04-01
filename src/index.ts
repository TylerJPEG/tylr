import { resolve } from "node:path";

import { InstagramCaptionStudio } from "./core/instagram-caption-studio.js";
import { LifeTracker } from "./core/life-tracker.js";
import { JsonFileInstagramRepository } from "./infrastructure/json-file-instagram-repository.js";
import { JsonFileLifeRepository } from "./infrastructure/json-file-life-repository.js";

async function main(): Promise<void> {
  const repository = new JsonFileLifeRepository(resolve(process.cwd(), "data/life-items.json"));
  const tracker = new LifeTracker(repository);
  const instagramStudio = new InstagramCaptionStudio(
    new JsonFileInstagramRepository(resolve(process.cwd(), "data/instagram-workspace.json")),
  );
  const snapshot = await tracker.getSnapshot();
  const instagramWorkspace = await instagramStudio.getWorkspace();

  console.log("tylr foundation ready");
  console.log(JSON.stringify(snapshot, null, 2));
  console.log(JSON.stringify({
    instagramPosts: instagramWorkspace.posts.length,
    instagramRules: instagramWorkspace.rules.length,
    instagramProfile: instagramWorkspace.profile.summary,
    instagramDirection: instagramWorkspace.direction.positioning,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
