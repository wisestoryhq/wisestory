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
IMPORTANT: Generate a separate image for EACH slide. These will be displayed as a swipeable carousel — each slide needs its own standalone image. Each slide image should feel like part of a cohesive series — consistent color palette, typography style, and visual language derived from the brand guidelines. The cover must be scroll-stopping.`,

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
Each image must be a SINGLE standalone full-frame visual — never a grid, collage, or multi-panel layout. Section visuals should feel like key frames from a polished video. The thumbnail needs to pop — bold text, high contrast, and a clear subject. Match the brand's visual sophistication level.`,

  x_post: `## Your Task: X Post

Create a complete X (formerly Twitter) post package:

1. **Tweet copy** — Write a compelling tweet within 280 characters. Make every word count. Use the brand's voice but adapted for X's fast, direct communication style. Include a clear hook in the first line.
2. **Hero image** — Generate one striking hero image (16:9 landscape) that complements the tweet and drives engagement. Generate this image right after the tweet copy.
3. **Alt text** — Write descriptive alt text for the image (for accessibility).
4. **Hashtags** — 2-4 relevant hashtags (X favors fewer, more targeted hashtags than Instagram).
5. **Thread potential** — One line suggesting how this post could be expanded into a thread if it gains traction.

### Image Direction
The hero image should be bold and high-contrast, optimized for timeline scroll. Use the brand's color palette and visual identity. X images display at 16:9 in the timeline — design for that crop. Text on the image should be minimal and large enough to read on mobile.`,

  x_thread: `## Your Task: X Thread

Create a complete X (formerly Twitter) thread package (5-10 tweets):

1. **Hook tweet** — The first tweet must be a scroll-stopping hook that makes people want to read the full thread. This is critical for engagement.
2. **Thread body** — For each subsequent tweet, provide:
   - **Tweet number** — Position in the thread (2/8, 3/8, etc.)
   - **Tweet copy** — The tweet text (max 280 characters each). Write in a conversational, authoritative tone.
   - **Supporting image** — Generate an image for key tweets (at least 3 images across the thread). Generate each image right after the tweet that uses it.
3. **Closing tweet** — The final tweet should include a clear CTA (follow, bookmark, share) and a brief summary of the thread's value.
4. **Thread title image** — Generate a title card image for the first tweet that previews the thread topic.

### Image Direction
Thread images should feel like a cohesive visual series — consistent style, colors from the brand palette, and clear messaging. Each image should be able to stand alone while clearly belonging to the thread. Use 16:9 landscape format for all images.`,

  linkedin_post: `## Your Task: LinkedIn Post

Create a complete LinkedIn post package:

1. **Post copy** — Write a professional, engaging LinkedIn post. Open with a strong hook line (this appears before "...see more"). Use short paragraphs and line breaks for scannability. Balance thought leadership with accessibility. Keep it under 1,300 characters for optimal engagement.
2. **Hero image** — Generate one professional hero image (1.91:1 landscape) that complements the post and drives engagement in the LinkedIn feed. Generate this image right after the post copy.
3. **Alt text** — Write descriptive alt text for the image.
4. **Hashtags** — 3-5 relevant professional hashtags.
5. **Engagement hook** — End with a question or CTA that encourages comments and discussion.

### Image Direction
The hero image should feel polished and professional without being corporate-generic. Use the brand's color palette and visual identity. LinkedIn images display at 1.91:1 in the feed — optimize for that crop. Avoid stock photo aesthetics; aim for distinctive, branded visuals.`,

  linkedin_carousel: `## Your Task: LinkedIn Carousel (Document Post)

Create a complete LinkedIn carousel package with 6-10 slides:

1. **Post copy** — Write the accompanying post text with a hook that makes people want to swipe through the carousel. Include a CTA to save/share.
2. **Slide-by-slide content** — For each slide, provide:
   - **Slide headline** — Bold, concise text (this is the main content readers see)
   - **Slide body** — Supporting text, data points, or key takeaways
   - **Slide image** — Generate an image for each slide that matches the brand's visual style. Generate each image immediately after describing the slide.
3. **Cover slide** — The first slide must have a compelling title that promises value. Generate a cover image.
4. **CTA slide** — The final slide must include a clear call to action (follow, visit, comment). Generate a closing image.
5. **Hashtags** — 3-5 relevant professional hashtags.

### Image Direction
IMPORTANT: Generate a separate image for EACH slide. These will be displayed as a swipeable carousel — each slide needs its own standalone image. Each slide should feel like part of a cohesive professional presentation — consistent color palette, clean typography style, and clear visual hierarchy derived from the brand guidelines. The cover must be compelling enough to make people start swiping. Use 1:1 square format for all slides.`,

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
