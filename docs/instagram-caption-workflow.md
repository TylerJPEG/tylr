# Instagram Caption Workflow

This workflow is meant to be run through conversation with a Codex agent, not through a fixed automation pipeline.

## Goal

Use the Instagram page as a hobby archive and a way into conversations about music, records, scenes, and taste. The t-shirt is the prompt, not the product.

## Core principle

The process should privilege judgment over automation:

- load the current context
- discuss the post idea
- identify the strongest angle
- research if needed
- draft caption options
- refine until the caption feels right

## Files to load first

- `data/instagram-direction.json`
- `data/instagram-manual-rules.json`
- `data/instagram-workspace.json`
- `data/instagram-posts.seed.json`
- `data/instagram-brief.json` if it exists
- `data/instagram-brief.example.json` if no active brief exists

## Working sequence

1. Read the direction, manual rules, and seeded posts.
2. Ask clarifying questions if the post idea is underspecified.
3. Identify whether the caption should focus on:
   - the band
   - a specific record or song
   - a scene or era
   - a broader thought about taste or significance
4. If necessary, do light research on the band, release, scene, or historical context.
5. Draft 3 caption options that follow the music-first editorial direction.
6. Explain the angle of each caption in plain language.
7. Refine one option based on conversation.

## When research is useful

Research is useful when:

- the caption should say something specific about a band, release, or scene
- there is a risk of flattening the idea into generic collector language
- a stronger angle could come from context, chronology, influence, or reception

## When not to over-research

Do not research just to stuff the caption with facts. The point is to sharpen the thought, not turn the caption into liner notes.

## Success criteria

A strong caption should:

- begin from a real musical idea
- treat the shirt as evidence, not the destination
- sound like your taste and judgment are doing the talking
- avoid sales language, collector flexing, and generic vintage fashion phrasing
- feel specific enough that it could only have been written about this band or this angle

## Tense and stance rules

- Write from informed proximity, not false firsthandness.
- Do not imply direct participation in 80s or 90s scenes unless that is literally true.
- Let the voice show knowledge, listening, reading, and historical understanding without pretending eyewitness status.
- Prefer phrasing like `seems central`, `has come to feel important`, `in the history of`, or `the more you dig into it` over phrasing that assumes you lived the moment yourself.
- If a sentence starts sounding like scene memoir, pull it back toward informed reflection.
