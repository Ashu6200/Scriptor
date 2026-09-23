"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useGetUnreadCountQuery } from "@/features/notification/api";
import { signOut, useSession } from "@/lib/auth-client";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Topbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: unreadData } = useGetUnreadCountQuery();

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-md px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="w-full flex-1 md:flex md:justify-center">
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
              ctrlKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className="group relative flex h-9 w-full max-w-sm items-center gap-2.5 rounded-md border border-border bg-muted/40 px-3.5 text-xs text-muted-foreground shadow-2xs hover:border-primary/40 hover:bg-muted/70 hover:text-foreground active:scale-[0.99] transition-all duration-150"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
          <span className="flex-1 text-left font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-150 truncate">
            Search docs, workspaces, settings...
          </span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-semibold text-muted-foreground shadow-2xs group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-150">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>
      </div>
      <ThemeToggle />
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        render={<Link href="/dashboard/notifications" />}
      >
        <Bell className="h-5 w-5" />
        {(unreadData?.count ?? 0) > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        )}
        <span className="sr-only">Notifications</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="p-0">
            <Link href="/dashboard/settings" className="w-full px-1.5 py-1">
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="p-0">
            <Link href="/dashboard/settings" className="w-full px-1.5 py-1">
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
