import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SettingsForm } from "./settings-form";

type Params = { workspaceSlug: string };

export default async function SettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      name: true,
      slug: true,
      category: true,
      description: true,
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage workspace configuration.
          </p>
        </div>

        <SettingsForm
          workspaceSlug={workspaceSlug}
          workspace={{
            name: workspace.name,
            slug: workspace.slug,
            category: workspace.category,
            description: workspace.description,
          }}
        />
      </div>
    </div>
  );
}
