import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import UserSidebar from "./UserSidebar";
import UserOverview from "./UserOverview";
import UserPosts from "./UserPosts";
import UserWallet from "./UserWallet";
import UserGallery from "./UserGallery";
import UserYouTube from "./UserYouTube";
import { useIsMobile } from "@/hooks/use-mobile";

const moduleConfig: Record<string, { title: string; component: React.ComponentType }> = {
  overview: { title: "Dashboard Overview", component: UserOverview },
  posts: { title: "My Stories", component: UserPosts },
  gallery: { title: "Image Gallery", component: UserGallery },
  youtube: { title: "YouTube Videos", component: UserYouTube },
  wallet: { title: "Wallet", component: UserWallet },
};

const UserDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeModule, setActiveModule] = useState("overview");

  const CurrentComponent = moduleConfig[activeModule]?.component || UserOverview;
  const currentTitle = moduleConfig[activeModule]?.title || "Dashboard";

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar
          activeModule={activeModule}
          onModuleChange={setActiveModule}
        />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
            {isMobile && <SidebarTrigger />}
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{currentTitle}</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6">
            <CurrentComponent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
