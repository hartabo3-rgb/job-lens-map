import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Download, FileText, MapPin, Phone, Mail, Trophy } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Job = {
  id: string;
  title: string;
  location_name: string;
  status: "active" | "closed";
  created_at: string;
};

type Application = {
  id: string;
  match_score: number;
  applied_at: string;
  applicant: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    education: string | null;
    field: string | null;
    experience_years: string | null;
    skills: string[] | null;
    languages: string[] | null;
    cv_url: string | null;
  };
};

const EmployerDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && profile && profile.role !== "employer") navigate("/");
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("jobs")
      .select("id, title, location_name, status, created_at")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setJobs((data as Job[]) ?? []));
  }, [user]);

  useEffect(() => {
    if (!selectedJob) return;
    supabase
      .from("applications")
      .select(`
        id, match_score, applied_at,
        applicant:profiles!applications_applicant_id_fkey (
          id, full_name, email, phone, education, field, experience_years,
          skills, languages, cv_url
        )
      `)
      .eq("job_id", selectedJob.id)
      .order("match_score", { ascending: false })
      .then(({ data }) => setApplications((data as unknown as Application[]) ?? []));
  }, [selectedJob]);

  const getCvUrl = async (path: string) => {
    if (signedUrls[path]) return signedUrls[path];
    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(path, 3600);
    if (error || !data) {
      toast.error("تعذّر فتح السيرة الذاتية");
      return null;
    }
    setSignedUrls((s) => ({ ...s, [path]: data.signedUrl }));
    return data.signedUrl;
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

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Jobs list */}
          <Card className="p-4 h-fit shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                وظائفي ({jobs.length})
              </h2>
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                لم تنشر أي وظيفة بعد.
                <br />
                ارجع للخريطة وانقر على أي موقع لنشر وظيفة.
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-right p-3 rounded-lg border transition-smooth ${
                      selectedJob?.id === job.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-semibold text-sm">{job.title}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {job.location_name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Applicants */}
          <div>
            {!selectedJob ? (
              <Card className="p-12 text-center shadow-soft">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">اختر وظيفة لعرض المتقدمين</h3>
                <p className="text-sm text-muted-foreground">
                  اختر إحدى وظائفك من القائمة لعرض قائمة المتقدمين مرتبة حسب نسبة التطابق
                </p>
              </Card>
            ) : (
              <Card className="p-6 shadow-soft">
                <div className="flex items-center justify-between mb-1 pb-4 border-b border-border">
                  <div>
                    <h2 className="font-bold text-lg">{selectedJob.title}</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {selectedJob.location_name}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {applications.length} متقدم
                  </Badge>
                </div>

                {applications.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    لا يوجد متقدمون على هذه الوظيفة بعد.
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="mt-2">
                    {applications.map((app, idx) => (
                      <AccordionItem key={app.id} value={app.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="text-right flex-1">
                              <div className="font-semibold text-sm">
                                {app.applicant.full_name || "مرشّح"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {app.applicant.field} · {app.applicant.experience_years}
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`gap-1 ${
                                app.match_score >= 70
                                  ? "bg-success/15 text-success border-success/30"
                                  : app.match_score >= 40
                                  ? "bg-warning/15 text-warning-foreground border-warning/30"
                                  : ""
                              }`}
                            >
                              <Trophy className="w-3 h-3" />
                              {Math.round(app.match_score)}%
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>{app.applicant.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{app.applicant.phone || "—"}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {app.applicant.education && (
                                <Badge variant="outline">{app.applicant.education}</Badge>
                              )}
                              {(app.applicant.skills ?? []).map((s) => (
                                <Badge key={s} variant="secondary">{s}</Badge>
                              ))}
                              {(app.applicant.languages ?? []).map((l) => (
                                <Badge key={l} variant="outline" className="border-accent/40 text-accent">
                                  {l}
                                </Badge>
                              ))}
                            </div>

                            {app.applicant.cv_url && (
                              <CVPreview
                                path={app.applicant.cv_url}
                                getUrl={getCvUrl}
                              />
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CVPreview = ({
  path,
  getUrl,
}: {
  path: string;
  getUrl: (p: string) => Promise<string | null>;
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getUrl(path).then(setUrl);
  }, [path, getUrl]);

  if (!url) return <div className="text-xs text-muted-foreground">جارٍ تحميل السيرة...</div>;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-muted">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="w-4 h-4 text-primary" />
          السيرة الذاتية
        </div>
        <Button asChild size="sm" variant="ghost">
          <a href={url} download target="_blank" rel="noreferrer">
            <Download className="w-4 h-4 ml-1" />
            تحميل
          </a>
        </Button>
      </div>
      <iframe src={url} className="w-full h-[400px]" title="السيرة الذاتية" />
    </div>
  );
};

export default EmployerDashboard;
