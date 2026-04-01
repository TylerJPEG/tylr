import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { LifeItem } from "../domain/models.js";
import type { LifeRepository } from "../core/life-repository.js";

interface PersistedState {
  items: LifeItem[];
}

function createEmptyState(): PersistedState {
  return { items: [] };
}

export class JsonFileLifeRepository implements LifeRepository {
  constructor(private readonly filePath: string) {}

  async list(): Promise<LifeItem[]> {
    const state = await this.readState();
    return state.items;
  }

  async getById(id: string): Promise<LifeItem | null> {
    const state = await this.readState();
    return state.items.find((item) => item.id === id) ?? null;
  }

  async save(item: LifeItem): Promise<void> {
    const state = await this.readState();
    const index = state.items.findIndex((existing) => existing.id === item.id);

    if (index === -1) {
      state.items.push(item);
    } else {
      state.items[index] = item;
    }

    await this.writeState(state);
  }

  async delete(id: string): Promise<void> {
    const state = await this.readState();
    const next = state.items.filter((item) => item.id !== id);
    await this.writeState({ items: next });
  }

  private async readState(): Promise<PersistedState> {
    try {
      const content = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(content) as PersistedState;
      return {
        items: [...(parsed.items ?? [])],
      };
    } catch (error) {
      if (this.isMissingFile(error)) {
        return createEmptyState();
      }

      throw error;
    }
  }

  private async writeState(state: PersistedState): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  }

  private isMissingFile(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
