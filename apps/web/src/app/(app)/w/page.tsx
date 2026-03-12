import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function WorkspaceIndexPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Find the user's workspaces
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "desc" },
  });

  // No workspaces yet → onboarding
  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  // Has workspaces → redirect to the most recent one
  redirect(`/w/${memberships[0].workspace.slug}`);
}
