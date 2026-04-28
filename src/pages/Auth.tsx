import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, MapPin, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    toast.success("مرحباً بعودتك!");
    navigate(from, { replace: true });
  };

  const handleSignUp = async () => {
    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("registered")
          ? "هذا البريد مسجّل مسبقاً"
          : error.message
      );
      return;
    }
    toast.success("تم إنشاء حسابك بنجاح!");
    if (role === "job_seeker") {
      navigate("/profile", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    localStorage.setItem("pending_auth_role", role);
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    setLoading(false);
    if (result.error) {
      toast.error("تعذّر تسجيل الدخول بواسطة Google");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold">وظيفتي على الخريطة</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <Card className="w-full max-w-md p-6 shadow-elegant border-border/60">
          <h1 className="text-2xl font-bold text-center mb-1">
            {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {mode === "signin"
              ? "أدخل بياناتك للوصول إلى حسابك"
              : "اختر دورك ثم أنشئ حسابك خلال دقيقة"}
          </p>

          <div className="mb-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("job_seeker")}
                className={`p-3 rounded-xl border-2 text-right transition-smooth ${
                  role === "job_seeker" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <UserIcon className="w-5 h-5 mb-1 text-primary" />
                <div className="font-semibold text-sm">باحث عن عمل</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("employer")}
                className={`p-3 rounded-xl border-2 text-right transition-smooth ${
                  role === "employer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <Briefcase className="w-5 h-5 mb-1 text-primary" />
                <div className="font-semibold text-sm">صاحب عمل</div>
              </button>
            </div>
            <Button onClick={handleGoogleSignIn} disabled={loading} variant="outline" className="w-full">
              الدخول بواسطة Google
            </Button>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid grid-cols-2 mb-5">
              <TabsTrigger value="signin">دخول</TabsTrigger>
              <TabsTrigger value="signup">حساب جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSignIn}
                disabled={loading || !email || !password}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label>أنا...</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("job_seeker")}
                    className={`p-3 rounded-xl border-2 text-right transition-smooth ${
                      role === "job_seeker"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <UserIcon className="w-5 h-5 mb-1 text-primary" />
                    <div className="font-semibold text-sm">باحث عن عمل</div>
                    <div className="text-xs text-muted-foreground">
                      أبحث عن فرصة وظيفية
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("employer")}
                    className={`p-3 rounded-xl border-2 text-right transition-smooth ${
                      role === "employer"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Briefcase className="w-5 h-5 mb-1 text-primary" />
                    <div className="font-semibold text-sm">صاحب عمل</div>
                    <div className="text-xs text-muted-foreground">
                      أبحث عن موظفين
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد أحمد"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                />
              </div>

              <Button
                onClick={handleSignUp}
                disabled={loading || !email || !password || !fullName}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
