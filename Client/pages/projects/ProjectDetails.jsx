import { useEffect,useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { ArrowLeft,FolderKanban,Calendar,Bug,Sparkles,CheckCircle2,AlertTriangle,Play } from "lucide-react";
import DashboardLayout from "../../src/layouts/DashboardLayout";
import { getProjectById,scanProject,getProjectBugs,analyzeBug,fixBug,applyFix,buildProject,downloadRepairedProject} from "../../services/projectService";
import { toast } from "react-toastify";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project,setProject] = useState(null);
  const [bugs,setBugs] = useState([]);
  const [selectedBug,setSelectedBug] = useState(null);
  const [loading,setLoading] = useState(true);
  const [scanning,setScanning] = useState(false);
  const [fixing,setFixing] = useState(false);
  const [applyingFix,setApplyingFix] = useState(false);
  const [building,setBuilding] = useState(false);
  const [buildResult,setBuildResult] = useState(null);
  const [downloading,setDownloading] = useState(false);

  useEffect(() => {
    fetchProject();
  },[id]);

  const fetchProject = async () => {
    try {
      setLoading(true);

      const res = await getProjectById(id);
      setProject(res.project);

      const bugsRes = await getProjectBugs(id);
      const currentBugs = Array.isArray(bugsRes.bugs) ? bugsRes.bugs : [];

      setBugs(currentBugs);

      if (currentBugs.length > 0) {
        setSelectedBug(prev => {
          const existing = prev && currentBugs.find(bug => bug.id === prev.id);
          return existing || currentBugs[0];
        });
      } else {
        setSelectedBug(null);
      }
    } catch (err) {
      console.error("FETCH PROJECT ERROR:",err);
      setBugs([]);
      setSelectedBug(null);
      toast.error(err.response?.data?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const refreshBugs = async () => {
    try {
      const bugsRes = await getProjectBugs(id);
      const currentBugs = Array.isArray(bugsRes.bugs) ? bugsRes.bugs : [];

      setBugs(currentBugs);

      if (currentBugs.length === 0) {
        setSelectedBug(null);
      } else {
        setSelectedBug(prev => {
          const existing = prev && currentBugs.find(bug => bug.id === prev.id);
          return existing || currentBugs[0];
        });
      }

      window.dispatchEvent(new Event("bugsUpdated"));
      return currentBugs;
    } catch (err) {
      console.error("REFRESH BUGS ERROR:",err);
      setBugs([]);
      setSelectedBug(null);
      return [];
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      setBuildResult(null);

      const res = await scanProject(id);

      toast.success(
        res.bugsFound === 0
          ? "Scan completed. No Bugs Found."
          : `Scan completed. ${res.bugsFound} bug(s) found.`
      );

      await fetchProject();
      window.dispatchEvent(new Event("bugsUpdated"));
    } catch (err) {
      console.error("SCAN ERROR:",err);
      toast.error(err.response?.data?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleAnalyze = async bugId => {
    try {
      const res = await analyzeBug(bugId);

      setSelectedBug(prev =>
        prev ? { ...prev,...res.analysis } : res.analysis
      );

      toast.success("Analysis loaded");
    } catch (err) {
      console.error("ANALYZE ERROR:",err);
      toast.error(err.response?.data?.message || "Analysis failed");
    }
  };

  const handleFix = async bugId => {
    try {
      setFixing(true);

      const res = await fixBug(bugId);

      if (!res?.fix) {
        throw new Error("No valid fix was generated");
      }

      setSelectedBug(prev =>
        prev ? { ...prev,...res.fix } : res.fix
      );

      setBuildResult(null);
      toast.success("Fix generated");
    } catch (err) {
      console.error("FIX ERROR:",err);
      toast.error(
        err.response?.data?.message || err.message || "Fix generation failed"
      );
    } finally {
      setFixing(false);
    }
  };

  const handleApplyFix = async () => {
    if (!selectedBug?.id) return;

    const oldCode = selectedBug.oldCode || selectedBug.old_code;
    const newCode = selectedBug.newCode || selectedBug.new_code;

    if (!oldCode || !newCode) {
      toast.error("Generate a fix before applying it");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to apply this AI-generated fix?"
    );

    if (!confirmed) return;

    try {
      setApplyingFix(true);

      const res = await applyFix(selectedBug.id,{
        oldCode,
        newCode
      });

      toast.success(res.message || "Fix applied successfully");

      setBuildResult(null);

      await refreshBugs();
    } catch (err) {
      console.error("APPLY FIX ERROR:",err);
      toast.error(
        err.response?.data?.message || "Fix application failed"
      );
    } finally {
      setApplyingFix(false);
    }
  };

  const handleBuild = async () => {
    try {
      setBuilding(true);
      setBuildResult(null);

      const res = await buildProject(id);

      console.log("BUILD RESULT:",res);

      const bugsFound = Number(res.bugsFound || 0);
      const buildPassed = res.buildStatus === "Passed" || res.details?.success;

      setBuildResult({
        success:buildPassed,
        stdout:res.message || res.details?.stdout || "",
        stderr:res.details?.stderr || "",
        bugsFound,
        bugStatus:res.bugStatus || (bugsFound === 0 ? "Bug Clear" : "Bugs Found"),
        buildStatus:res.buildStatus || (buildPassed ? "Passed" : "Failed")
      });

      const currentBugs = await refreshBugs();

      if (buildPassed && currentBugs.length === 0) {
        toast.success("Build successful. Bug Clear! No Bugs Found.");
      } else if (buildPassed) {
        toast.warning(
          `Build successful. ${currentBugs.length} bug(s) still exist.`
        );
      } else {
        toast.error("Build failed");
      }
    } catch (err) {
      console.error("BUILD ERROR:",err);
      setBuildResult({
        success:false,
        stdout:"",
        stderr:err.response?.data?.message || "Build check failed",
        bugsFound:bugs.length,
        bugStatus:"Build Failed",
        buildStatus:"Failed"
      });
      toast.error(
        err.response?.data?.message || "Build check failed"
      );
    } finally {
      setBuilding(false);
    }
  };

  const handleDownloadRepairedProject = async () => {
  try {
    setDownloading(true);

    const response = await downloadRepairedProject(id);

    const blob = new Blob([response.data], {
      type: "application/zip",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `repaired-project-${id}.zip`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Repaired project downloaded successfully");
  } catch (err) {
    console.error("DOWNLOAD REPAIRED PROJECT ERROR:", err);

    toast.error(
      err.response?.data?.message ||
        "Failed to download repaired project"
    );
  } finally {
    setDownloading(false);
  }
};

  if (loading) {
    return (
      <DashboardLayout>
        <h2 className="text-white text-xl">Loading...</h2>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <h2 className="text-red-400 text-xl">Project not found</h2>
      </DashboardLayout>
    );
  }

  const fixAvailable = Boolean(
    selectedBug?.newCode || selectedBug?.new_code
  );

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate("/projects")}
        className="flex items-center gap-2 text-cyan-400 mb-6"
      >
        <ArrowLeft size={18}/>
        Back to Projects
      </button>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
        <div className="flex items-center gap-4 mb-6">
          <FolderKanban size={45} className="text-cyan-400"/>

          <div>
            <h1 className="text-3xl font-bold text-white">
              {project.name}
            </h1>

            <p className="text-slate-400 mt-1">
              {project.description}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-8">
          <div className="bg-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Total Bugs</p>

            <div className="flex items-center gap-2 mt-2">
              <Bug className="text-red-400"/>
              <span className="text-3xl font-bold text-white">
                {bugs.length}
              </span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Status</p>

            <span
              className={`inline-block mt-3 px-3 py-1 rounded-full ${
                bugs.length === 0
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {bugs.length === 0 ? "Bug Clear" : "Bugs Found"}
            </span>
          </div>

          <div className="bg-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Created</p>

            <div className="flex items-center gap-2 mt-2">
              <Calendar size={18} className="text-cyan-400"/>

              <span className="text-white">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={handleScan}
            disabled={scanning || building}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-white disabled:opacity-60"
          >
            <Sparkles size={16}/>
            {scanning ? "Scanning..." : "Scan Project"}
          </button>

          <button
            onClick={handleBuild}
            disabled={building || scanning}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white disabled:opacity-60"
          >
            <Play size={16}/>
            {building ? "Building..." : "Run Build"}
          </button>

          <button
  onClick={handleDownloadRepairedProject}
  disabled={downloading || scanning || building}
  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-white disabled:opacity-60"
>
  <CheckCircle2 size={16}/>
  {downloading
    ? "Preparing ZIP..."
    : "Download Repaired Project"}
</button>
        </div>

        {buildResult && (
          <div
            className={`mt-6 rounded-lg border p-4 ${
              buildResult.success && buildResult.bugsFound === 0
                ? "border-emerald-500/30 bg-emerald-500/10"
                : buildResult.success
                ? "border-yellow-500/30 bg-yellow-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}
          >
            {buildResult.success && buildResult.bugsFound === 0 ? (
              <>
                <div className="font-semibold text-emerald-400">
                  ✅ Build Successful
                </div>

                <div className="mt-2 font-semibold text-emerald-400">
                  ✅ Bug Clear
                </div>

                <div className="text-sm text-slate-300 mt-1">
                  No Bugs Found in this project.
                </div>
              </>
            ) : buildResult.success ? (
              <>
                <div className="font-semibold text-yellow-400">
                  ✅ Build Successful
                </div>

                <div className="text-sm text-slate-300 mt-2">
                  {buildResult.bugsFound} bug(s) still exist.
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-red-400">
                  ❌ Build Failed
                </div>

                <div className="text-sm text-slate-300 mt-2">
                  {buildResult.stderr || buildResult.stdout || "Build failed"}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Detected AI Bugs
              </h2>

              <span className="text-sm text-slate-400">
                {bugs.length} findings
              </span>
            </div>

            <div className="space-y-3">
              {bugs.length > 0 ? (
                bugs.map(bug => (
                  <button
                    key={bug.id}
                    onClick={() => setSelectedBug(bug)}
                    className={`w-full text-left rounded-lg border px-4 py-3 ${
                      selectedBug?.id === bug.id
                        ? "border-cyan-500 bg-slate-700"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">
                        {bug.bug_title}
                      </span>

                      <span className="text-xs uppercase text-cyan-400">
                        {bug.severity}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 mt-1">
                      {bug.file_name}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={40}
                    className="mx-auto text-emerald-400 mb-3"
                  />

                  <p className="text-lg font-semibold text-emerald-400">
                    Bug Clear
                  </p>

                  <p className="text-slate-400 mt-1">
                    No Bugs Found in this project.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5">
            {selectedBug ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="text-red-400" size={18}/>

                  <h3 className="text-xl font-semibold text-white">
                    {selectedBug.bug_title}
                  </h3>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <div>
                    <span className="text-slate-400">Problem:</span>{" "}
                    {selectedBug.bug_description}
                  </div>

                  <div>
                    <span className="text-slate-400">Reason:</span>{" "}
                    {selectedBug.ai_response ||
                      selectedBug.ai_explanation ||
                      selectedBug.suggested_fix}
                  </div>

                  <div>
                    <span className="text-slate-400">Severity:</span>{" "}
                    {selectedBug.severity}
                  </div>

                  <div>
                    <span className="text-slate-400">File:</span>{" "}
                    {selectedBug.fileName || selectedBug.file_name}
                  </div>

                  <div>
                    <span className="text-slate-400">Line:</span>{" "}
                    {selectedBug.lineNumber || selectedBug.line_number}
                  </div>

                  <div>
                    <span className="text-slate-400">Status:</span>{" "}
                    {selectedBug.fix_status ||
                      selectedBug.status ||
                      "Open"}
                  </div>
                </div>

                {fixAvailable && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-white mb-2">
                        AI Generated Fix
                      </div>

                      <div className="text-xs text-slate-400">
                        File: {selectedBug.fileName || selectedBug.file_name}
                      </div>

                      <div className="text-xs text-slate-400">
                        Line: {selectedBug.lineNumber || selectedBug.line_number}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs uppercase text-slate-500 mb-2">
                          Before
                        </div>

                        <pre className="whitespace-pre-wrap bg-slate-900 p-3 rounded-lg text-xs text-slate-300">
                          {selectedBug.oldCode ||
                            selectedBug.old_code ||
                            selectedBug.suggested_fix}
                        </pre>
                      </div>

                      <div>
                        <div className="text-xs uppercase text-slate-500 mb-2">
                          After
                        </div>

                        <pre className="whitespace-pre-wrap bg-slate-900 p-3 rounded-lg text-xs text-slate-300">
                          {selectedBug.newCode ||
                            selectedBug.new_code}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-slate-500 mb-2">
                        Explanation
                      </div>

                      <p className="text-sm text-slate-300">
                        {selectedBug.explanation ||
                          selectedBug.ai_explanation}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-slate-500 mb-2">
                        Confidence
                      </div>

                      <p className="text-sm text-slate-300">
                        {selectedBug.confidence || 84}%
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => handleAnalyze(selectedBug.id)}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white"
                  >
                    <Sparkles size={16}/>
                    Analyze
                  </button>

                  <button
                    onClick={() => handleFix(selectedBug.id)}
                    disabled={fixing || applyingFix}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-white disabled:opacity-60"
                  >
                    <CheckCircle2 size={16}/>
                    {fixing ? "Generating..." : "Fix with AI"}
                  </button>

                  {fixAvailable && (
                    <button
                      onClick={handleApplyFix}
                      disabled={applyingFix || fixing}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-white disabled:opacity-60"
                    >
                      <CheckCircle2 size={16}/>
                      {applyingFix ? "Applying..." : "Apply Fix"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <CheckCircle2
                  size={45}
                  className="mx-auto text-emerald-400 mb-3"
                />

                <h3 className="text-xl font-semibold text-emerald-400">
                  Bug Clear
                </h3>

                <p className="text-slate-400 mt-2">
                  No Bugs Found in this project.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetails;