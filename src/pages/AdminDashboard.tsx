import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2, CheckCircle2, Megaphone, ShieldCheck, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProfileRow = { id: string; email: string; full_name: string | null; role: string; company_name: string | null };
type JobRow = { id: string; title: string; location_name: string; employer_id: string; status: string };
type CompanyRow = { id: string; company_name: string; location_name?: string; is_verified: boolean };

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [towerCompanies, setTowerCompanies] = useState<CompanyRow[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [govTitle, setGovTitle] = useState("");
  const [govAgency, setGovAgency] = useState("");
  const [govUrl, setGovUrl] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  const loadData = async () => {
    const [profilesRes, jobsRes, companiesRes, towerCompaniesRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, role, company_name").order("created_at", { ascending: false }),
      supabase.from("jobs").select("id, title, location_name, employer_id, status").eq("status", "active").order("created_at", { ascending: false }).limit(50),
      supabase.from("company_locations").select("id, company_name, location_name, is_verified").order("created_at", { ascending: false }).limit(50),
      supabase.from("tower_companies" as any).select("id, company_name, is_verified").order("created_at", { ascending: false }).limit(50),
    ]);
    setProfiles((profilesRes.data as ProfileRow[]) ?? []);
    setJobs((jobsRes.data as JobRow[]) ?? []);
    setCompanies((companiesRes.data as CompanyRow[]) ?? []);
    setTowerCompanies((towerCompaniesRes.data as unknown as CompanyRow[]) ?? []);
  };

  useEffect(() => {
    if (user && isAdmin) loadData();
  }, [user, isAdmin]);

  const addModerator = async (profileId: string) => {
    const { error } = await supabase.from("user_roles" as any).insert({ user_id: profileId, role: "moderator" });
    if (error) return toast.error("تعذّر إضافة المشرف: " + error.message);
    toast.success("تمت إضافة المشرف");
  };

  const closeJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ status: "closed" }).eq("id", jobId);
    if (error) return toast.error("تعذّر حذف الوظيفة: " + error.message);
    toast.success("تم إخفاء الوظيفة من الخريطة");
    loadData();
  };

  const verifyCompany = async (table: "company_locations" | "tower_companies", id: string) => {
    const { error } = await supabase.from(table as any).update({ is_verified: true, verified_at: new Date().toISOString(), verified_by: user?.id }).eq("id", id);
    if (error) return toast.error("تعذّر توثيق الشركة: " + error.message);
    toast.success("تم توثيق الشركة");
    loadData();
  };

  const addAnnouncement = async () => {
    if (!announcementTitle.trim()) return toast.error("عنوان الإعلان مطلوب");
    const { error } = await supabase.from("site_announcements" as any).insert({ title: announcementTitle.trim(), body: announcementBody.trim() || null, created_by: user?.id });
    if (error) return toast.error("تعذّر إضافة الإعلان: " + error.message);
    toast.success("تمت إضافة إعلان الواجهة");
    setAnnouncementTitle("");
    setAnnouncementBody("");
  };

  const addGovernmentAnnouncement = async () => {
    if (!govTitle.trim() || !govAgency.trim()) return toast.error("عنوان الإعلان والجهة مطلوبان");
    const { error } = await supabase.from("government_job_announcements" as any).insert({ title: govTitle.trim(), agency_name: govAgency.trim(), application_url: govUrl.trim() || null, created_by: user?.id });
    if (error) return toast.error("تعذّر إضافة الإعلان الحكومي: " + error.message);
    toast.success("تمت إضافة إعلان الوظيفة الحكومية");
    setGovTitle("");
    setGovAgency("");
    setGovUrl("");
  };

  if (loading || !isAdmin) return <div className="min-h-screen flex items-center justify-center">جارٍ التحميل...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background pb-12">
      <Navbar />
      <main className="container mx-auto px-4 pt-28">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4"><ArrowLeft className="w-4 h-4 ml-1" />العودة للخريطة</Button>
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="w-6 h-6 text-primary" />لوحة الإدارة</h1>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4 shadow-soft"><h2 className="mb-3 flex items-center gap-2 font-bold"><Megaphone className="w-4 h-4 text-primary" />أهم إعلانات الوظائف</h2><div className="space-y-3"><Label>العنوان</Label><Input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} /><Label>النص</Label><Textarea value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} /><Button onClick={addAnnouncement} className="bg-gradient-primary">إضافة الإعلان</Button></div></Card>
          <Card className="p-4 shadow-soft"><h2 className="mb-3 flex items-center gap-2 font-bold"><Briefcase className="w-4 h-4 text-destructive" />إعلانات الوظائف الحكومية</h2><div className="space-y-3"><Label>المسمى</Label><Input value={govTitle} onChange={(e) => setGovTitle(e.target.value)} /><Label>الجهة</Label><Input value={govAgency} onChange={(e) => setGovAgency(e.target.value)} /><Label>رابط التقديم</Label><Input value={govUrl} onChange={(e) => setGovUrl(e.target.value)} /><Button onClick={addGovernmentAnnouncement} className="bg-gradient-primary">إضافة إعلان حكومي</Button></div></Card>
          <Card className="p-4 shadow-soft"><h2 className="mb-3 font-bold">إضافة مشرفين</h2><div className="space-y-2 max-h-80 overflow-auto">{profiles.map((p) => <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2"><div><div className="text-sm font-medium">{p.full_name || p.email}</div><div className="text-xs text-muted-foreground">{p.email}</div></div><Button size="sm" variant="outline" onClick={() => addModerator(p.id)}>مشرف</Button></div>)}</div></Card>
          <Card className="p-4 shadow-soft"><h2 className="mb-3 font-bold">حذف الوظائف الكاذبة</h2><div className="space-y-2 max-h-80 overflow-auto">{jobs.map((job) => <div key={job.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2"><div><div className="text-sm font-medium">{job.title}</div><div className="text-xs text-muted-foreground">{job.location_name}</div></div><Button size="sm" variant="destructive" onClick={() => closeJob(job.id)}><Trash2 className="w-4 h-4" /></Button></div>)}</div></Card>
          <Card className="p-4 shadow-soft lg:col-span-2"><h2 className="mb-3 flex items-center gap-2 font-bold"><Building2 className="w-4 h-4 text-primary" />توثيق حسابات الشركات</h2><div className="grid gap-2 md:grid-cols-2">{[...companies.map((c) => ({ ...c, table: "company_locations" as const })), ...towerCompanies.map((c) => ({ ...c, table: "tower_companies" as const }))].map((c) => <div key={`${c.table}-${c.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2"><div><div className="text-sm font-medium">{c.company_name}</div><div className="text-xs text-muted-foreground">{c.location_name || "داخل برج تجاري"}</div></div>{c.is_verified ? <Badge className="gap-1 bg-primary/10 text-primary"><CheckCircle2 className="w-3 h-3" />موثق</Badge> : <Button size="sm" onClick={() => verifyCompany(c.table, c.id)}>توثيق</Button>}</div>)}</div></Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;