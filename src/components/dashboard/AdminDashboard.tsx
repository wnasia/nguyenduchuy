import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
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
import { useIsMobile } from "@/hooks/use-mobile";

const moduleConfig: Record<string, { title: string; component: React.ComponentType }> = {
  dashboard: { title: "Dashboard", component: AdminOverview },
  posts: { title: "Post Management", component: AdminPosts },
  media: { title: "Media Management", component: AdminGallery },
  banners: { title: "Banner Management", component: AdminBanners },
  videos: { title: "Video / YouTube", component: AdminYouTube },
  users: { title: "User Management", component: AdminUsers },
  roles: { title: "Roles & Permissions", component: AdminRoles },
  reports: { title: "Reports & Analytics", component: AdminReports },
  footer: { title: "Footer Management", component: AdminFooterSettings },
  settings: { title: "System Settings", component: AdminSystemSettings },
};

const AdminDashboard = () => {
  const [activeModule, setActiveModule] = useState("dashboard");
  const isMobile = useIsMobile();

  const currentModule = moduleConfig[activeModule] || moduleConfig.dashboard;
  const CurrentComponent = currentModule.component;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeModule={activeModule} onModuleChange={setActiveModule} />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveModule("dashboard");
                    }}
                  >
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm sm:text-base">
                    {currentModule.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Page Title */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {currentModule.title}
                </h1>
              </div>

              {/* Module Content */}
              <CurrentComponent />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
