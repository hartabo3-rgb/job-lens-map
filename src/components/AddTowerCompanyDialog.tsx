import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Building2, Upload } from "lucide-react";

type Tower = {
  id: string;
  tower_name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tower: Tower | null;
  onSaved: () => void;
};

export const AddTowerCompanyDialog = ({ open, onOpenChange, tower, onSaved }: Props) => {
  const { user, profile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [recruitmentEmail, setRecruitmentEmail] = useState("");
  const [recruitmentUrl, setRecruitmentUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && !companyName && profile?.company_name) {
      setCompanyName(profile.company_name);
    }
    if (!open) {
      setCompanyName("");
      setDescription("");
      setContactEmail("");
      setContactPhone("");
      setRecruitmentEmail("");
      setRecruitmentUrl("");
      setLogoFile(null);
    }
  }, [open, profile?.company_name]); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadLogo = async () => {
    if (!user || !logoFile) return null;
    const extension = logoFile.name.split(".").pop() || "png";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, logoFile, {
      upsert: false,
      contentType: logoFile.type,
    });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    if (!user || !tower) return;
    if (!companyName.trim()) {
      toast.error("اسم الشركة مطلوب");
      return;
    }

    setSubmitting(true);
    try {
      const logoPath = await uploadLogo();
      const { error } = await supabase.from("tower_companies" as any).insert({
        tower_id: tower.id,
        employer_id: user.id,
        company_name: companyName.trim(),
        description: description.trim() || null,
        logo_url: logoPath,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        recruitment_email: recruitmentEmail.trim() || null,
        recruitment_url: recruitmentUrl.trim() || null,
      });
      if (error) throw error;
      toast.success("تمت إضافة الشركة داخل البرج بنجاح");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error("تعذّر حفظ الشركة: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-success" />
            إضافة شركة داخل {tower?.tower_name || "البرج"}
          </DialogTitle>
          <DialogDescription>تظهر أسماء الشركات مرتبة داخل البرج، وتظهر التفاصيل عند الضغط على اسم الشركة.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>اسم الشركة *</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="مثال: شركة المستقبل للتقنية" />
          </div>

          <div className="space-y-2">
            <Label>شعار الشركة</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground hover:bg-muted">
              <Upload className="w-4 h-4" />
              {logoFile ? logoFile.name : "اختر صورة الشعار"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className="space-y-2">
            <Label>وصف مختصر</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="نبذة قصيرة عن الشركة ومجال عملها..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>بريد التواصل</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@example.com" />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+966 5x xxx xxxx" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>بريد التوظيف</Label>
            <Input type="email" value={recruitmentEmail} onChange={(e) => setRecruitmentEmail(e.target.value)} placeholder="careers@example.com" />
          </div>

          <div className="space-y-2">
            <Label>رابط التوظيف</Label>
            <Input value={recruitmentUrl} onChange={(e) => setRecruitmentUrl(e.target.value)} placeholder="https://example.com/careers" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-primary hover:opacity-90">
            {submitting ? "جارٍ الحفظ..." : "حفظ الشركة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};