import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { InstagramCaptionStudio } from "../core/instagram-caption-studio.js";
import type { InstagramPost } from "../domain/instagram.js";
import { JsonFileInstagramRepository } from "../infrastructure/json-file-instagram-repository.js";

interface SeedPost extends Omit<InstagramPost, "id"> {
  id?: string;
}

function createStableId(post: SeedPost): string {
  return createHash("sha256")
    .update(post.postedAt)
    .update("\n")
    .update(post.caption.trim())
    .digest("hex")
    .slice(0, 16);
}

async function main(): Promise<void> {
  const seedPath = resolve(process.cwd(), "data/instagram-posts.seed.json");
  const workspacePath = resolve(process.cwd(), "data/instagram-workspace.json");
  const repository = new JsonFileInstagramRepository(workspacePath);
  const studio = new InstagramCaptionStudio(repository);
  const content = await readFile(seedPath, "utf8");
  const posts = (JSON.parse(content) as SeedPost[]).map((post) => ({
    ...post,
    id: post.id ?? createStableId(post),
  }));
  const workspace = await studio.seedPosts(posts);

  console.log(
    JSON.stringify(
      {
        seededPosts: workspace.posts.length,
        inferredRules: workspace.rules.filter((rule) => rule.source === "seed-analysis").length,
        profile: workspace.profile,
        direction: workspace.direction,
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
