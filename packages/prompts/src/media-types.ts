import type { MediaType } from "./types";

/**
 * Media-type-specific instructions that extend the base creative director prompt.
 * Each tells the agent what to produce and when to generate images.
 */
const MEDIA_TYPE_INSTRUCTIONS: Record<MediaType, string> = {
  instagram_post: `## Your Task: Instagram Post

Create a complete Instagram post package:

1. **Caption** — Write a compelling caption using the brand's voice. Include line breaks for readability. End with a clear CTA.
2. **Hero Image** — Generate one striking hero image that captures the post's message using the brand's visual style and colors. Generate this image right after the caption.
3. **Hashtags** — Provide 8-15 relevant hashtags mixing branded, niche, and discovery tags.

### Image Direction
The hero image should be scroll-stopping. Use the brand's color palette, photography style, and visual identity from the retrieved brand knowledge. Make it feel native to the brand, not generic stock art.`,

  instagram_carousel: `## Your Task: Instagram Carousel

Create a complete carousel package with 5-8 slides:

1. **Caption** — Write the carousel caption with a hook in the first line, value proposition, and CTA.
2. **Slide-by-slide content** — For each slide, provide:
   - **Slide headline** — Bold, concise text for the slide
   - **Slide body** — Supporting text or key point
   - **Slide image** — Generate an image for each slide that matches the brand's visual style. Generate the image immediately after describing each slide.
3. **Cover slide** — The first slide must be a strong hook with a generated cover image.
4. **CTA slide** — The final slide must be a clear call to action with a generated image.
5. **Hashtags** — 8-15 relevant hashtags.

### Image Direction
Each slide image should feel like part of a cohesive series — consistent color palette, typography style, and visual language derived from the brand guidelines. The cover must be scroll-stopping.`,

  instagram_reel: `## Your Task: Instagram Reel

Create a complete reel storyboard package:

1. **Reel concept** — One-line creative concept for the reel.
2. **Scene-by-scene storyboard** — For each scene (4-6 scenes), provide:
   - **Timing** — Duration of the scene (e.g., "0:00-0:03")
   - **Visual direction** — What appears on screen
   - **On-screen text** — Any text overlays
   - **Voiceover/narration** — What is spoken
   - **Keyframe image** — Generate an image visualizing the key moment of this scene. Generate it right after describing the scene.
3. **Caption** — Instagram caption for the reel.
4. **Audio suggestion** — Trending audio or music style recommendation.
5. **CTA** — End screen call to action.

### Image Direction
Keyframe images should capture the most impactful moment of each scene. Use the brand's visual aesthetic. Think cinematic — these frames tell the story.`,

  tiktok_video: `## Your Task: TikTok Video

Create a complete TikTok video script package:

1. **Hook** — The first 1-2 seconds that stop the scroll. This is critical. Make it bold and unexpected.
2. **Beat-by-beat flow** — For each beat (4-6 beats), provide:
   - **Beat description** — What happens in this moment
   - **Dialogue/voiceover** — What is said (write in a conversational, authentic tone)
   - **On-screen text** — Text overlays that reinforce the message
   - **Visual direction** — Camera angle, transitions, what's shown
   - **Scene image** — Generate an image for each key beat. Generate it immediately after the beat description.
3. **Caption** — TikTok caption with relevant hooks.
4. **Sound** — Audio/sound recommendation.
5. **CTA** — Clear next step for the viewer.

### Image Direction
TikTok visuals should feel authentic and energetic, not overly polished. Use brand colors but keep the vibe native to the platform. Vertical format mindset.`,

  youtube_shorts: `## Your Task: YouTube Shorts

Create a complete Shorts script package (15-60 seconds):

1. **Title** — Clickable, curiosity-driven title.
2. **Hook** — First 2 seconds that grab attention. This determines whether people watch.
3. **Script** — Full script with timing:
   - Write it as a continuous flow with beat markers
   - Each beat has: narration, on-screen text, and visual direction
   - Generate a storyboard frame image for each major beat (3-4 images total). Generate each image right after its beat.
4. **Thumbnail concept** — Describe and generate a thumbnail image that maximizes click-through rate.
5. **End CTA** — What the viewer should do next (subscribe, check link, etc.).
6. **Description** — Short YouTube description with relevant keywords.

### Image Direction
Storyboard frames should clearly communicate the visual progression. The thumbnail must be bold, high-contrast, and instantly readable at small sizes. Use brand colors prominently.`,

  youtube_video: `## Your Task: YouTube Video

Create a complete long-form video script package:

1. **Title options** — 3 title variants optimized for search and click-through.
2. **Thumbnail** — Describe and generate a thumbnail image that drives clicks.
3. **Intro hook** — First 15-30 seconds that convince viewers to stay. This is the most important part.
4. **Video outline** — Section-by-section structure with estimated timestamps.
5. **Full script** — For each section:
   - **Section title** — Clear heading
   - **Script** — Full narration text
   - **B-roll notes** — What supporting visuals to show
   - **Key visual** — Generate an image for the main visual concept of each section. Generate it right after the script for that section.
6. **Closing CTA** — Subscribe, like, comment prompt with a specific hook.
7. **Description** — YouTube description with timestamps, links, and keywords.
8. **Tags** — 10-15 relevant YouTube tags.

### Image Direction
Section visuals should feel like key frames from a polished video. The thumbnail needs to pop — bold text, high contrast, and a clear subject. Match the brand's visual sophistication level.`,

  multi_platform_campaign: `## Your Task: Multi-Platform Campaign

Create a coordinated campaign package across multiple platforms:

1. **Campaign concept** — The unifying creative angle that ties everything together.
2. **Campaign narrative** — The story arc across platforms (how each platform piece connects).
3. **Hero visual** — Generate one hero image that represents the campaign concept.
4. **Instagram deliverable** — A complete post or carousel with generated visuals (follow the Instagram post/carousel format).
5. **YouTube Shorts deliverable** — A complete Shorts script with storyboard frames (follow the Shorts format).
6. **TikTok deliverable** — A complete TikTok script with scene images (follow the TikTok format).
7. **Cross-platform CTA variants** — Platform-specific CTAs that drive to the same goal.
8. **Campaign timeline** — Suggested posting order and timing.

### Image Direction
All visuals across platforms must feel like they belong to the same campaign — unified color palette, visual motifs, and brand elements. Each platform version should feel native while maintaining campaign cohesion.`,
};

/**
 * Get the media-type-specific instruction for the agent.
 */
export function getMediaTypeInstruction(mediaType: MediaType): string {
  return MEDIA_TYPE_INSTRUCTIONS[mediaType];
}
