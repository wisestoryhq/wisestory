import type { MediaType } from "./types";

/**
 * Media-type-specific instructions that extend the base creative director prompt.
 * Each tells the agent what to produce and when to generate images.
 */
const MEDIA_TYPE_INSTRUCTIONS: Record<MediaType, string> = {
  instagram_post: `## Format: Instagram Post (1 image)

Deliver: caption + 1 hero image + hashtags.

**Copy direction**: Write a caption that hooks in the first line (this shows before "...more"). Use the brand's voice. Line breaks for rhythm. End with a CTA.

**Image direction**: Generate one scroll-stopping hero image right after the caption. The image should carry the post's core message visually — not just illustrate the text, but amplify it. Ground it in the brand's color palette and visual identity.

**Hashtags**: 8–15, mixing branded + niche + discovery.`,

  instagram_carousel: `## Format: Instagram Carousel (MULTI-IMAGE — 5 to 8 slides)

This is a swipeable carousel. You MUST generate a separate image for EACH slide. This format requires the most content — treat it like a visual story told across multiple frames.

**Structure your output as a repeating pattern:**
For each slide, write the slide text, then immediately generate that slide's image before moving to the next slide. Follow this pattern:

→ Slide 1 (Cover): headline + [GENERATE IMAGE]
→ Slide 2: point + [GENERATE IMAGE]
→ Slide 3: point + [GENERATE IMAGE]
→ Slide 4: point + [GENERATE IMAGE]
→ Slide 5 (CTA): call to action + [GENERATE IMAGE]
...and so on for 5–8 slides.

**Copy direction**: Write a carousel caption with a hook first line, value proposition, and CTA. Then the slide-by-slide content with bold headlines and concise supporting text per slide.

**Image direction**: Each slide image must be a standalone visual that works on its own but feels part of a cohesive series — same color palette, consistent visual language, unified typography style. The cover slide must be scroll-stopping. The CTA slide must feel like a satisfying conclusion.

**Hashtags**: 8–15.`,

  instagram_reel: `## Format: Instagram Reel (storyboard, 4–6 scenes)

Deliver: concept + scene-by-scene storyboard with keyframe images + caption + audio suggestion.

**Copy direction**: Start with a one-line creative concept. Then storyboard each scene with timing, visual direction, on-screen text, and voiceover. Write the caption separately.

**Image direction**: Generate a keyframe image for each scene — capture the most cinematic, impactful moment. These are storyboard frames, so they should clearly communicate the visual progression of the story.

**Audio**: Suggest a trending audio style or music mood that fits.`,

  tiktok_video: `## Format: TikTok Video (storyboard, 4–6 beats)

Deliver: hook + beat-by-beat flow with scene images + caption + sound + CTA.

**Copy direction**: The hook (first 1–2 seconds) is everything — make it bold and unexpected. Then write beat-by-beat: what happens, what's said (conversational tone), on-screen text overlays, visual direction.

**Image direction**: Generate a scene image for each beat. TikTok visuals should feel authentic and energetic — not overly polished. Use brand colors but keep the vibe native to the platform.

**Sound**: Recommend a trending audio or music style.`,

  youtube_shorts: `## Format: YouTube Shorts (storyboard, 15–60 seconds)

Deliver: title + hook + scripted beats with storyboard images + thumbnail + description.

**Copy direction**: Write a clickable title. The hook (first 2 seconds) determines whether people watch. Then script the beats with narration, on-screen text, and visual direction.

**Image direction**: Generate a storyboard frame for each major beat (3–4 images). Also generate a thumbnail that's bold, high-contrast, and instantly readable at small sizes. Use brand colors prominently.`,

  youtube_video: `## Format: YouTube Video (long-form script with key visuals)

Deliver: title options + thumbnail + intro hook + full section-by-section script with key visuals + description + tags.

**Copy direction**: Provide 3 title variants optimized for search and CTR. The intro hook (first 15–30 seconds) is the most important part — it must convince viewers to stay. Then a full script organized by sections with timestamps.

**Image direction**: Generate a key visual for each major section — these should feel like polished video frames. Generate a thumbnail that pops with bold text, high contrast, and a clear subject.

**Tags**: 10–15 relevant YouTube tags.`,

  x_post: `## Format: X Post (1 image)

Deliver: tweet copy + 1 hero image + alt text + hashtags.

**Copy direction**: Write a compelling tweet within 280 characters. Every word counts. Hook in the first line. Adapt the brand voice for X's fast, direct style.

**Image direction**: Generate one bold, high-contrast hero image (16:9) right after the copy. X images display at 16:9 in the timeline — optimize for that crop. Minimal text on the image, large enough to read on mobile.

**Hashtags**: 2–4 targeted hashtags (X favors fewer than Instagram).`,

  x_thread: `## Format: X Thread (MULTI-POST — 5 to 8 tweets, images on key tweets)

This is a thread — multiple connected tweets that tell a story. Generate images for at least 3 tweets across the thread.

**Structure your output as a repeating pattern:**
→ Tweet 1 (Hook): scroll-stopping opener + [GENERATE TITLE CARD IMAGE]
→ Tweet 2: key point (280 chars max)
→ Tweet 3: key point + [GENERATE IMAGE]
→ Tweet 4: key point
→ Tweet 5: key point + [GENERATE IMAGE]
...and so on for 5–8 tweets, ending with a CTA tweet.

**Copy direction**: The hook tweet is critical — it determines whether anyone reads the thread. Write each tweet at max 280 characters in a conversational, authoritative tone. The closing tweet should include a CTA (follow, bookmark, share).

**Image direction**: Thread images should feel like a cohesive visual series — consistent style and brand palette. Each image must stand alone while clearly belonging to the thread. Use 16:9 landscape format.`,

  linkedin_post: `## Format: LinkedIn Post (1 image)

Deliver: post copy + 1 hero image + alt text + hashtags + engagement hook.

**Copy direction**: Open with a strong hook line (this appears before "...see more" — it's your one shot). Short paragraphs, line breaks for scannability. Balance thought leadership with accessibility. Under 1,300 characters. End with a question or discussion prompt.

**Image direction**: Generate one polished, professional hero image (1.91:1) right after the copy. It should feel distinctive and branded — not corporate-generic or stock-photo-like. Use the brand's color palette.

**Hashtags**: 3–5 professional hashtags.`,

  linkedin_carousel: `## Format: LinkedIn Carousel (MULTI-IMAGE — 6 to 10 slides)

This is a document-style carousel. You MUST generate a separate image for EACH slide. This format requires substantial content — think of it as a visual micro-presentation.

**Structure your output as a repeating pattern:**
For each slide, write the slide content, then immediately generate that slide's image before moving to the next slide:

→ Slide 1 (Cover): compelling title + [GENERATE IMAGE]
→ Slide 2: key insight + [GENERATE IMAGE]
→ Slide 3: data/evidence + [GENERATE IMAGE]
→ Slide 4: key insight + [GENERATE IMAGE]
→ Slide 5: key insight + [GENERATE IMAGE]
→ Slide 6 (CTA): call to action + [GENERATE IMAGE]
...and so on for 6–10 slides.

**Copy direction**: Write the accompanying post with a hook that makes people want to swipe. Then deliver slide-by-slide with bold headlines and concise supporting text, data points, or takeaways per slide. Include a CTA to save/share.

**Image direction**: Each slide must be a standalone professional visual that works independently but belongs to a cohesive series — consistent color palette, clean typography, clear visual hierarchy from the brand guidelines. The cover must be compelling enough to trigger the first swipe. Use 1:1 square format.

**Hashtags**: 3–5 professional hashtags.`,

  multi_platform_campaign: `## Format: Multi-Platform Campaign (hero visual + platform deliverables)

Deliver: campaign concept + narrative + hero visual + Instagram deliverable + YouTube Shorts deliverable + TikTok deliverable + cross-platform CTAs + timeline.

**Copy direction**: Start with the unifying creative angle. Then produce platform-native content for Instagram (post or carousel), YouTube Shorts (storyboard), and TikTok (beat flow). Each should feel native to its platform while telling the same story.

**Image direction**: Generate a hero campaign image first. Then generate platform-specific visuals for each deliverable. All visuals must share a unified color palette, visual motifs, and brand elements — they should unmistakably belong to the same campaign.

**Timeline**: Suggest a posting order and timing for maximum cross-platform impact.`,
};

/**
 * Get the media-type-specific instruction for the agent.
 */
export function getMediaTypeInstruction(mediaType: MediaType): string {
  return MEDIA_TYPE_INSTRUCTIONS[mediaType];
}
