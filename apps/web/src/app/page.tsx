import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Sparkles,
  Layers,
  ArrowRight,
  Zap,
} from "lucide-react";

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
            <a href="#components" className="transition-colors hover:text-foreground">Components</a>
          </nav>
          <Button size="sm">Get started</Button>
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
              <Button size="lg" className="gap-2">
                Start creating
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="lg">
                View demo
              </Button>
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

      {/* Component showcase */}
      <section id="components" className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="mb-12">
            <p className="text-sm font-medium text-primary">Design system</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Component library
            </h2>
          </div>

          <div className="grid gap-12">
            {/* Buttons */}
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <h3 className="text-sm font-medium">Buttons</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Actions & navigation</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <Separator />

            {/* Badges */}
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <h3 className="text-sm font-medium">Badges</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Status & labels</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>

            <Separator />

            {/* Inputs */}
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <h3 className="text-sm font-medium">Inputs</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Form controls</p>
              </div>
              <div className="flex flex-col gap-3 max-w-sm">
                <Input placeholder="Workspace name" />
                <Input placeholder="Search stories..." type="search" />
              </div>
            </div>

            <Separator />

            {/* Cards */}
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <h3 className="text-sm font-medium">Cards</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Content containers</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Brand Campaign</CardTitle>
                    <CardDescription>4 outputs generated</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Blog</Badge>
                      <Badge variant="secondary" className="text-xs">Social</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full rounded-md" />
                  </CardContent>
                </Card>
              </div>
            </div>
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
