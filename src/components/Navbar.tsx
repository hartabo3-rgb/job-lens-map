import { Briefcase, MapPin, Building2, Warehouse, ShieldCheck, Megaphone, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavbarProps = {
  onAddCompanyLocation?: () => void;
  onAddCommercialTower?: () => void;
  announcements?: Array<{ id: string; title: string; body?: string | null; link_url?: string | null }>;
};

export const Navbar = ({ onAddCompanyLocation, onAddCommercialTower, announcements = [] }: NavbarProps = {}) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const initials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("")
    : "؟";

  return (
    <header className="absolute top-0 inset-x-0 z-[1000] pointer-events-none">
      <div className="container mx-auto px-4 py-4">
        <nav className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-elegant px-4 py-3 pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-base text-foreground leading-tight">
                  وظيفة ماب
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight">
                  منصة التوظيف الجغرافية
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
            {user && profile ? (
              <>
                {profile.role === "employer" && (
                  <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                    <Link to="/dashboard">
                      <Briefcase className="w-4 h-4 ml-1" />
                      لوحتي
                    </Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:bg-muted rounded-lg p-1 pl-3 transition-smooth">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium">
                        {profile.full_name || profile.email}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 z-[1200]">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
                      {profile.email}
                    </div>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <ShieldCheck className="w-4 h-4 ml-2 text-primary" />
                          لوحة الإدارة
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {profile.role === "job_seeker" ? (
                      <DropdownMenuItem asChild>
                        <Link to="/profile">تعديل الملف الشخصي</Link>
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard">لوحة الوظائف</Link>
                        </DropdownMenuItem>
                        {onAddCompanyLocation && (
                          <DropdownMenuItem
                            onClick={onAddCompanyLocation}
                            className="cursor-pointer"
                          >
                            <Building2 className="w-4 h-4 ml-2 text-success" />
                            إضافة موقع شركة
                          </DropdownMenuItem>
                        )}
                        {isAdmin && onAddCommercialTower && (
                          <DropdownMenuItem
                            onClick={onAddCommercialTower}
                            className="cursor-pointer"
                          >
                            <Warehouse className="w-4 h-4 ml-2 text-warning" />
                            إضافة برج تجاري
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild size="sm" className="bg-gradient-primary hover:opacity-90 shadow-soft">
                <Link to="/auth" state={{ from: location.pathname }}>
                  تسجيل الدخول
                </Link>
              </Button>
            )}
            </div>
          </div>
          {announcements.length > 0 && (
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {announcements.slice(0, 3).map((item) => (
                <a key={item.id} href={item.link_url || undefined} target={item.link_url ? "_blank" : undefined} rel="noreferrer" className="group rounded-xl border border-border bg-background/70 px-3 py-2 text-right transition-smooth hover:bg-muted/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Megaphone className="h-3.5 w-3.5 text-primary" />
                    <span className="line-clamp-1 flex-1">{item.title}</span>
                    {item.link_url && <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />}
                  </div>
                  {item.body && <div className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{item.body}</div>}
                </a>
              ))}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
