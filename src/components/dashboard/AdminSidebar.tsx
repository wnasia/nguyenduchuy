import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
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
  ChevronLeft,
  PanelLeftClose,
  Menu,
} from "lucide-react";
import huyLogo from "@/assets/huy-logo.png";

interface AdminSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "System overview and metrics",
  },
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
    id: "videos",
    title: "Video / YouTube",
    icon: Video,
    description: "Video content management",
  },
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
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: BarChart3,
    description: "System reports and logs",
  },
  {
    id: "footer",
    title: "Footer Management",
    icon: FileText,
    description: "Footer content settings",
  },
  {
    id: "settings",
    title: "System Settings",
    icon: Settings,
    description: "Global configuration",
  },
];

const AdminSidebar = ({ activeModule, onModuleChange }: AdminSidebarProps) => {
  const { user, signOut } = useAuth();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between p-2">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={huyLogo}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
            {!isCollapsed && (
              <span className="font-semibold text-lg text-sidebar-foreground">
                Admin
              </span>
            )}
          </Link>
          {!isMobile && (
            <SidebarTrigger className="ml-auto" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeModule === item.id}
                    onClick={() => onModuleChange(item.id)}
                    tooltip={item.title}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-2">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.user_metadata?.full_name || "Admin"}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
