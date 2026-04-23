import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Briefcase, GraduationCap, MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { createJobMarkerIcon } from "@/lib/mapIcon";
import { SAUDI_CENTER, SAUDI_ZOOM } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PostJobDialog } from "@/components/PostJobDialog";
import "leaflet/dist/leaflet.css";

type Job = {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location_name: string;
  required_education: string | null;
  required_field: string | null;
  required_experience: string | null;
  required_skills: string[] | null;
  required_languages: string[] | null;
  employer?: { full_name: string | null; company_name: string | null } | null;
};

const MapClickHandler = ({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const markerIcon = useMemo(() => createJobMarkerIcon(), []);
  const mapRef = useRef<L.Map | null>(null);

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id, employer_id, title, description, latitude, longitude, location_name,
        required_education, required_field, required_experience, required_skills, required_languages,
        employer:profiles!jobs_employer_id_fkey ( full_name, company_name )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    setJobs((data as unknown as Job[]) ?? []);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.location_name.toLowerCase().includes(q) ||
        (j.required_field ?? "").toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const handleApply = async (job: Job) => {
    if (!user || !profile) {
      toast.info("سجّل دخولك أولاً للتقدّم على الوظيفة");
      navigate("/auth");
      return;
    }
    if (profile.role !== "job_seeker") {
      toast.error("التقديم متاح للباحثين عن عمل فقط");
      return;
    }
    if (!profile.cv_url) {
      toast.info("يرجى إكمال ملفك الشخصي ورفع السيرة الذاتية أولاً");
      navigate("/profile");
      return;
    }

    const { error } = await supabase
      .from("applications")
      .insert({ job_id: job.id, applicant_id: user.id });

    if (error) {
      if (error.code === "23505") {
        toast.error("لقد تقدّمت على هذه الوظيفة سابقاً");
      } else {
        toast.error("تعذّر التقديم: " + error.message);
      }
      return;
    }
    toast.success("تم إرسال طلبك بنجاح! سيظهر اسمك ضمن المتقدّمين.");
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (profile?.role === "employer") {
      setPendingLocation({ lat, lng });
      setPostOpen(true);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Navbar />

      {/* Search bar */}
      <div className="absolute top-24 inset-x-0 z-[999] pointer-events-none">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن وظيفة، مدينة، أو مجال..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-12 h-12 bg-card/95 backdrop-blur-md border-border shadow-elegant rounded-xl text-base"
              />
              {filtered.length > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary border-0"
                >
                  {filtered.length} وظيفة
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hint for employers */}
      {profile?.role === "employer" && (
        <div className="absolute bottom-6 inset-x-0 z-[999] pointer-events-none">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto pointer-events-auto bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-elegant px-4 py-3 text-center text-sm">
              <span className="font-semibold text-primary">💡 نصيحة:</span>{" "}
              اضغط على أي نقطة في الخريطة لنشر وظيفة هناك
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={SAUDI_CENTER}
        zoom={SAUDI_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
        ref={(map) => {
          if (map) mapRef.current = map;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />

        {filtered.map((job) => (
          <Marker
            key={job.id}
            position={[job.latitude, job.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <div className="p-4 font-sans" dir="rtl">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-foreground leading-tight m-0">
                      {job.title}
                    </h3>
                    <p className="text-xs text-muted-foreground m-0 mt-0.5">
                      {job.employer?.company_name || job.employer?.full_name || "صاحب عمل"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>{job.location_name}</span>
                </div>

                <p className="text-xs text-foreground/80 line-clamp-2 mb-3 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {job.required_education && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {job.required_education}
                    </Badge>
                  )}
                  {job.required_experience && (
                    <Badge variant="secondary" className="text-[10px]">
                      {job.required_experience}
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={() => handleApply(job)}
                  size="sm"
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  تقدّم الآن
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <PostJobDialog
        open={postOpen}
        onOpenChange={(o) => {
          setPostOpen(o);
          if (!o) setPendingLocation(null);
        }}
        location={pendingLocation}
        onPosted={() => {
          loadJobs();
          setPendingLocation(null);
        }}
      />
    </div>
  );
};

export default Index;
