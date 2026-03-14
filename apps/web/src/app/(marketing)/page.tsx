"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  ArrowRight,
  FolderOpen,
  Brain,
  Sparkles,
  Cloud,
  Shield,
  Layers,
  FileText,
  Image as ImageIcon,
  Table2,
  Presentation,
  Palette,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ─── Animated Hero Illustration ─── */
function HeroIllustration() {
  return (
    <div className="relative mx-auto mt-16 h-[340px] w-full max-w-4xl overflow-hidden sm:mt-20 sm:h-[380px]">
      {/* Connection lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 380"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Left to center flow lines */}
        <path
          d="M 180 120 Q 300 120 370 190"
          stroke="#f6b900"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.5"
          style={{ animation: "dash 2s linear infinite" }}
        />
        <path
          d="M 180 190 Q 280 190 370 190"
          stroke="#f6b900"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.6"
          style={{ animation: "dash 2s linear infinite 0.4s" }}
        />
        <path
          d="M 180 260 Q 300 260 370 190"
          stroke="#f6b900"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.5"
          style={{ animation: "dash 2s linear infinite 0.8s" }}
        />
        {/* Center to right flow lines */}
        <path
          d="M 430 190 Q 520 190 620 120"
          stroke="#f6b900"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.5"
          style={{ animation: "dash 2s linear infinite 1.2s" }}
        />
        <path
          d="M 430 190 Q 530 190 620 190"
          stroke="#f6b900"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.6"
          style={{ animation: "dash 2s linear infinite 1.6s" }}
        />
        <path
          d="M 430 190 Q 520 190 620 260"
          stroke="#f6b900"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.5"
          style={{ animation: "dash 2s linear infinite 2s" }}
        />
      </svg>

      {/* ── Left column: Source inputs ── */}
      <div className="absolute left-[2%] top-1/2 flex -translate-y-1/2 flex-col gap-3 sm:left-[4%]">
        {[
          { icon: FileText, label: "Brand Guide.pdf", color: "text-blue-500", delay: "0s" },
          { icon: ImageIcon, label: "Logo Assets", color: "text-green-500", delay: "0.3s" },
          { icon: Table2, label: "Campaign Data", color: "text-emerald-600", delay: "0.6s" },
          { icon: Presentation, label: "Pitch Deck", color: "text-orange-500", delay: "0.9s" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 shadow-sm"
            style={{
              animation: `float 4s ease-in-out infinite`,
              animationDelay: item.delay,
            }}
          >
            <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
            <span className="text-xs font-medium text-foreground/80 whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Center: Gemini AI processing ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Glow rings */}
        <div className="absolute -inset-8 animate-pulse rounded-full bg-[#f6b900]/[0.06] blur-xl" />
        <div className="absolute -inset-4 animate-pulse rounded-full bg-[#f6b900]/[0.08] blur-md" style={{ animationDelay: "0.5s" }} />

        <div className="relative flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#f6b900]/40 bg-card shadow-lg shadow-[#f6b900]/10 sm:h-28 sm:w-28">
          <Image src="/gemini-icon.png" alt="Gemini" width={128} height={128} className="h-7 w-7 sm:h-8 sm:w-8" />
          <Image src="/gemini-label.png" alt="Gemini" width={400} height={116} className="h-[14px] w-auto" />
        </div>
      </div>

      {/* ── Right column: Generated outputs ── */}
      <div className="absolute right-[2%] top-1/2 flex -translate-y-1/2 flex-col gap-3 sm:right-[4%]">
        {[
          {
            img: "/icons/social/instagram.svg",
            label: "Instagram Post",
            sub: "Text + image",
            delay: "1.2s",
          },
          {
            img: "/icons/social/tiktok.svg",
            label: "TikTok Story",
            sub: "Script + visuals",
            delay: "1.5s",
          },
          {
            img: "/icons/social/youtube.svg",
            label: "YouTube Short",
            sub: "Storyboard",
            delay: "1.8s",
          },
          {
            img: null,
            icon: Palette,
            label: "Brand Content",
            sub: "On-brand output",
            delay: "2.1s",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-xl border border-[#f6b900]/30 bg-card px-3.5 py-2.5 shadow-sm"
            style={{
              animation: `float 4s ease-in-out infinite`,
              animationDelay: item.delay,
            }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f6b900]/10">
              {item.img ? (
                <Image src={item.img} alt={item.label} width={14} height={14} className="h-3.5 w-3.5" />
              ) : (
                item.icon && <item.icon className="h-3.5 w-3.5 text-[#f6b900]" />
              )}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-medium text-foreground/80 whitespace-nowrap">
                {item.label}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Column labels */}
      <div className="absolute bottom-2 left-[8%] text-center sm:left-[10%]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Google Drive
        </span>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          AI Engine
        </span>
      </div>
      <div className="absolute bottom-2 right-[8%] text-center sm:right-[10%]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Generated Content
        </span>
      </div>

      {/* Float animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -24; }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-1.5">
            <Image
              src="/logo-icon.svg"
              alt="WiseStory"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-[15px] font-semibold tracking-tight">
              WiseStory
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
          </nav>
          <Link
            href="/login"
            className={buttonVariants({
              size: "default",
              className: "gap-1.5 px-4",
            })}
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[#f6b900]/[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-24 sm:pt-32">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#f6b900]/30 bg-[#f6b900]/[0.06] px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#f6b900]" />
              <span className="text-xs font-medium tracking-wide text-foreground/70">
                Powered by Gemini 2.5
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              Turn brand knowledge into{" "}
              <span className="text-[#f6b900]">visual stories</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Connect your Google Drive. Let AI understand your brand.
              Generate compelling content with interleaved text and images
              — grounded in your real knowledge, not generic output.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className={buttonVariants({
                  size: "lg",
                  className: "h-11 gap-2 px-6 text-[15px]",
                })}
              >
                Start creating
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "h-11 px-6 text-[15px]",
                })}
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Animated flow illustration */}
          <HeroIllustration />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold tracking-wide text-[#f6b900]">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              AI that actually knows your brand
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Not another generic content generator. WiseStory produces
              on-brand content grounded in your real assets.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FolderOpen,
                title: "Google Drive Integration",
                description:
                  "Connect your Drive folders. WiseStory ingests brand guidelines, product docs, past campaigns, and every asset your team has built.",
              },
              {
                icon: Brain,
                title: "Semantic Knowledge Base",
                description:
                  "Documents are chunked, embedded with Gemini, and stored with pgvector — enabling semantic retrieval that captures meaning, not just keywords.",
              },
              {
                icon: Sparkles,
                title: "Interleaved Generation",
                description:
                  "Gemini 2.5 Flash generates text and images together in a single pass — producing cohesive visual stories, not separate pieces stitched together.",
              },
              {
                icon: Layers,
                title: "Multi-Format Output",
                description:
                  "Instagram posts, carousels, reels. TikTok videos. YouTube shorts and long-form. Generate for any platform from a single prompt.",
              },
              {
                icon: Cloud,
                title: "Cloud Native",
                description:
                  "Runs on Google Cloud Run with Cloud SQL, Secret Manager, and Terraform IaC. Designed for production from day one.",
              },
              {
                icon: Shield,
                title: "Multi-Tenant Workspaces",
                description:
                  "Each workspace is fully isolated with its own knowledge base, projects, and team members. Your data stays yours.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/60 bg-card p-7 transition-all hover:border-[#f6b900]/30 hover:shadow-sm"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6b900]/10">
                  <feature.icon className="h-5 w-5 text-[#f6b900]" />
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold tracking-wide text-[#f6b900]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to on-brand content
            </h2>
          </div>

          <div className="grid gap-0 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Connect your sources",
                description:
                  "Link your Google Drive. WiseStory processes documents, extracts text, generates embeddings, and builds a searchable knowledge base for your workspace.",
              },
              {
                step: "02",
                title: "Choose your format",
                description:
                  "Pick a media type — Instagram post, YouTube short, multi-platform campaign — and describe what you want. Add optional creative instructions.",
              },
              {
                step: "03",
                title: "Generate & publish",
                description:
                  "Watch as the Planner retrieves your brand knowledge, then the Creator generates interleaved text and images in real-time via streaming.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`relative p-8 sm:p-10 ${i < 2 ? "sm:border-r" : ""}`}
              >
                <span className="font-mono text-4xl font-bold text-[#f6b900]/20">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-center sm:px-16 sm:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(246,185,0,0.15)_0%,transparent_70%)]" />
            <h2 className="relative text-3xl font-bold tracking-tight text-background sm:text-4xl">
              Ready to create on-brand content?
            </h2>
            <p className="relative mt-4 text-base text-background/60">
              Connect your Drive, enter a prompt, and let Gemini do the rest.
            </p>
            <div className="relative mt-8">
              <Link
                href="/login"
                className={buttonVariants({
                  size: "lg",
                  className: "h-11 gap-2 px-6 text-[15px] font-semibold",
                })}
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-1.5">
            <Image
              src="/logo-icon.svg"
              alt="WiseStory"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-[15px] font-semibold tracking-tight">
              WiseStory
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for the Gemini Live Agent Challenge
          </p>
        </div>
      </footer>
    </div>
  );
}
