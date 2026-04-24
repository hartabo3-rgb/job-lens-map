import { Briefcase, MapPin, Building2 } from "lucide-react";
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
};

export const Navbar = ({ onAddCompanyLocation }: NavbarProps = {}) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  const initials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("")
    : "؟";

  return (
    <header className="absolute top-0 inset-x-0 z-[1000] pointer-events-none">
      <div className="container mx-auto px-4 py-4">
        <nav className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-elegant px-4 py-3 flex items-center justify-between pointer-events-auto">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-base text-foreground leading-tight">
                وظيفتي على الخريطة
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
        </nav>
      </div>
    </header>
  );
};
