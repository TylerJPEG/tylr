import { randomUUID } from "node:crypto";

import type {
  CreateLifeItemInput,
  LifeItem,
  LifeItemKind,
  LifeItemQuery,
  LifeSnapshot,
  LifeItemStatus,
  UpdateLifeItemInput,
} from "../domain/models.js";
import { itemKinds, itemStatuses } from "../domain/models.js";
import type { LifeRepository } from "./life-repository.js";

export class LifeTracker {
  constructor(private readonly repository: LifeRepository) {}

  async createItem(input: CreateLifeItemInput): Promise<LifeItem> {
    this.assertNonEmpty(input.title, "title");

    const now = new Date().toISOString();
    const item: LifeItem = {
      id: randomUUID(),
      kind: this.assertAllowedValue(input.kind, itemKinds, "kind"),
      title: input.title.trim(),
      details: input.details?.trim(),
      area: input.area?.trim(),
      tags: this.normalizeTags(input.tags),
      status: "active",
      createdAt: now,
      updatedAt: now,
      scheduledFor: input.scheduledFor,
      metadata: input.metadata ?? {},
    };

    await this.repository.save(item);
    return item;
  }

  async updateItem(id: string, input: UpdateLifeItemInput): Promise<LifeItem> {
    const existing = await this.requireItem(id);
    const nextStatus = input.status
      ? this.assertAllowedValue(input.status, itemStatuses, "status")
      : existing.status;

    const updated: LifeItem = {
      ...existing,
      title: input.title ? this.requireTrimmed(input.title, "title") : existing.title,
      details: input.details === undefined ? existing.details : input.details.trim() || undefined,
      area: input.area === undefined ? existing.area : input.area.trim() || undefined,
      tags: input.tags ? this.normalizeTags(input.tags) : existing.tags,
      status: nextStatus,
      scheduledFor: input.scheduledFor === undefined ? existing.scheduledFor : input.scheduledFor,
      completedAt: this.resolveCompletedAt(existing.completedAt, existing.status, nextStatus),
      metadata: input.metadata === undefined ? existing.metadata : input.metadata,
      updatedAt: new Date().toISOString(),
    };

    await this.repository.save(updated);
    return updated;
  }

  async completeItem(id: string): Promise<LifeItem> {
    return this.updateItem(id, { status: "completed" });
  }

  async archiveItem(id: string): Promise<LifeItem> {
    return this.updateItem(id, { status: "archived" });
  }

  async listItems(query: LifeItemQuery = {}): Promise<LifeItem[]> {
    const items = await this.repository.list();
    return items.filter((item) => {
      if (query.kind && item.kind !== query.kind) return false;
      if (query.status && item.status !== query.status) return false;
      if (query.area && item.area !== query.area) return false;
      if (query.tag && !item.tags.includes(query.tag)) return false;
      return true;
    });
  }

  async getSnapshot(): Promise<LifeSnapshot> {
    const items = await this.repository.list();
    const byKind = Object.fromEntries(itemKinds.map((kind) => [kind, 0])) as Record<LifeItemKind, number>;
    const byStatus = Object.fromEntries(
      itemStatuses.map((status) => [status, 0]),
    ) as Record<LifeItemStatus, number>;

    for (const item of items) {
      byKind[item.kind] += 1;
      byStatus[item.status] += 1;
    }

    return {
      total: items.length,
      byKind,
      byStatus,
    };
  }

  async removeItem(id: string): Promise<void> {
    await this.requireItem(id);
    await this.repository.delete(id);
  }

  private async requireItem(id: string): Promise<LifeItem> {
    const item = await this.repository.getById(id);

    if (!item) {
      throw new Error(`Item "${id}" was not found.`);
    }

    return item;
  }

  private resolveCompletedAt(
    existingCompletedAt: string | undefined,
    previousStatus: LifeItemStatus,
    nextStatus: LifeItemStatus,
  ): string | undefined {
    if (nextStatus === "completed") {
      return previousStatus === "completed" ? existingCompletedAt : new Date().toISOString();
    }

    return undefined;
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags) {
      return [];
    }

    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].sort();
  }

  private assertNonEmpty(value: string, fieldName: string): void {
    if (!value.trim()) {
      throw new Error(`${fieldName} is required.`);
    }
  }

  private requireTrimmed(value: string, fieldName: string): string {
    this.assertNonEmpty(value, fieldName);
    return value.trim();
  }

  private assertAllowedValue<T extends string>(
    value: T,
    allowed: readonly T[],
    fieldName: string,
  ): T {
    if (!allowed.includes(value)) {
      throw new Error(`${fieldName} must be one of: ${allowed.join(", ")}.`);
    }

    return value;
  }
}
