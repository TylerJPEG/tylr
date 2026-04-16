import { randomUUID } from "node:crypto";

import type {
  CaptionDirectionInput,
  CaptionGenerationResult,
  CaptionIdea,
  InstagramDirection,
  InstagramPost,
  InstagramWorkspace,
  VoiceProfile,
  VoiceRule,
} from "../domain/instagram.js";
import type { InstagramRepository } from "./instagram-repository.js";

const defaultProfile: VoiceProfile = {
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
};

const defaultDirection: InstagramDirection = {
  positioning: "The t-shirt is the entry point, not the entire subject.",
  purpose: "Use the collection as a way into conversations about music, scenes, records, and why certain bands matter.",
  shirtRole: "Treat the shirt as a vessel or prompt rather than a product.",
  conversationFocus: [],
  preferredMoves: [],
  avoidances: [],
  anchorPosts: [],
  updatedAt: new Date(0).toISOString(),
};

export class InstagramCaptionStudio {
  constructor(private readonly repository: InstagramRepository) {}

  async seedPosts(posts: Array<Omit<InstagramPost, "id"> & { id?: string }>): Promise<InstagramWorkspace> {
    const workspace = await this.repository.load();
    const normalizedPosts = posts.map((post) => this.normalizePost(post));
    const nextPosts = [...new Map(normalizedPosts.map((post) => [post.id, post])).values()].sort((left, right) =>
      left.postedAt.localeCompare(right.postedAt),
    );
    const inferredProfile = this.inferProfile(nextPosts);
    const inferredRules = this.inferRules(nextPosts, inferredProfile);
    const manualRules = workspace.rules.filter((rule) => rule.source === "manual");
    const nextWorkspace: InstagramWorkspace = {
      posts: nextPosts,
      profile: inferredProfile,
      rules: this.mergeRules([...manualRules, ...inferredRules]),
      direction: workspace.direction ?? defaultDirection,
    };

    await this.repository.save(nextWorkspace);
    return nextWorkspace;
  }

  async addRule(input: Omit<VoiceRule, "id" | "createdAt" | "updatedAt" | "source">): Promise<VoiceRule> {
    const workspace = await this.repository.load();
    const now = new Date().toISOString();
    const rule: VoiceRule = {
      id: randomUUID(),
      category: input.category,
      instruction: input.instruction.trim(),
      rationale: input.rationale?.trim(),
      priority: input.priority,
      createdAt: now,
      updatedAt: now,
      source: "manual",
    };

    const nextWorkspace = {
      ...workspace,
      rules: this.mergeRules([...workspace.rules, rule]),
    };

    await this.repository.save(nextWorkspace);
    return rule;
  }

  async getWorkspace(): Promise<InstagramWorkspace> {
    return this.repository.load();
  }

  async setDirection(direction: Omit<InstagramDirection, "updatedAt">): Promise<InstagramWorkspace> {
    const workspace = await this.repository.load();
    const nextWorkspace: InstagramWorkspace = {
      ...workspace,
      direction: {
        positioning: direction.positioning.trim(),
        purpose: direction.purpose.trim(),
        shirtRole: direction.shirtRole.trim(),
        conversationFocus: this.normalizeList(direction.conversationFocus),
        preferredMoves: this.normalizeList(direction.preferredMoves),
        avoidances: this.normalizeList(direction.avoidances),
        anchorPosts: this.normalizeList(direction.anchorPosts),
        updatedAt: new Date().toISOString(),
      },
    };

    await this.repository.save(nextWorkspace);
    return nextWorkspace;
  }

  async generateCaptions(input: CaptionDirectionInput): Promise<CaptionGenerationResult> {
    const workspace = await this.repository.load();
    const brief = this.normalizeDirection(input);
    const activeRules = [...workspace.rules].sort((left, right) => right.priority - left.priority);
    const templates = this.buildCaptionTemplates(brief, workspace.profile, activeRules, workspace.direction);
    const ideas = templates.slice(0, brief.desiredCount).map((template, index) =>
      this.renderIdea(template, index, brief, workspace.profile, activeRules, workspace.direction),
    );

    return {
      brief,
      profileSnapshot: workspace.profile,
      activeRules,
      ideas,
      generatedAt: new Date().toISOString(),
    };
  }

  private normalizePost(post: Omit<InstagramPost, "id"> & { id?: string }): InstagramPost {
    return {
      id: post.id ?? randomUUID(),
      caption: post.caption.trim(),
      postedAt: post.postedAt,
      mediaType: post.mediaType,
      tags: this.normalizeList(post.tags),
      themes: this.normalizeList(post.themes),
      engagement: post.engagement,
      notes: post.notes?.trim(),
    };
  }

  private normalizeDirection(input: CaptionDirectionInput): CaptionDirectionInput {
    if (!input.prompt.trim()) {
      throw new Error("prompt is required.");
    }

    return {
      prompt: input.prompt.trim(),
      goal: input.goal?.trim(),
      audience: input.audience?.trim(),
      context: input.context?.trim(),
      callToAction: input.callToAction?.trim(),
      themes: this.normalizeList(input.themes),
      requiredPhrases: this.normalizeList(input.requiredPhrases),
      avoidedPhrases: this.normalizeList(input.avoidedPhrases),
      desiredCount: Math.max(1, Math.min(input.desiredCount ?? 3, 6)),
    };
  }

  private inferProfile(posts: InstagramPost[]): VoiceProfile {
    if (posts.length === 0) {
      return {
        ...defaultProfile,
        updatedAt: new Date().toISOString(),
      };
    }

    const captions = posts.map((post) => post.caption);
    const phraseCounts = new Map<string, number>();
    const hashtagCounts = new Map<string, number>();
    const openers = new Map<string, number>();
    const closers = new Map<string, number>();
    let totalLength = 0;
    let emojiHits = 0;
    let punctuationHits = 0;
    let callToActionHits = 0;

    for (const caption of captions) {
      totalLength += caption.length;
      if (this.hasEmoji(caption)) emojiHits += 1;
      if (/[!?]{2,}|…/.test(caption)) punctuationHits += 1;
      if (/\b(comment|tell me|save this|read more|let me know|which one)\b/i.test(caption)) {
        callToActionHits += 1;
      }

      const opener = caption.split(/\s+/).slice(0, 3).join(" ");
      const closer = caption.split(/\s+/).slice(-4).join(" ");
      openers.set(opener, (openers.get(opener) ?? 0) + 1);
      closers.set(closer, (closers.get(closer) ?? 0) + 1);

      for (const phrase of this.extractPhrases(caption)) {
        phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
      }

      for (const hashtag of this.extractHashtags(caption)) {
        hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) ?? 0) + 1);
      }
    }

    const averageLength = totalLength / captions.length;
    const lowerCaptions = captions.join(" ").toLowerCase();
    const toneKeywords = this.pickTopEntries(this.collectWordFrequency(lowerCaptions), 5);

    return {
      summary: this.buildProfileSummary(posts.length, averageLength, emojiHits, callToActionHits),
      toneKeywords,
      commonOpeners: this.pickTopEntries(openers, 3),
      commonClosers: this.pickTopEntries(closers, 3),
      recurringPhrases: this.pickTopEntries(phraseCounts, 5),
      recurringHashtags: this.pickTopEntries(hashtagCounts, 5),
      averageCaptionLength: averageLength < 120 ? "short" : averageLength < 280 ? "medium" : "long",
      emojiUsage: this.toEmojiUsageLevel(emojiHits / captions.length),
      punctuationStyle: punctuationHits / captions.length > 0.4 ? "expressive" : punctuationHits > 0 ? "balanced" : "minimal",
      callToActionStyle: this.toCallToActionUsageLevel(callToActionHits / captions.length),
      updatedAt: new Date().toISOString(),
    };
  }

  private inferRules(posts: InstagramPost[], profile: VoiceProfile): VoiceRule[] {
    const now = new Date().toISOString();
    const rules: VoiceRule[] = [];

    if (profile.averageCaptionLength === "short") {
      rules.push(this.createSeedRule("structure", "Prefer concise captions that land quickly.", 80, now));
    }

    if (profile.averageCaptionLength === "long") {
      rules.push(this.createSeedRule("structure", "Allow room for a fuller story arc before the close.", 80, now));
    }

    if (profile.emojiUsage === "light") {
      rules.push(this.createSeedRule("grammar", "Use emojis sparingly and only when they add warmth.", 65, now));
    }

    if (profile.emojiUsage === "frequent") {
      rules.push(this.createSeedRule("grammar", "Use a few emojis to preserve the existing posting rhythm.", 65, now));
    }

    if (profile.recurringPhrases.length > 0) {
      rules.push(
        this.createSeedRule(
          "pattern",
          `Use recurring phrases as diagnostic evidence only, not as reusable language: ${profile.recurringPhrases.slice(0, 3).join(", ")}.`,
          75,
          now,
        ),
      );
    }

    if (profile.commonOpeners.length > 0) {
      rules.push(
        this.createSeedRule(
          "pattern",
          `Common caption openings are reference points to avoid over-repeating, not templates: ${profile.commonOpeners.slice(0, 2).join(" | ")}.`,
          55,
          now,
        ),
      );
    }

    if (profile.callToActionStyle === "rare") {
      rules.push(this.createSeedRule("tone", "Avoid sounding salesy or overly directive.", 70, now));
    }

    if (posts.length > 0) {
      rules.push(this.createSeedRule("vocabulary", "Keep wording natural and conversational rather than corporate.", 85, now));
    }

    return rules;
  }

  private buildCaptionTemplates(
    brief: CaptionDirectionInput,
    profile: VoiceProfile,
    rules: VoiceRule[],
    direction: InstagramDirection,
  ): string[] {
    const opener = profile.commonOpeners[0] ?? "Lately I've been thinking about";
    const closer =
      brief.callToAction ??
      (profile.callToActionStyle === "rare" ? "" : profile.commonClosers[0] ?? "Let me know what you think.");
    const recurringPhrase = profile.recurringPhrases[0];
    const themeLine = brief.themes && brief.themes.length > 0 ? ` Themes: ${brief.themes.join(", ")}.` : "";
    const contextLine = brief.context ? ` ${brief.context}` : "";
    const goalLine = brief.goal ? ` ${brief.goal}` : "";
    const required = brief.requiredPhrases?.length ? ` ${brief.requiredPhrases.join(" ")}` : "";
    const hashtags = profile.recurringHashtags.slice(0, 2).join(" ");
    const styleCue =
      rules.find((rule) => rule.category === "structure")?.instruction ??
      "Keep the structure clean and easy to read.";
    const focus = direction.conversationFocus[0] ?? "what makes the music worth returning to";
    const purpose = direction.purpose || "Use the shirt as a way into the music.";
    const vesselLine = ` The shirt is there, but mostly as a way into ${focus}.`;

    return [
      `${opener} ${brief.prompt}.${contextLine}${goalLine}${themeLine}${vesselLine} ${required} ${closer}`.trim(),
      `${brief.prompt}. ${recurringPhrase ? `${recurringPhrase}. ` : ""}${styleCue}${vesselLine} ${closer}`.trim(),
      `What interests me here isn't only the shirt. It's what it opens up about ${focus}. ${brief.prompt}.${themeLine} ${closer}`.trim(),
      `${opener} ${brief.prompt}. ${brief.goal ?? "The point is to get at why the band, record, or scene matters."} ${hashtags}`.trim(),
      `${brief.prompt}. ${brief.context ?? "Keeping it clear, specific, and closer to music writing than product copy."} ${required} ${closer}`.trim(),
      `Not really posting this just to say \"here's a shirt.\" ${brief.prompt}. ${purpose} ${brief.callToAction ?? ""}`.trim(),
    ].map((template) => this.cleanSpacing(template));
  }

  private renderIdea(
    template: string,
    index: number,
    brief: CaptionDirectionInput,
    profile: VoiceProfile,
    rules: VoiceRule[],
    direction: InstagramDirection,
  ): CaptionIdea {
    const hooks = [
      profile.toneKeywords[0] ?? "conversational",
      brief.themes?.[0] ?? "personal",
      profile.averageCaptionLength,
    ];

    return {
      caption: this.applyAvoidedPhrases(template, brief.avoidedPhrases ?? []),
      hooks,
      appliedRules: rules.slice(0, 4).map((rule) => rule.instruction),
      reasoning:
        index === 0
          ? `Closest to the inferred voice profile while honoring the stated direction: ${direction.positioning}`
          : index === 1
            ? "Leans harder into repeated phrasing and structure."
            : "Explores a slightly different angle while staying inside the same music-first framing.",
    };
  }

  private applyAvoidedPhrases(caption: string, avoidedPhrases: string[]): string {
    let next = caption;

    for (const phrase of avoidedPhrases) {
      const pattern = new RegExp(this.escapeRegex(phrase), "gi");
      next = next.replace(pattern, "").trim();
    }

    return this.cleanSpacing(next);
  }

  private buildProfileSummary(
    postCount: number,
    averageLength: number,
    emojiHits: number,
    callToActionHits: number,
  ): string {
    const lengthStyle = averageLength < 120 ? "short" : averageLength < 280 ? "mid-length" : "longer-form";
    const emojiStyle = emojiHits === 0 ? "no emojis" : emojiHits / postCount < 0.4 ? "light emoji use" : "frequent emojis";
    const ctaStyle = callToActionHits === 0 ? "rare direct CTA language" : "some CTA language";
    return `Seeded from ${postCount} posts. Captions trend ${lengthStyle}, with ${emojiStyle} and ${ctaStyle}.`;
  }

  private createSeedRule(
    category: VoiceRule["category"],
    instruction: string,
    priority: number,
    now: string,
  ): VoiceRule {
    return {
      id: randomUUID(),
      category,
      instruction,
      priority,
      createdAt: now,
      updatedAt: now,
      source: "seed-analysis",
    };
  }

  private mergeRules(rules: VoiceRule[]): VoiceRule[] {
    const deduped = new Map<string, VoiceRule>();

    for (const rule of rules) {
      deduped.set(`${rule.category}:${rule.instruction.toLowerCase()}`, rule);
    }

    return [...deduped.values()].sort((left, right) => right.priority - left.priority);
  }

  private normalizeList(values?: string[]): string[] {
    return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
  }

  private extractPhrases(caption: string): string[] {
    const parts = caption
      .split(/[.!?\n]/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.split(/\s+/).length >= 3 && part.length <= 60);

    return parts;
  }

  private extractHashtags(caption: string): string[] {
    return [...caption.matchAll(/#[\p{L}\p{N}_]+/gu)].map((match) => match[0].toLowerCase());
  }

  private collectWordFrequency(text: string): Map<string, number> {
    const counts = new Map<string, number>();
    const stopWords = new Set(["the", "and", "that", "with", "this", "from", "have", "just", "your", "about"]);

    for (const word of text.match(/\b[a-z']{4,}\b/g) ?? []) {
      if (stopWords.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }

    return counts;
  }

  private pickTopEntries(source: Map<string, number>, count: number): string[] {
    return [...source.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, count)
      .map(([value]) => value);
  }

  private toEmojiUsageLevel(ratio: number): "none" | "light" | "frequent" {
    if (ratio === 0) return "none";
    if (ratio < 0.6) return "light";
    return "frequent";
  }

  private toCallToActionUsageLevel(ratio: number): "rare" | "occasional" | "frequent" {
    if (ratio < 0.25) return "rare";
    if (ratio < 0.8) return "occasional";
    return "frequent";
  }

  private hasEmoji(value: string): boolean {
    return /\p{Extended_Pictographic}/u.test(value);
  }

  private cleanSpacing(value: string): string {
    return value.replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  static getDefaultDirection(): InstagramDirection {
    return defaultDirection;
  }
}
