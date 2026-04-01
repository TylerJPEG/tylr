export const itemKinds = ["note", "task", "habit", "event", "metric"] as const;
export type LifeItemKind = (typeof itemKinds)[number];

export const itemStatuses = ["active", "completed", "archived"] as const;
export type LifeItemStatus = (typeof itemStatuses)[number];

export interface LifeItem {
  id: string;
  kind: LifeItemKind;
  title: string;
  details?: string;
  area?: string;
  tags: string[];
  status: LifeItemStatus;
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  completedAt?: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface CreateLifeItemInput {
  kind: LifeItemKind;
  title: string;
  details?: string;
  area?: string;
  tags?: string[];
  scheduledFor?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface UpdateLifeItemInput {
  title?: string;
  details?: string;
  area?: string;
  tags?: string[];
  status?: LifeItemStatus;
  scheduledFor?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface LifeItemQuery {
  kind?: LifeItemKind;
  status?: LifeItemStatus;
  area?: string;
  tag?: string;
}

export interface LifeSnapshot {
  total: number;
  byKind: Record<LifeItemKind, number>;
  byStatus: Record<LifeItemStatus, number>;
}
