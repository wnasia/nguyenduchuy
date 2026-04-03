import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import AdminSidebar from "./AdminSidebar";
import AdminOverview from "./AdminOverview";
import AdminPosts from "./AdminPosts";
import AdminGallery from "./AdminGallery";
import AdminBanners from "./AdminBanners";
import AdminYouTube from "./AdminYouTube";
import AdminUsers from "./AdminUsers";
import AdminRoles from "./AdminRoles";
import AdminReports from "./AdminReports";
import AdminFooterSettings from "./AdminFooterSettings";
import AdminSystemSettings from "./AdminSystemSettings";
import AdminTokenomics from "./AdminTokenomics";
import AdminImageModeration from "./AdminImageModeration";
import AdminTopics from "./AdminTopics";
import AdminCustomers from "./AdminCustomers";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";

const moduleConfig: Record<string, { title: string; subtitle: string; component: React.ComponentType }> = {
  dashboard: { title: "Dashboard", subtitle: "Overview & metrics", component: AdminOverview },
  posts: { title: "Posts", subtitle: "Manage all content", component: AdminPosts },
  topics: { title: "Topics", subtitle: "Manage article topics", component: AdminTopics },
  media: { title: "Media", subtitle: "Images & assets", component: AdminGallery },
  moderation: { title: "Image Moderation", subtitle: "Approve/reject images", component: AdminImageModeration },
  banners: { title: "Banners", subtitle: "Homepage banners", component: AdminBanners },
  videos: { title: "Videos", subtitle: "YouTube content", component: AdminYouTube },
  users: { title: "Users", subtitle: "User management", component: AdminUsers },
  roles: { title: "Roles", subtitle: "Permissions & access", component: AdminRoles },
  tokenomics: { title: "Content Mining", subtitle: "Tokenomics & rewards", component: AdminTokenomics },
  reports: { title: "Analytics", subtitle: "Reports & logs", component: AdminReports },
  footer: { title: "Footer", subtitle: "Footer settings", component: AdminFooterSettings },
  settings: { title: "Settings", subtitle: "System configuration", component: AdminSystemSettings },
};

const AdminDashboard = () => {
  const [activeModule, setActiveModule] = useState("dashboard");
  const isMobile = useIsMobile();

  const currentModule = moduleConfig[activeModule] || moduleConfig.dashboard;
  const CurrentComponent = currentModule.component;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar activeModule={activeModule} onModuleChange={setActiveModule} />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Premium Header */}
          <header className={cn(
            "sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4",
            "bg-background/80 backdrop-blur-xl border-b border-border",
            "px-6"
          )}>
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" />
            <Separator orientation="vertical" className="h-6 bg-border" />
            
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold text-foreground leading-none">
                  {currentModule.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentModule.subtitle}
                </p>
              </div>
            </div>

            {/* Right side - can add notifications, search, etc. */}
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                System Online
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <CurrentComponent />
            </div>
          </main>

          {/* Footer inside SidebarInset so it respects sidebar width */}
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;