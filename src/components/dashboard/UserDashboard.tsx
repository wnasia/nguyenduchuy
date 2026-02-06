import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import UserSidebar from "./UserSidebar";
import UserPosts from "./UserPosts";
import UserGallery from "./UserGallery";
import UserYouTube from "./UserYouTube";
import UserProfile from "./UserProfile";
import UserNotifications from "./UserNotifications";
import UserMiningDashboard from "@/components/mining/UserMiningDashboard";
import { useIsMobile } from "@/hooks/use-mobile";

const moduleConfig: Record<string, { title: string; component: React.ComponentType }> = {
  posts: { title: "My Stories", component: UserPosts },
  mining: { title: "Content Mining", component: UserMiningDashboard },
  gallery: { title: "Image Gallery", component: UserGallery },
  youtube: { title: "YouTube Videos", component: UserYouTube },
  profile: { title: "Profile", component: UserProfile },
  notifications: { title: "Notifications", component: UserNotifications },
};

const UserDashboard = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState("posts");

  // Handle navigation state from navbar
  useEffect(() => {
    const state = location.state as { module?: string } | null;
    if (state?.module && moduleConfig[state.module]) {
      setActiveModule(state.module);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const CurrentComponent = moduleConfig[activeModule]?.component || UserPosts;
  const currentTitle = moduleConfig[activeModule]?.title || "My Stories";

  // Check if current module is profile or notifications (accessed from dropdown)
  const isDropdownModule = activeModule === "profile" || activeModule === "notifications";

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar
          activeModule={activeModule}
          onModuleChange={setActiveModule}
        />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
            {isMobile && <SidebarTrigger />}
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold border-b-2 border-primary/30 pb-1">
                {isDropdownModule ? currentTitle : "Overview"}
              </h1>
            </div>
          </header>

          {/* Main Content - flex-1 ensures it takes remaining space */}
          <main className="flex-1 p-4 md:p-6 pb-20">
            <CurrentComponent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
