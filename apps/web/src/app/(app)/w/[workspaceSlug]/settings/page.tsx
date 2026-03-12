import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage workspace configuration.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-6">
            <h2 className="text-sm font-semibold">Workspace details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>{workspace.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-mono text-xs">{workspace.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{workspace.category}</span>
              </div>
              {workspace.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="max-w-xs text-right">
                    {workspace.description}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
