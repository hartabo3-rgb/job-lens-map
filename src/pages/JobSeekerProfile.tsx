import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Upload, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EDUCATION_LEVELS, EXPERIENCE_RANGES, LANGUAGES } from "@/lib/constants";
import { toast } from "sonner";

const JobSeekerProfile = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [education, setEducation] = useState<string>("");
  const [field, setField] = useState("");
  const [experience, setExperience] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [langs, setLangs] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && profile && profile.role !== "job_seeker") navigate("/dashboard");
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setEducation(profile.education ?? "");
      setField(profile.field ?? "");
      setExperience(profile.experience_years ?? "");
      setSkills(profile.skills ?? []);
      setLangs(profile.languages ?? []);
      setCvUrl(profile.cv_url);
    }
  }, [profile]);

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillInput("");
  };

  const toggleLang = (l: string) => {
    setLangs((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName || !phone || !education || !field || !experience) {
      toast.error("يرجى تعبئة جميع الحقول الأساسية");
      return;
    }
    setSaving(true);

    let uploadedCvPath = cvUrl;
    if (cvFile) {
      const path = `${user.id}/${Date.now()}-${cvFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("cvs")
        .upload(path, cvFile, { upsert: true, contentType: "application/pdf" });
      if (upErr) {
        setSaving(false);
        toast.error("تعذّر رفع السيرة الذاتية: " + upErr.message);
        return;
      }
      uploadedCvPath = path;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        education: education as any,
        field,
        experience_years: experience as any,
        skills,
        languages: langs,
        cv_url: uploadedCvPath,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast.error("تعذّر الحفظ: " + error.message);
      return;
    }
    await refreshProfile();
    toast.success("تم حفظ بياناتك بنجاح!");
    setCvFile(null);
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">جارٍ التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background pb-12">
      <Navbar />

      <div className="container mx-auto px-4 pt-28">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 ml-1" />
          العودة للخريطة
        </Button>

        <Card className="max-w-2xl mx-auto p-6 shadow-elegant">
          <h1 className="text-2xl font-bold mb-1">ملفك الشخصي</h1>
          <p className="text-sm text-muted-foreground mb-6">
            أكمل بياناتك ليتمكن أصحاب العمل من تقييم تطابقك مع الوظائف بدقة
          </p>

          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم الكامل *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>رقم الجوال *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المؤهل الدراسي *</Label>
                <Select value={education} onValueChange={setEducation}>
                  <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>سنوات الخبرة *</Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_RANGES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>مجال الخبرة *</Label>
              <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="مثال: تقنية المعلومات" />
            </div>

            <div className="space-y-2">
              <Label>المهارات</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="أضف مهارة واضغط Enter"
                />
                <Button type="button" variant="secondary" onClick={addSkill}>إضافة</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button onClick={() => setSkills(skills.filter((x) => x !== s))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>اللغات</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Badge
                    key={l}
                    variant={langs.includes(l) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleLang(l)}
                  >
                    {l}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>السيرة الذاتية (PDF)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                {cvFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium">{cvFile.name}</span>
                    <button onClick={() => setCvFile(null)} className="text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : cvUrl ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>سيرة ذاتية مرفوعة بالفعل</span>
                    <label className="text-primary cursor-pointer underline">
                      تغيير
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm">اضغط لرفع سيرتك الذاتية</span>
                    <span className="text-xs text-muted-foreground">PDF فقط</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ بياناتي"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JobSeekerProfile;
