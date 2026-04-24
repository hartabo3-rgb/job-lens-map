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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EDUCATION_LEVELS, EXPERIENCE_RANGES, LANGUAGES } from "@/lib/constants";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  location: { lat: number; lng: number } | null;
  onPosted: () => void;
};

export const PostJobDialog = ({ open, onOpenChange, location, onPosted }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [education, setEducation] = useState<string>("");
  const [field, setField] = useState("");
  const [experience, setExperience] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [langs, setLangs] = useState<string[]>([]);
  const [isGovernment, setIsGovernment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && location) {
      // Reverse-geocode-like fallback
      setLocationName(
        `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`
      );
    }
    if (!open) {
      setTitle("");
      setDescription("");
      setLocationName("");
      setEducation("");
      setField("");
      setExperience("");
      setSkills([]);
      setSkillInput("");
      setLangs([]);
      setIsGovernment(false);
    }
  }, [open, location]);

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

  const handleSubmit = async () => {
    if (!user || !location) return;
    if (!title.trim() || !description.trim() || !locationName.trim()) {
      toast.error("يرجى تعبئة الحقول الأساسية");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("jobs").insert({
      employer_id: user.id,
      title: title.trim(),
      description: description.trim(),
      latitude: location.lat,
      longitude: location.lng,
      location_name: locationName.trim(),
      required_education: (education || null) as any,
      required_field: field.trim() || null,
      required_experience: (experience || null) as any,
      required_skills: skills,
      required_languages: langs,
      is_government: isGovernment,
    });
    setSubmitting(false);

    if (error) {
      toast.error("تعذّر نشر الوظيفة: " + error.message);
      return;
    }
    toast.success("تم نشر الوظيفة بنجاح!");
    onPosted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>نشر وظيفة جديدة</DialogTitle>
          <DialogDescription>
            ستُعرض هذه الوظيفة على الخريطة في الموقع المحدد
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>اسم الوظيفة *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مهندس برمجيات Backend"
            />
          </div>

          <div className="space-y-2">
            <Label>وصف الوظيفة *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً واضحاً للمهام والمسؤوليات..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>اسم الموقع *</Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="مثال: الرياض - حي العليا"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>المؤهل المطلوب</Label>
              <Select value={education} onValueChange={setEducation}>
                <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>سنوات الخبرة</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_RANGES.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>مجال الخبرة المطلوب</Label>
            <Input
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="مثال: تقنية المعلومات، المحاسبة..."
            />
          </div>

          <div className="space-y-2">
            <Label>المهارات المطلوبة</Label>
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
              <Button type="button" variant="secondary" onClick={addSkill}>
                إضافة
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
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
            <Label>اللغات المطلوبة</Label>
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-primary hover:opacity-90"
          >
            {submitting ? "جارٍ النشر..." : "نشر الوظيفة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
