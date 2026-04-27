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

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  location: { lat: number; lng: number } | null;
  onSaved: () => void;
};

export const AddCompanyLocationDialog = ({
  open,
  onOpenChange,
  location,
  onSaved,
}: Props) => {
  const { user, profile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [recruitmentEmail, setRecruitmentEmail] = useState("");
  const [recruitmentUrl, setRecruitmentUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && location) {
      setLocationName(`${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`);
      if (!companyName && profile?.company_name) {
        setCompanyName(profile.company_name);
      }
    }
    if (!open) {
      setCompanyName("");
      setDescription("");
      setLocationName("");
      setContactEmail("");
      setContactPhone("");
      setRecruitmentEmail("");
      setRecruitmentUrl("");
      setLogoFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, location]);

  const handleSubmit = async () => {
    if (!user || !location) return;
    if (!companyName.trim() || !locationName.trim()) {
      toast.error("اسم الشركة واسم الموقع مطلوبان");
      return;
    }
    setSubmitting(true);
    let logoPath: string | null = null;
    if (logoFile) {
      const extension = logoFile.name.split(".").pop() || "png";
      logoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("company-logos").upload(logoPath, logoFile, {
        upsert: false,
        contentType: logoFile.type,
      });
      if (uploadError) {
        setSubmitting(false);
        toast.error("تعذّر رفع الشعار: " + uploadError.message);
        return;
      }
    }
    const { error } = await supabase.from("company_locations").insert({
      employer_id: user.id,
      company_name: companyName.trim(),
      description: description.trim() || null,
      location_name: locationName.trim(),
      latitude: location.lat,
      longitude: location.lng,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      recruitment_email: recruitmentEmail.trim() || null,
      recruitment_url: recruitmentUrl.trim() || null,
      logo_url: logoPath,
    });
    setSubmitting(false);
    if (error) {
      toast.error("تعذّر حفظ الموقع: " + error.message);
      return;
    }
    toast.success("تم إضافة موقع الشركة بنجاح!");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-success" />
            إضافة موقع شركة
          </DialogTitle>
          <DialogDescription>
            سيظهر هذا الموقع على الخريطة بعلامة خضراء يمكن للجميع رؤيتها.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>اسم الشركة *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="مثال: شركة المستقبل للتقنية"
            />
          </div>

          <div className="space-y-2">
            <Label>وصف مختصر</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نبذة قصيرة عن الشركة ومجال عملها..."
              rows={3}
            />
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
            <Label>اسم الموقع *</Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="مثال: الرياض - حي الملك عبدالله"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>بريد التواصل</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="info@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+966 5x xxx xxxx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>بريد التوظيف</Label>
            <Input
              type="email"
              value={recruitmentEmail}
              onChange={(e) => setRecruitmentEmail(e.target.value)}
              placeholder="careers@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>رابط التوظيف</Label>
            <Input
              value={recruitmentUrl}
              onChange={(e) => setRecruitmentUrl(e.target.value)}
              placeholder="https://example.com/careers"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-primary hover:opacity-90"
          >
            {submitting ? "جارٍ الحفظ..." : "حفظ الموقع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
