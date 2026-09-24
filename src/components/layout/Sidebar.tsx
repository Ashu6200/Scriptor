"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  type DocumentTreeItem,
  useCreateDocumentMutation,
  useGetDocumentTreeQuery,
} from "@/features/document/api";
import {
  type Workspace,
  useCreateWorkspaceMutation,
  useGetPinnedWorkspacesQuery,
  useTogglePinWorkspaceApiMutation,
} from "@/features/workspace/api";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  FileText,
  FolderOpen,
  Hash,
  LayoutDashboard,
  Loader2,
  Pin,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { BottomDrawer } from "../ui/bottom-drawer";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SidebarItemProps {
  name: string;
  href: string;
  icon?: React.ElementType;
  children?: SidebarItemProps[];
}

const topNavItems: SidebarItemProps[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const bottomNavItems: SidebarItemProps[] = [
  { name: "Workspaces", href: "/dashboard/workspaces", icon: Building2 },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Audit Log", href: "/dashboard/audit", icon: Shield },
  { name: "Privacy & Consents", href: "/dashboard/consents", icon: ShieldCheck },
  { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function NavItem({ item }: { item: SidebarItemProps }) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) ||
    Boolean(item.children && pathname.startsWith(item.href));
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const [prevPathname, setPrevPathname] = React.useState(pathname);
  const [isOpen, setIsOpen] = React.useState(() =>
    Boolean(item.children && pathname.startsWith(item.href))
  );

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (item.children && pathname.startsWith(item.href)) {
      setIsOpen(true);
    }
  }

  if (hasChildren && isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton tooltip={item.name} isActive={isActive} />}
          >
            {Icon ? <Icon /> : <Hash />}
            {!isCollapsed && <span>{item.name}</span>}
            {!isCollapsed && <ChevronRight className="ml-auto" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
              {item.name}
            </div>
            {item.children?.map((child) => (
              <DropdownMenuItem key={child.name} render={<Link href={child.href} />}>
                <span
                  className={cn(
                    pathname === child.href && "text-xs font-semibold text-primary",
                    "text-xs"
                  )}
                >
                  {child.name}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger
            render={<SidebarMenuButton tooltip={item.name} isActive={isActive} />}
          >
            {Icon ? <Icon /> : <Hash />}
            {!isCollapsed && <span>{item.name}</span>}
            {!isCollapsed && (
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children?.map((child) => (
                <SidebarMenuSubItem key={child.name}>
                  <SidebarMenuSubButton
                    render={<Link href={child.href} />}
                    isActive={pathname === child.href}
                  >
                    <span className="text-xs font-semibold">{child.name}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={pathname === item.href}
        tooltip={item.name}
      >
        {Icon ? <Icon /> : <Hash />}
        {!isCollapsed && <span className="text-xs font-semibold">{item.name}</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DocTreeItem({
  item,
  workspaceId,
  depth = 0,
}: {
  item: DocumentTreeItem;
  workspaceId: string;
  depth?: number;
}) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const isActive = pathname === `/dashboard/documents/${item.id}`;
  return (
    <>
      <SidebarMenuItem>
        <div className="group/docitem relative">
          <SidebarMenuButton
            render={<Link href={`/dashboard/documents/${item.id}`} />}
            isActive={isActive}
            tooltip={item.title}
            style={isCollapsed ? undefined : { paddingLeft: `${0.5 + depth * 0.875}rem` }}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            {!isCollapsed && <span className="truncate text-xs">{item.title}</span>}
          </SidebarMenuButton>
        </div>
      </SidebarMenuItem>
      {!isCollapsed &&
        item.children?.map((child) => (
          <DocTreeItem key={child.id} item={child} workspaceId={workspaceId} depth={depth + 1} />
        ))}
    </>
  );
}

function WorkspaceTreeSection({
  workspace,
  isPinned = false,
  onTogglePin,
}: {
  workspace: Workspace;
  isPinned?: boolean;
  onTogglePin?: (id: string) => void;
}) {
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const { data: tree, isLoading } = useGetDocumentTreeQuery(
    { workspaceId: workspace.id, limit: 3 },
    { skip: isCollapsed }
  );
  const [createDoc] = useCreateDocumentMutation();

  const handleCreateDoc = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const doc = await createDoc({ workspaceId: workspace.id, title: "Untitled" }).unwrap();
      router.push(`/dashboard/documents/${doc.id}`);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; data?: { message?: string } };
      if (errorObj?.status === 402) {
        toast.error(
          errorObj.data?.message ||
            "Document limit reached. Upgrade to Pro for unlimited documents.",
          {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/dashboard/billing"),
            },
          }
        );
      } else {
        toast.error("Failed to create document");
      }
    }
  };

  return (
    <SidebarGroup>
      {!isCollapsed && (
        <div className="flex items-center justify-between pr-2">
          <SidebarGroupLabel className="flex-1 truncate">{workspace.name}</SidebarGroupLabel>
          <div className="flex items-center gap-1 pr-1">
            {onTogglePin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(workspace.id);
                }}
                title={isPinned ? "Unpin workspace" : "Pin workspace"}
                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted cursor-pointer"
              >
                <Pin
                  className={cn("h-3.5 w-3.5", isPinned && "fill-primary text-primary rotate-45")}
                />
              </button>
            )}
            <button
              type="button"
              onClick={handleCreateDoc}
              title="New document"
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {isLoading ? (
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {!isCollapsed && <span>Loading...</span>}
              </div>
            </SidebarMenuItem>
          ) : tree && tree.length > 0 ? (
            <>
              {tree.slice(0, 3).map((item) => (
                <DocTreeItem key={item.id} item={item} workspaceId={workspace.id} />
              ))}
              {!isCollapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/dashboard/documents" />}
                    tooltip="View all documents"
                    className="text-[10px] text-muted-foreground hover:text-primary"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>View all documents</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </>
          ) : (
            !isCollapsed && (
              <SidebarMenuItem>
                <div className="px-2 py-1 text-[10px] text-muted-foreground italic">
                  No documents
                </div>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function Sidebar() {
  const { data: session } = useSession();
  const { isMobile, open, setOpen, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const pathname = usePathname();
  const router = useRouter();
  const [createWorkspace] = useCreateWorkspaceMutation();
  const [showCreateWorkspace, setShowCreateWorkspace] = React.useState(false);
  const [workspaceName, setWorkspaceName] = React.useState("");
  const { data: pinnedWorkspaces = [] } = useGetPinnedWorkspacesQuery();
  const [togglePinApi] = useTogglePinWorkspaceApiMutation();

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  const autoCollapsedRef = React.useRef(pathname.startsWith("/dashboard/documents"));
  const prevPathnameRef = React.useRef(pathname);
  const openRef = React.useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
      return;
    }

    const isDocPage = pathname.startsWith("/dashboard/documents");
    const wasDocPage = prevPathnameRef.current.startsWith("/dashboard/documents");
    const isNavigating = pathname !== prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (isDocPage) {
      if (!wasDocPage || isNavigating) {
        if (openRef.current) {
          autoCollapsedRef.current = true;
          setOpen(false);
        }
      }
    } else if (wasDocPage && autoCollapsedRef.current) {
      autoCollapsedRef.current = false;
      setOpen(true);
    }
  }, [pathname, isMobile, setOpen]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    try {
      await createWorkspace({ name: workspaceName.trim() }).unwrap();
      toast.success(`Workspace "${workspaceName.trim()}" created.`);
    } catch {
      toast.error("Failed to create workspace.");
    }
    setWorkspaceName("");
    setShowCreateWorkspace(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const triggerSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true })
    );
  };

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <div className={cn("flex h-14 items-center px-4", isCollapsed && "px-0 justify-center")}>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 font-semibold tracking-tight px-2 flex-1 min-w-0",
              isCollapsed && "flex-none px-0 gap-0"
            )}
          >
            <div className="h-6 w-6 shrink-0 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shadow-xs">
              SC
            </div>
            {!isCollapsed && (
              <span className="text-sm font-semibold text-foreground truncate">Scriptor</span>
            )}
          </Link>
        </div>
        {!isCollapsed ? (
          <div className="px-3 pb-2">
            <button
              onClick={triggerSearch}
              className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:bg-muted/70 hover:text-foreground transition-all"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left truncate">Search...</span>
              <kbd className="pointer-events-none rounded border border-border bg-background px-1 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <button
              onClick={triggerSearch}
              title="Search"
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topNavItems.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {pinnedWorkspaces.length > 0 && (
          <>
            {!isCollapsed && (
              <SidebarGroupLabel className="px-4 text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                PINNED WORKSPACES
              </SidebarGroupLabel>
            )}
            {pinnedWorkspaces.map((ws) => (
              <WorkspaceTreeSection
                key={ws.id}
                workspace={ws}
                isPinned={true}
                onTogglePin={(id) => {
                  togglePinApi(id).catch(() => {});
                }}
              />
            ))}
          </>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setShowCreateWorkspace(true)}
                  tooltip="New Workspace"
                  className="text-[10px] text-muted-foreground hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {!isCollapsed && <span>New Workspace</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(session?.user as { platformRole?: string })?.platformRole === "ADMIN" && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="px-4 text-rose-500/80 dark:text-rose-400/80 font-mono text-[10px] tracking-wider">
                PLATFORM CONTROL
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItem item={{ name: "Overview", href: "/admin", icon: BarChart3 }} />
                <NavItem item={{ name: "Users", href: "/admin/users", icon: Users }} />
                <NavItem
                  item={{ name: "Workspaces", href: "/admin/workspaces", icon: Building2 }}
                />
                <NavItem item={{ name: "Settings", href: "/admin/settings", icon: Settings }} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex items-center gap-2 rounded-md hover:bg-muted transition-colors outline-none",
                isCollapsed ? "p-1 flex-none" : "flex-1 min-w-0 px-2 py-1.5 text-left"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User"} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-foreground truncate">
                      {session?.user?.name ?? "User"}
                    </p>
                    <p className="text-[10px] text-primary font-mono truncate">
                      {session?.user?.email ?? ""}
                    </p>
                  </div>
                  <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground">
                {session?.user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isCollapsed && (
            <div>
              <ThemeToggle />
            </div>
          )}
        </div>
      </SidebarFooter>
      <button
        onClick={() => {
          if (pathname.startsWith("/dashboard/documents") && state === "collapsed") {
            autoCollapsedRef.current = false;
          }
          toggleSidebar();
        }}
        title={state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute right-0 top-13 z-50 translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background shadow-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
      >
        {state === "collapsed" ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      <BottomDrawer
        open={showCreateWorkspace}
        onOpenChange={setShowCreateWorkspace}
        title="Create Workspace"
        description="Create a new personal workspace."
        footer={
          <Button
            onClick={handleCreateWorkspace}
            disabled={!workspaceName.trim()}
            className="w-full"
          >
            Create Workspace
          </Button>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input
            id="workspace-name"
            placeholder="My Workspace"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
          />
        </div>
      </BottomDrawer>
    </ShadcnSidebar>
  );
}
