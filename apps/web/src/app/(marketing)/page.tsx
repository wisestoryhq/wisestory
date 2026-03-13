"use client";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Sparkles,
  Layers,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              WiseStory
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          </nav>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_50%)] opacity-[0.04]" />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-24 sm:pb-28 sm:pt-32">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="outline" className="gap-1.5 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              AI-powered storytelling
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Turn knowledge into
              <br />
              <span className="text-primary">visual stories</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Connect your sources. Let Gemini understand your content and
              generate compelling stories with interleaved text and images.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link href="/login" className={buttonVariants({ size: "lg", className: "gap-2" })}>
                Start creating
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="mb-12">
            <p className="text-sm font-medium text-primary">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Three steps to your story
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Connect sources",
                description:
                  "Import from Google Drive, upload files, or paste text. Your content stays organized in projects.",
                step: "01",
              },
              {
                icon: Sparkles,
                title: "AI understands",
                description:
                  "Gemini ingests and indexes your knowledge base, building rich context for generation.",
                step: "02",
              },
              {
                icon: Layers,
                title: "Generate stories",
                description:
                  "Create campaigns that produce interleaved text and images — blogs, carousels, newsletters.",
                step: "03",
              },
            ].map((feature) => (
              <div
                key={feature.step}
                className="flex flex-col gap-4 bg-background p-8"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">
                    {feature.step}
                  </span>
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs text-muted-foreground">
            WiseStory — Built for the Gemini Live Agent Challenge
          </p>
        </div>
      </footer>
    </div>
  );
}
