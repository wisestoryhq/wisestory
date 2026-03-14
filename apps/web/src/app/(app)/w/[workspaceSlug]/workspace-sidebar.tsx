"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  LayoutDashboard,
  FolderKanban,
  HardDrive,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

type WorkspaceSidebarProps = {
  workspace: {
    name: string;
    slug: string;
    category: string;
  };
  user: {
    name: string;
    image?: string;
    role: string;
  };
};

export function WorkspaceSidebar({ workspace, user }: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const base = `/w/${workspace.slug}`;

  const navItems = [
    { href: base, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `${base}/projects`, label: "Projects", icon: FolderKanban },
    { href: `${base}/sources`, label: "Sources", icon: HardDrive },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Workspace header */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Image
          src="/logo-icon.svg"
          alt="WiseStory"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {workspace.name}
          </p>
          <p className="text-[10px] capitalize text-muted-foreground">
            {workspace.category}
          </p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-primary/8 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User footer */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.image} />
          <AvatarFallback className="text-xs">
            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{user.name}</p>
          <p className="text-[10px] capitalize text-muted-foreground">
            {user.role}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/login";
                },
              },
            })
          }
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r md:block">
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed left-3 top-3 z-50 h-9 w-9 p-0 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-56 border-r bg-background md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
