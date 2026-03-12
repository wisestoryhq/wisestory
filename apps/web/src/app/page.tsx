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
import { BookOpen, Sparkles, Layers, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <Badge variant="secondary" className="mb-6">
            Creative Storytelling Platform
          </Badge>
          <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Transform knowledge
            <br />
            into{" "}
            <span className="text-primary">visual stories</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Connect your sources, let AI understand your content, and generate
            compelling multi-format stories — text, images, and more — all in one
            place.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg">
              Get started
              <ArrowRight className="ml-1" />
            </Button>
            <Button variant="outline" size="lg">
              Learn more
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-3xl tracking-tight mb-10">
          How it works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle>Connect sources</CardTitle>
              <CardDescription>
                Import from Google Drive, upload files, or paste text directly.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle>AI generation</CardTitle>
              <CardDescription>
                Gemini creates interleaved text and images from your knowledge
                base.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <CardTitle>Multi-format output</CardTitle>
              <CardDescription>
                Blog posts, social carousels, newsletters — all from a single
                campaign.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Component showcase */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-3xl tracking-tight mb-10">
          Design system preview
        </h2>

        <div className="space-y-8">
          {/* Buttons */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Buttons
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Badges
            </h3>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Inputs
            </h3>
            <div className="flex flex-wrap gap-3 max-w-md">
              <Input placeholder="Enter your workspace name..." />
              <Input placeholder="Search stories..." type="search" />
            </div>
          </div>

          {/* Skeletons */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Loading states
            </h3>
            <Card className="max-w-sm">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
