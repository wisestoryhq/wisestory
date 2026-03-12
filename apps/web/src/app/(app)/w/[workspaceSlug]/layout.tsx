import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { WorkspaceSidebar } from "./workspace-sidebar";

type Params = { workspaceSlug: string };

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    notFound();
  }

  return (
    <div className="flex h-screen bg-background">
      <WorkspaceSidebar
        workspace={{
          name: workspace.name,
          slug: workspace.slug,
          category: workspace.category,
        }}
        user={{
          name: session.user.name,
          image: session.user.image ?? undefined,
          role: workspace.members[0].role,
        }}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
