import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "job_seeker" | "employer";
  education: string | null;
  field: string | null;
  experience_years: string | null;
  skills: string[] | null;
  languages: string[] | null;
  cv_url: string | null;
  company_name: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const [{ data }, { data: roles }] = await Promise.all([
      supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
      supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "moderator"])
    ]);
    const nextProfile = (data as Profile) ?? null;
    const pendingRole = localStorage.getItem("pending_auth_role") as "job_seeker" | "employer" | null;
    if (pendingRole && nextProfile && nextProfile.role !== pendingRole) {
      const { error } = await supabase.from("profiles").update({ role: pendingRole }).eq("id", userId);
      if (!error) nextProfile.role = pendingRole;
      localStorage.removeItem("pending_auth_role");
    }
    setProfile(nextProfile);
    const roleList = ((roles as unknown as { role: string }[] | null) ?? []).map((item) => item.role);
    setIsAdmin(roleList.includes("admin"));
    setIsModerator(roleList.includes("moderator"));
  };

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsModerator(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchProfile(existing.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setIsModerator(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, isModerator, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
