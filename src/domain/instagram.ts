export interface InstagramPost {
  id: string;
  caption: string;
  postedAt: string;
  mediaType?: "photo" | "video" | "carousel" | "reel";
  tags: string[];
  themes: string[];
  engagement?: {
    likes?: number;
    comments?: number;
    saves?: number;
    shares?: number;
  };
  notes?: string;
}

export type VoiceRuleCategory =
  | "tone"
  | "structure"
  | "grammar"
  | "vocabulary"
  | "pattern"
  | "avoidance";

export interface VoiceRule {
  id: string;
  category: VoiceRuleCategory;
  instruction: string;
  rationale?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  source: "manual" | "seed-analysis";
}

export interface VoiceProfile {
  summary: string;
  toneKeywords: string[];
  commonOpeners: string[];
  commonClosers: string[];
  recurringPhrases: string[];
  recurringHashtags: string[];
  averageCaptionLength: "short" | "medium" | "long";
  emojiUsage: "none" | "light" | "frequent";
  punctuationStyle: "minimal" | "balanced" | "expressive";
  callToActionStyle: "rare" | "occasional" | "frequent";
  updatedAt: string;
}

export interface InstagramDirection {
  positioning: string;
  purpose: string;
  shirtRole: string;
  conversationFocus: string[];
  preferredMoves: string[];
  avoidances: string[];
  anchorPosts: string[];
  updatedAt: string;
}

export interface CaptionDirectionInput {
  prompt: string;
  goal?: string;
  audience?: string;
  context?: string;
  callToAction?: string;
  themes?: string[];
  requiredPhrases?: string[];
  avoidedPhrases?: string[];
  desiredCount?: number;
}

export interface CaptionIdea {
  caption: string;
  hooks: string[];
  appliedRules: string[];
  reasoning: string;
}

export interface CaptionGenerationResult {
  brief: CaptionDirectionInput;
  profileSnapshot: VoiceProfile;
  activeRules: VoiceRule[];
  ideas: CaptionIdea[];
  generatedAt: string;
}

export interface InstagramWorkspace {
  posts: InstagramPost[];
  rules: VoiceRule[];
  profile: VoiceProfile;
  direction: InstagramDirection;
}
