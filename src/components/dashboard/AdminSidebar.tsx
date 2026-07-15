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
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import huyLogo from "@/assets/huy-logo.png";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

// Text-only menu - no decorative icons
const menuSections = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", title: "Dashboard" },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "posts", title: "Posts" },
      { id: "topics", title: "Topics" },
      { id: "media", title: "Media" },
      { id: "moderation", title: "Image Moderation" },
      { id: "banners", title: "Banners" },
      { id: "videos", title: "Videos" },
    ],
  },
  {
    label: "Users",
    items: [
      { id: "users", title: "Users" },
      { id: "roles", title: "Roles" },
    ],
  },
  {
    label: "CRM",
    items: [
      { id: "customers", title: "Customers" },
      { id: "reminders", title: "Reminders" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "tokenomics", title: "Content Mining" },
      { id: "reports", title: "Analytics" },
      { id: "footer", title: "Footer" },
      { id: "settings", title: "Settings" },
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
      className="border-r-0 admin-sidebar"
    >
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-200 group-hover:bg-white/15">
              <img
                src={huyLogo}
                alt="Logo"
                className="h-6 w-6 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-base text-white tracking-tight">
                  Admin
                </span>
                <span className="text-[10px] text-white/50 font-medium uppercase tracking-widest">
                  Dashboard
                </span>
              </div>
            )}
          </Link>
          {!isMobile && !isCollapsed && (
            <SidebarTrigger className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200" />
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content - Text only, no decorative icons */}
      <SidebarContent className="px-3 py-4">
        {menuSections.map((section) => (
          <SidebarGroup key={section.label} className="py-2">
            {!isCollapsed && (
              <SidebarGroupLabel className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
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
                          "w-full h-11 px-4 rounded-lg transition-all duration-200",
                          "text-sm",
                          // Default state
                          !isActive && "text-white/60 hover:bg-white/10 hover:text-white hover:translate-x-0.5",
                          // Active state - left border indicator + subtle bg
                          isActive && [
                            "bg-white/10 text-white font-medium",
                            "border-l-2 border-primary",
                          ]
                        )}
                      >
                        {!isCollapsed && (
                          <span className="text-sm">
                            {item.title}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t border-white/10 p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-xl p-3 transition-all duration-200",
          "bg-white/5 hover:bg-white/10"
        )}>
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white/20">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary-foreground text-sm font-semibold">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.user_metadata?.full_name || "Administrator"}
              </p>
              <p className="text-xs text-white/50 truncate">
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
            "text-white/50 hover:text-red-400",
            "hover:bg-red-500/10",
            "rounded-xl",
            isCollapsed ? "h-10 w-10" : "justify-start h-10"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="ml-2 text-sm">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
