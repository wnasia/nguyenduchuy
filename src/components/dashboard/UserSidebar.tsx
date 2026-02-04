import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import huyLogo from "@/assets/huy-logo.png";
import { cn } from "@/lib/utils";

interface UserSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuItems = [
  { id: "posts", title: "My Stories" },
  { id: "mining", title: "Content Mining" },
  { id: "gallery", title: "Image Gallery" },
  { id: "youtube", title: "YouTube Videos" },
];

const UserSidebar = ({ activeModule, onModuleChange }: UserSidebarProps) => {
  const { user } = useAuth();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border bg-sidebar w-64"
    >
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-all duration-200 group-hover:bg-primary/15">
              <img
                src={huyLogo}
                alt="Logo"
                className="h-7 w-7 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-sidebar-foreground tracking-tight transition-colors duration-200 group-hover:text-primary">
                  Dashboard
                </span>
              </div>
            )}
          </Link>
          {!isMobile && (
            <SidebarTrigger className="ml-auto opacity-70 hover:opacity-100 hover:bg-sidebar-accent rounded-md transition-all duration-200" />
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content - Text only, no icons */}
      <SidebarContent className="bg-sidebar px-3 py-4">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => {
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
                    !isActive && "text-sidebar-foreground/70 hover:bg-muted hover:text-foreground hover:translate-x-0.5",
                    // Active state - left border indicator + subtle bg
                    isActive && [
                      "bg-primary/10 text-primary font-medium",
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
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-4">
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-2 transition-all duration-200",
          "hover:bg-muted"
        )}>
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-border">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || "User"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default UserSidebar;
