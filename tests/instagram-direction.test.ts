import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { InstagramCaptionStudio } from "../src/core/instagram-caption-studio.js";
import { JsonFileInstagramRepository } from "../src/infrastructure/json-file-instagram-repository.js";

async function createStudio() {
  const directory = await mkdtemp(join(tmpdir(), "tylr-ig-direction-"));
  const repository = new JsonFileInstagramRepository(join(directory, "instagram-workspace.json"));

  return new InstagramCaptionStudio(repository);
}

describe("Instagram direction", () => {
  test("stores forward-looking positioning separately from seeded voice", async () => {
    const studio = await createStudio();

    const workspace = await studio.setDirection({
      positioning: "Archive page, not a store.",
      purpose: "Use the shirt to talk about the music.",
      shirtRole: "Entry point only.",
      conversationFocus: ["records", "scenes"],
      preferredMoves: ["lead with the music"],
      avoidances: ["avoid sales language"],
      anchorPosts: ["Archers of Loaf"],
    });

    expect(workspace.direction.positioning).toContain("not a store");
    expect(workspace.direction.anchorPosts).toEqual(["Archers of Loaf"]);
  });
});
