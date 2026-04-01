import type { LifeItem } from "../domain/models.js";

export interface LifeRepository {
  list(): Promise<LifeItem[]>;
  getById(id: string): Promise<LifeItem | null>;
  save(item: LifeItem): Promise<void>;
  delete(id: string): Promise<void>;
}
