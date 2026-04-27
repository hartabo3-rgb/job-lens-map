import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Warehouse } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: { lat: number; lng: number } | null;
  onSaved: () => void;
};

export const AddCommercialTowerDialog = ({
  open,
  onOpenChange,
  location,
  onSaved,
}: Props) => {
  const { user, isAdmin } = useAuth();
  const [towerName, setTowerName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && location) {
      setLocationName(`${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`);
    }
    if (!open) {
      setTowerName("");
      setLocationName("");
      setDescription("");
    }
  }, [open, location]);

  const handleSubmit = async () => {
    if (!user || !location) return;
    if (!isAdmin) {
      toast.error("إضافة الأبراج متاحة لحساب المدير فقط");
      return;
    }
    if (!towerName.trim() || !locationName.trim()) {
      toast.error("اسم البرج واسم الموقع مطلوبان");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("commercial_towers").insert({
      employer_id: user.id,
      tower_name: towerName.trim(),
      location_name: locationName.trim(),
      description: description.trim() || null,
      companies: [],
      latitude: location.lat,
      longitude: location.lng,
    } as any);
    setSubmitting(false);

    if (error) {
      toast.error("تعذّر حفظ البرج: " + error.message);
      return;
    }

    toast.success("تم إضافة البرج التجاري بنجاح!");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-warning" />
            إضافة برج تجاري
          </DialogTitle>
          <DialogDescription>
            إضافة موقع البرج متاحة للمدير فقط، ويمكن لأصحاب العمل إضافة شركاتهم بعد الضغط على البرج.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>اسم البرج *</Label>
            <Input
              value={towerName}
              onChange={(e) => setTowerName(e.target.value)}
              placeholder="مثال: برج المملكة"
            />
          </div>

          <div className="space-y-2">
            <Label>اسم الموقع *</Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="مثال: الرياض - العليا"
            />
          </div>

          <div className="space-y-2">
            <Label>وصف مختصر</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="معلومات مختصرة عن البرج أو المجموعة..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "جارٍ الحفظ..." : "حفظ البرج"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
