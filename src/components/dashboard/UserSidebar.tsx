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
  Youtube,
  Wallet,
  LogOut,
  ChevronRight,
  PenSquare,
} from "lucide-react";
import huyLogo from "@/assets/huy-logo.png";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

interface UserSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuSections = [
  {
    label: "Overview",
    items: [
      {
        id: "overview",
        title: "Dashboard",
        icon: LayoutDashboard,
        description: "Account overview",
      },
    ],
  },
  {
    label: "My Content",
    items: [
      {
        id: "posts",
        title: "My Stories",
        icon: FileText,
        description: "Manage your stories",
      },
      {
        id: "gallery",
        title: "Image Gallery",
        icon: Image,
        description: "Your uploaded images",
      },
      {
        id: "youtube",
        title: "YouTube Videos",
        icon: Youtube,
        description: "Your video submissions",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        id: "wallet",
        title: "Wallet",
        icon: Wallet,
        description: "Earnings and balance",
      },
    ],
  },
];

const UserSidebar = ({ activeModule, onModuleChange }: UserSidebarProps) => {
  const { user, signOut } = useAuth();
  const { state, isMobile } = useSidebar();
  const { t } = useI18n();
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <img
                src={huyLogo}
                alt="Logo"
                className="h-6 w-6 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-sidebar-foreground tracking-tight">
                  User Dashboard
                </span>
                <span className="text-[10px] text-sidebar-foreground/60 font-medium uppercase tracking-wider">
                  Content Manager
                </span>
              </div>
            )}
          </Link>
          {!isMobile && (
            <SidebarTrigger className="ml-auto opacity-70 hover:opacity-100 transition-opacity" />
          )}
        </div>
      </SidebarHeader>

      {/* Quick Action */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <Link to="/submit">
          <Button 
            className={cn(
              "w-full gap-2 bg-gradient-to-r from-primary to-blue-600",
              isCollapsed && "px-0 justify-center"
            )}
            size={isCollapsed ? "icon" : "default"}
          >
            <PenSquare className="h-4 w-4" />
            {!isCollapsed && <span>Create Story</span>}
          </Button>
        </Link>
      </div>

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
              <SidebarMenu className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeModule === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => onModuleChange(item.id)}
                        tooltip={isCollapsed ? item.title : undefined}
                        className={cn(
                          "w-full h-10 px-3 rounded-lg transition-all duration-200",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive && [
                            "bg-primary text-primary-foreground",
                            "hover:bg-primary/90 hover:text-primary-foreground",
                            "shadow-sm",
                          ]
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-primary-foreground" : "text-sidebar-foreground/70"
                        )} />
                        {!isCollapsed && (
                          <>
                            <span className={cn(
                              "flex-1 truncate text-sm font-medium",
                              isActive ? "text-primary-foreground" : "text-sidebar-foreground"
                            )}>
                              {item.title}
                            </span>
                            {isActive && (
                              <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/70" />
                            )}
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
          "flex items-center gap-3 rounded-lg p-2 transition-colors",
          "hover:bg-sidebar-accent/50"
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
        
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          onClick={handleLogout}
          className={cn(
            "w-full mt-2 text-destructive/80 hover:text-destructive",
            "hover:bg-destructive/10 transition-colors",
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

export default UserSidebar;
