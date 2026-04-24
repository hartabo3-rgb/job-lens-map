import { useEffect, useMemo, useRef, useState } from "react";
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  Briefcase,
  Building2,
  GraduationCap,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Search,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { createMarkerIcon } from "@/lib/mapIcon";
import { SAUDI_CENTER, SAUDI_ZOOM } from "@/lib/constants";
import { isInsideSaudiArabia } from "@/lib/geoUtils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PostJobDialog } from "@/components/PostJobDialog";
import { AddCompanyLocationDialog } from "@/components/AddCompanyLocationDialog";
import { SaudiOverlay } from "@/components/SaudiOverlay";
import "leaflet/dist/leaflet.css";

type Job = {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location_name: string;
  is_government: boolean;
  required_education: string | null;
  required_field: string | null;
  required_experience: string | null;
  required_skills: string[] | null;
  required_languages: string[] | null;
  employer?: { full_name: string | null; company_name: string | null } | null;
};

type CompanyLocation = {
  id: string;
  employer_id: string;
  company_name: string;
  description: string | null;
  location_name: string;
  latitude: number;
  longitude: number;
  contact_email: string | null;
  contact_phone: string | null;
  recruitment_email: string | null;
  recruitment_url: string | null;
};

type ClickMode = "none" | "post_job" | "add_company";

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
  const [companies, setCompanies] = useState<CompanyLocation[]>([]);
  const [search, setSearch] = useState("");
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [clickMode, setClickMode] = useState<ClickMode>("none");
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const jobIcon = useMemo(() => createMarkerIcon("job"), []);
  const govIcon = useMemo(() => createMarkerIcon("gov_job"), []);
  const companyIcon = useMemo(() => createMarkerIcon("company"), []);
  const mapRef = useRef<L.Map | null>(null);

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id, employer_id, title, description, latitude, longitude, location_name, is_government,
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

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from("company_locations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setCompanies((data as unknown as CompanyLocation[]) ?? []);
  };

  useEffect(() => {
    loadJobs();
    loadCompanies();
  }, []);

  // Auto-enable post_job mode for employers when nothing else is active
  useEffect(() => {
    if (profile?.role === "employer" && clickMode === "none") {
      setClickMode("post_job");
    }
    if (profile?.role !== "employer" && clickMode !== "none") {
      setClickMode("none");
    }
  }, [profile?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.location_name.toLowerCase().includes(q) ||
        (j.required_field ?? "").toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        c.location_name.toLowerCase().includes(q)
    );
  }, [companies, search]);

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
    if (profile?.role !== "employer" || clickMode === "none") return;

    if (!isInsideSaudiArabia(lat, lng)) {
      toast.error("الموقع يجب أن يكون داخل حدود المملكة العربية السعودية");
      return;
    }

    setPendingLocation({ lat, lng });
    if (clickMode === "post_job") {
      setPostJobOpen(true);
    } else if (clickMode === "add_company") {
      setAddCompanyOpen(true);
    }
  };

  const startAddCompanyFlow = () => {
    setClickMode("add_company");
    toast.info("اضغط على الخريطة داخل السعودية لتحديد موقع الشركة");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Navbar onAddCompanyLocation={startAddCompanyFlow} />

      {/* Search bar */}
      <div className="absolute top-24 inset-x-0 z-[999] pointer-events-none">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن وظيفة، شركة، مدينة، أو مجال..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-12 h-12 bg-card/95 backdrop-blur-md border-border shadow-elegant rounded-xl text-base"
              />
              {(filteredJobs.length > 0 || filteredCompanies.length > 0) && (
                <Badge
                  variant="secondary"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary border-0"
                >
                  {filteredJobs.length} وظيفة · {filteredCompanies.length} شركة
                </Badge>
              )}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge className="bg-card/95 backdrop-blur-md text-foreground border border-border gap-1.5 hover:bg-card">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                وظيفة
              </Badge>
              <Badge className="bg-card/95 backdrop-blur-md text-foreground border border-border gap-1.5 hover:bg-card">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                وظيفة حكومية
              </Badge>
              <Badge className="bg-card/95 backdrop-blur-md text-foreground border border-border gap-1.5 hover:bg-card">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                موقع شركة
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Hint for employers */}
      {profile?.role === "employer" && clickMode !== "none" && (
        <div className="absolute bottom-6 inset-x-0 z-[999] pointer-events-none">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto pointer-events-auto bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-elegant px-4 py-3 text-center text-sm flex items-center justify-between gap-3">
              <div className="text-right">
                <span className="font-semibold text-primary">💡 </span>
                {clickMode === "post_job"
                  ? "اضغط على أي نقطة داخل السعودية لنشر وظيفة"
                  : "اضغط على أي نقطة داخل السعودية لتحديد موقع الشركة"}
              </div>
              {clickMode === "add_company" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setClickMode("post_job")}
                >
                  إلغاء
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={SAUDI_CENTER}
        zoom={SAUDI_ZOOM}
        scrollWheelZoom
        worldCopyJump={false}
        className="h-full w-full"
        ref={(map) => {
          if (map) mapRef.current = map;
        }}
      >
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="خريطة عادية">
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="قمر صناعي">
            <TileLayer
              attribution='&copy; Google Satellite'
              url="https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="هجين (قمر + أسماء)">
            <TileLayer
              attribution='&copy; Google Hybrid'
              url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <SaudiOverlay />

        <MapClickHandler onMapClick={handleMapClick} />

        {/* Job markers */}
        {filteredJobs.map((job) => (
          <Marker
            key={`job-${job.id}`}
            position={[job.latitude, job.longitude]}
            icon={job.is_government ? govIcon : jobIcon}
          >
            <Popup>
              <div className="p-4 font-sans" dir="rtl">
                <div className="flex items-start gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      job.is_government
                        ? "bg-gradient-to-br from-red-600 to-red-500"
                        : "bg-gradient-primary"
                    }`}
                  >
                    {job.is_government ? (
                      <Landmark className="w-4 h-4 text-white" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-bold text-base text-foreground leading-tight m-0">
                        {job.title}
                      </h3>
                      {job.is_government && (
                        <Badge className="bg-red-600/10 text-red-700 border-0 text-[10px] px-1.5 py-0">
                          حكومية
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground m-0">
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
                  className={`w-full ${
                    job.is_government
                      ? "bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90"
                      : "bg-gradient-primary hover:opacity-90"
                  }`}
                >
                  تقدّم الآن
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Company location markers */}
        {filteredCompanies.map((c) => (
          <Marker
            key={`company-${c.id}`}
            position={[c.latitude, c.longitude]}
            icon={companyIcon}
          >
            <Popup>
              <div className="p-4 font-sans" dir="rtl">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-foreground leading-tight m-0">
                      {c.company_name}
                    </h3>
                    <p className="text-xs text-emerald-700 m-0 mt-0.5">موقع شركة</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>{c.location_name}</span>
                </div>

                {c.description && (
                  <p className="text-xs text-foreground/80 line-clamp-3 mb-3 leading-relaxed">
                    {c.description}
                  </p>
                )}

                <div className="space-y-1 mb-3">
                  {c.contact_email && (
                    <a
                      href={`mailto:${c.contact_email}`}
                      className="flex items-center gap-1.5 text-xs text-foreground/80 hover:text-primary"
                    >
                      <Mail className="w-3 h-3" /> {c.contact_email}
                    </a>
                  )}
                  {c.contact_phone && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                      <Phone className="w-3 h-3" /> {c.contact_phone}
                    </div>
                  )}
                </div>

                {(c.recruitment_email || c.recruitment_url) && (
                  <div className="flex flex-col gap-1.5">
                    {c.recruitment_url && (
                      <Button
                        asChild
                        size="sm"
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90"
                      >
                        <a
                          href={c.recruitment_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="w-3 h-3 ml-1" />
                          صفحة التوظيف
                        </a>
                      </Button>
                    )}
                    {c.recruitment_email && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <a href={`mailto:${c.recruitment_email}`}>
                          <Mail className="w-3 h-3 ml-1" />
                          {c.recruitment_email}
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <PostJobDialog
        open={postJobOpen}
        onOpenChange={(o) => {
          setPostJobOpen(o);
          if (!o) setPendingLocation(null);
        }}
        location={pendingLocation}
        onPosted={() => {
          loadJobs();
          setPendingLocation(null);
        }}
      />

      <AddCompanyLocationDialog
        open={addCompanyOpen}
        onOpenChange={(o) => {
          setAddCompanyOpen(o);
          if (!o) {
            setPendingLocation(null);
            setClickMode("post_job");
          }
        }}
        location={pendingLocation}
        onSaved={() => {
          loadCompanies();
          setPendingLocation(null);
          setClickMode("post_job");
        }}
      />
    </div>
  );
};

export default Index;
