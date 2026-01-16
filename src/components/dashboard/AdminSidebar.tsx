import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Image,
  Video,
  Users,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  ImageIcon,
  FileCode,
  ChevronRight,
} from "lucide-react";
import huyLogo from "@/assets/huy-logo.png";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuSections = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        description: "System overview and metrics",
      },
    ],
  },
  {
    label: "Content Management",
    items: [
      {
        id: "posts",
        title: "Post Management",
        icon: FileText,
        description: "Manage all posts",
      },
      {
        id: "media",
        title: "Media Management",
        icon: Image,
        description: "Images and media assets",
      },
      {
        id: "banners",
        title: "Banner Management",
        icon: ImageIcon,
        description: "Homepage banners",
      },
      {
        id: "videos",
        title: "Video / YouTube",
        icon: Video,
        description: "Video content management",
      },
    ],
  },
  {
    label: "User & Access Control",
    items: [
      {
        id: "users",
        title: "User Management",
        icon: Users,
        description: "Manage user accounts",
      },
      {
        id: "roles",
        title: "Roles & Permissions",
        icon: Shield,
        description: "Access control settings",
      },
    ],
  },
  {
    label: "Analytics & Reports",
    items: [
      {
        id: "reports",
        title: "Reports & Analytics",
        icon: BarChart3,
        description: "System reports and logs",
      },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        id: "footer",
        title: "Footer Management",
        icon: FileCode,
        description: "Footer content settings",
      },
      {
        id: "settings",
        title: "System Settings",
        icon: Settings,
        description: "Global configuration",
      },
    ],
  },
];

const AdminSidebar = ({ activeModule, onModuleChange }: AdminSidebarProps) => {
  const { user, signOut } = useAuth();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border bg-sidebar"
    >
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between p-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-105">
              <img
                src={huyLogo}
                alt="Logo"
                className="h-6 w-6 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-sidebar-foreground tracking-tight group-hover:text-primary transition-colors">
                  Admin Panel
                </span>
                <span className="text-[10px] text-sidebar-foreground/60 font-medium uppercase tracking-wider">
                  Management System
                </span>
              </div>
            )}
          </Link>
          {!isMobile && (
            <SidebarTrigger className="ml-auto opacity-70 hover:opacity-100 hover:bg-sidebar-accent rounded-md transition-all duration-200" />
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="bg-sidebar px-2 py-3">
        {menuSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.label} className="py-1">
            {!isCollapsed && (
              <SidebarGroupLabel className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activeModule === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => onModuleChange(item.id)}
                        tooltip={isCollapsed ? item.title : undefined}
                        className={cn(
                          "w-full h-11 px-3 rounded-lg transition-all duration-200 group/menu-item",
                          // Default state
                          "text-sidebar-foreground/80",
                          // Hover state - more prominent
                          !isActive && [
                            "hover:bg-primary/10 hover:text-primary",
                            "hover:shadow-sm hover:translate-x-0.5",
                          ],
                          // Active state - strong visual distinction
                          isActive && [
                            "bg-gradient-to-r from-primary to-primary/90",
                            "text-primary-foreground font-medium",
                            "shadow-md shadow-primary/25",
                            "hover:from-primary/95 hover:to-primary/85",
                            "border-l-4 border-l-white/30",
                          ]
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-all duration-200",
                          isActive 
                            ? "text-primary-foreground" 
                            : "text-sidebar-foreground/60 group-hover/menu-item:text-primary group-hover/menu-item:scale-110"
                        )} />
                        {!isCollapsed && (
                          <>
                            <span className={cn(
                              "flex-1 truncate text-sm transition-all duration-200",
                              isActive 
                                ? "text-primary-foreground font-medium" 
                                : "text-sidebar-foreground/80 group-hover/menu-item:text-primary group-hover/menu-item:font-medium"
                            )}>
                              {item.title}
                            </span>
                            <ChevronRight className={cn(
                              "h-3.5 w-3.5 transition-all duration-200",
                              isActive 
                                ? "text-primary-foreground/80 opacity-100" 
                                : "opacity-0 group-hover/menu-item:opacity-60 group-hover/menu-item:translate-x-0.5"
                            )} />
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {sectionIndex < menuSections.length - 1 && !isCollapsed && (
              <Separator className="mt-3 bg-sidebar-border/50" />
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-2 transition-all duration-200 cursor-pointer",
          "hover:bg-primary/5 hover:shadow-sm"
        )}>
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-border transition-all duration-200 hover:ring-primary/50">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || "Administrator"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          onClick={handleLogout}
          className={cn(
            "w-full mt-2 transition-all duration-200",
            "text-destructive/70 hover:text-destructive",
            "hover:bg-destructive/10 hover:shadow-sm",
            "active:scale-[0.98]",
            isCollapsed ? "h-9 w-9" : "justify-start h-9"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="ml-2 text-sm font-medium">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
