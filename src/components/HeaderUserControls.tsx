import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  variant?: "light" | "dark"; // light = white text on dark bg (home), dark = standard tokens
}

const HeaderUserControls = ({ variant = "dark" }: Props) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = variant === "light";

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (!error && count !== null) setUnreadCount(count);
    };
    fetchUnreadCount();
    const channel = supabase
      .channel("notifications-count-hdr")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCount()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
  };
  const handleNavigateToModule = (module: string) => {
    navigate("/dashboard", { state: { module } });
  };
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className={`p-1.5 rounded-full transition-colors ${
          isLight
            ? "text-white/90 hover:text-white hover:bg-white/15"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
      ) : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`relative h-8 w-8 rounded-full p-0 ${
                isLight ? "ring-2 ring-white/40 hover:ring-white/70" : ""
              }`}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                <AvatarFallback className="text-[10px]">{getUserInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
              </Avatar>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
            <div className="px-3 py-2 border-b">
              <div className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="w-full">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigateToModule("profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigateToModule("notifications")}>
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] px-1.5 text-xs">{unreadCount}</Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link to="/login">
          <Button
            variant="ghost"
            className={`rounded-full h-8 px-4 text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all ${
              isLight
                ? "!bg-white !text-blue-600 hover:!bg-white hover:!text-blue-700 ring-1 ring-white/60"
                : "!bg-primary !text-primary-foreground hover:!bg-primary/90"
            }`}
          >
            Đăng nhập
          </Button>
        </Link>
      )}
    </div>
  );
};

export default HeaderUserControls;
