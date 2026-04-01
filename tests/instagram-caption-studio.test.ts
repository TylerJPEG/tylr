import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { InstagramCaptionStudio } from "../src/core/instagram-caption-studio.js";
import { JsonFileInstagramRepository } from "../src/infrastructure/json-file-instagram-repository.js";

async function createStudio() {
  const directory = await mkdtemp(join(tmpdir(), "tylr-ig-"));
  const repository = new JsonFileInstagramRepository(join(directory, "instagram-workspace.json"));

  return new InstagramCaptionStudio(repository);
}

describe("InstagramCaptionStudio", () => {
  test("seeds past posts and infers a reusable voice profile", async () => {
    const studio = await createStudio();

    const workspace = await studio.seedPosts([
      {
        postedAt: "2025-01-01T10:00:00.000Z",
        caption: "Lately I've been keeping things simple and honest. Just following what feels true.",
        tags: ["personal"],
        themes: ["honesty"],
      },
      {
        postedAt: "2025-01-05T10:00:00.000Z",
        caption: "Still thinking about the small moments that end up meaning the most. #slowliving",
        tags: ["personal"],
        themes: ["reflection"],
      },
    ]);

    expect(workspace.posts).toHaveLength(2);
    expect(workspace.profile.summary).toContain("Seeded from 2 posts");
    expect(workspace.rules.length).toBeGreaterThan(0);
  });

  test("lets manual rules accumulate on top of seed analysis", async () => {
    const studio = await createStudio();

    await studio.seedPosts([
      {
        postedAt: "2025-01-01T10:00:00.000Z",
        caption: "Just keeping it clear and direct.",
        tags: [],
        themes: [],
      },
    ]);

    const rule = await studio.addRule({
      category: "avoidance",
      instruction: "Avoid slang that feels too internet-native.",
      rationale: "The voice should stay natural, not trendy.",
      priority: 95,
    });

    const workspace = await studio.getWorkspace();

    expect(rule.source).toBe("manual");
    expect(workspace.rules.some((entry) => entry.instruction.includes("Avoid slang"))).toBe(true);
  });

  test("generates caption ideas from direction while applying rules and profile context", async () => {
    const studio = await createStudio();

    await studio.seedPosts([
      {
        postedAt: "2025-01-01T10:00:00.000Z",
        caption: "Lately I've been drawn to quiet images and clear words.",
        tags: ["creative"],
        themes: ["clarity"],
      },
    ]);

    await studio.setDirection({
      positioning: "Archive page, not a store.",
      purpose: "Use the shirt to get into the music.",
      shirtRole: "The shirt is the prompt, not the point.",
      conversationFocus: ["what makes the music worth revisiting"],
      preferredMoves: ["lead with the musical idea"],
      avoidances: ["avoid sales language"],
      anchorPosts: ["further", "Archers of Loaf"],
    });

    await studio.addRule({
      category: "tone",
      instruction: "Sound grounded and self-possessed.",
      priority: 90,
    });

    const result = await studio.generateCaptions({
      prompt: "sharing a set of photos from a slow Sunday in the city",
      context: "The photos feel observant and understated.",
      themes: ["city", "weekend"],
      desiredCount: 3,
      avoidedPhrases: ["salesy"],
    });

    expect(result.ideas).toHaveLength(3);
    expect(result.ideas[0]?.caption).toContain("sharing a set of photos");
    expect(result.ideas.some((idea) => idea.caption.includes("what it opens up about"))).toBe(true);
    expect(result.activeRules[0]?.priority).toBeGreaterThanOrEqual(result.activeRules[1]?.priority ?? 0);
  });

  test("re-seeding the same archive refreshes posts instead of duplicating them", async () => {
    const studio = await createStudio();

    const posts = [
      {
        id: "seed-1",
        postedAt: "2025-01-01T10:00:00.000Z",
        caption: "First seeded post.",
        tags: [],
        themes: [],
      },
      {
        id: "seed-2",
        postedAt: "2025-01-02T10:00:00.000Z",
        caption: "Second seeded post.",
        tags: [],
        themes: [],
      },
    ];

    await studio.seedPosts([...posts]);
    const workspace = await studio.seedPosts([...posts]);

    expect(workspace.posts).toHaveLength(2);
  });
});
