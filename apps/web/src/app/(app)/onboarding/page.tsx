"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createWorkspace,
  type CreateWorkspaceInput,
} from "@/app/actions/workspace";
import {
  Zap,
  Newspaper,
  Shirt,
  CookingPot,
  Gamepad2,
  Monitor,
  HeartPulse,
  GraduationCap,
  Plane,
  Film,
  LayoutGrid,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const categories = [
  { value: "tech", label: "Tech", icon: Monitor },
  { value: "news", label: "News", icon: Newspaper },
  { value: "fashion", label: "Fashion", icon: Shirt },
  { value: "cooking", label: "Cooking", icon: CookingPot },
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "health", label: "Health", icon: HeartPulse },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "travel", label: "Travel", icon: Plane },
  { value: "entertainment", label: "Entertainment", icon: Film },
  { value: "other", label: "Other", icon: LayoutGrid },
] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const canContinue = step === 0 ? name.trim().length > 0 && category !== "" : true;

  function handleSubmit() {
    const input: CreateWorkspaceInput = {
      name: name.trim(),
      category,
      description: description.trim() || undefined,
    };
    startTransition(() => createWorkspace(input));
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / 2) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Step {step + 1} of 2
            </p>
          </div>

          {/* Step content */}
          <div className="relative">
            {/* Step 0: Name + Category */}
            {step === 0 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Create your workspace
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Give your workspace a name and choose a category.
                </p>

                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace name</Label>
                    <Input
                      id="workspace-name"
                      placeholder="Acme Inc."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Category</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {categories.map((cat) => {
                        const isSelected = category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setCategory(cat.value)}
                            className={`group flex flex-col items-center gap-2 rounded-lg border px-3 py-3.5 text-center transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                            }`}
                          >
                            <cat.icon
                              className={`h-4 w-4 transition-colors ${
                                isSelected
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-foreground"
                              }`}
                            />
                            <span className="text-xs font-medium">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    disabled={!canContinue}
                    onClick={() => setStep(1)}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 1: Description */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Describe your brand
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Help the AI understand your brand voice and style. You can
                  always update this later.
                </p>

                <div className="mt-8 space-y-2">
                  <Label htmlFor="description">
                    Brand description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="We're a modern tech company focused on developer tools. Our tone is professional but approachable, and we value clarity over jargon..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe your brand personality, tone of voice, target
                    audience, and any key themes.
                  </p>
                </div>

                <div className="mt-10 flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => setStep(0)}
                    disabled={isPending}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={handleSubmit}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create workspace"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
