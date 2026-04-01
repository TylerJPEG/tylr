import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { LifeTracker } from "../src/core/life-tracker.js";
import { JsonFileLifeRepository } from "../src/infrastructure/json-file-life-repository.js";

async function createTracker() {
  const directory = await mkdtemp(join(tmpdir(), "tylr-"));
  const filePath = join(directory, "life-items.json");
  const repository = new JsonFileLifeRepository(filePath);

  return {
    filePath,
    tracker: new LifeTracker(repository),
  };
}

describe("LifeTracker", () => {
  test("creates and lists life items", async () => {
    const { tracker } = await createTracker();

    const item = await tracker.createItem({
      kind: "task",
      title: "Review monthly budget",
      area: "finance",
      tags: ["money", "admin", "money"],
    });

    const items = await tracker.listItems({ kind: "task" });

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(item.id);
    expect(items[0]?.tags).toEqual(["admin", "money"]);
    expect(items[0]?.status).toBe("active");
  });

  test("marks items completed and updates snapshot counts", async () => {
    const { tracker } = await createTracker();

    const item = await tracker.createItem({
      kind: "habit",
      title: "Stretch",
      tags: ["health"],
    });

    await tracker.completeItem(item.id);
    const snapshot = await tracker.getSnapshot();
    const [completed] = await tracker.listItems({ status: "completed" });

    expect(snapshot.total).toBe(1);
    expect(snapshot.byKind.habit).toBe(1);
    expect(snapshot.byStatus.completed).toBe(1);
    expect(completed?.completedAt).toBeTruthy();
  });

  test("persists items to disk through the JSON repository", async () => {
    const { tracker, filePath } = await createTracker();

    await tracker.createItem({
      kind: "note",
      title: "Weekend ideas",
      details: "Hike and reading",
    });

    const persisted = JSON.parse(await readFile(filePath, "utf8")) as { items: Array<{ title: string }> };
    expect(persisted.items[0]?.title).toBe("Weekend ideas");
  });
});
