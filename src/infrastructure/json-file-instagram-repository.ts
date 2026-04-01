import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { InstagramWorkspace } from "../domain/instagram.js";
import type { InstagramRepository } from "../core/instagram-repository.js";

function createEmptyWorkspace(): InstagramWorkspace {
  return {
    posts: [],
    rules: [],
    profile: {
      summary: "Voice profile not seeded yet.",
      toneKeywords: [],
      commonOpeners: [],
      commonClosers: [],
      recurringPhrases: [],
      recurringHashtags: [],
      averageCaptionLength: "medium",
      emojiUsage: "none",
      punctuationStyle: "balanced",
      callToActionStyle: "rare",
      updatedAt: new Date(0).toISOString(),
    },
    direction: {
      positioning: "The t-shirt is the entry point, not the entire subject.",
      purpose: "Use the collection as a way into conversations about music, scenes, records, and why certain bands matter.",
      shirtRole: "Treat the shirt as a vessel or prompt rather than a product.",
      conversationFocus: [],
      preferredMoves: [],
      avoidances: [],
      anchorPosts: [],
      updatedAt: new Date(0).toISOString(),
    },
  };
}

export class JsonFileInstagramRepository implements InstagramRepository {
  constructor(private readonly filePath: string) {}

  async load(): Promise<InstagramWorkspace> {
    try {
      const content = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(content) as Partial<InstagramWorkspace>;
      return {
        posts: [...(parsed.posts ?? [])],
        rules: [...(parsed.rules ?? [])],
        profile: parsed.profile ?? createEmptyWorkspace().profile,
        direction: parsed.direction ?? createEmptyWorkspace().direction,
      };
    } catch (error) {
      if (this.isMissingFile(error)) {
        return createEmptyWorkspace();
      }

      throw error;
    }
  }

  async save(workspace: InstagramWorkspace): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(workspace, null, 2) + "\n", "utf8");
  }

  private isMissingFile(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
