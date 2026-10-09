import { useEffect,useState } from "react";
import { useNavigate, useSearchParams  } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import DashboardLayout from "../../src/layouts/DashboardLayout";
import BugTable from "../../Components/bug/BugTable";
import BugFilters from "../../Components/bug/BugFilters";
import { getRecentBugs,deleteBug } from "../../services/bugService";
import { getProjects,getProjectBugs } from "../../services/projectService";
import { getAssignableMembers } from "../../services/memberService";

const Bugs = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId");

  const [bugs,setBugs] = useState([]);
  const [projects,setProjects] = useState([]);
  const [assignableMembers,setAssignableMembers] = useState([]);
  const [selectedProjectId,setSelectedProjectId] = useState("");
  const [assignedTo,setAssignedTo] = useState("");
  const [loading,setLoading] = useState(true);
  const [membersLoading,setMembersLoading] = useState(false);

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      const projectList = response.projects || [];
      setProjects(projectList);
      if (projectList.length > 0) {
  const projectExists=projectList.some(
    project=>project.id===projectIdFromUrl
  );
  setSelectedProjectId(
    projectExists?projectIdFromUrl:projectList[0].id
  );

      }
    } catch (error) {
      console.error("Load Projects Error:",error);
      toast.error(error.response?.data?.message || "Failed to load projects");
    }
  };

  const loadBugs = async () => {
    try {
      setLoading(true);
      let response;

      if (selectedProjectId) {
        response = await getProjectBugs(selectedProjectId);
      } else {
        response = await getRecentBugs();
      }

      console.log("BUG API RESPONSE:",response);
      setBugs(Array.isArray(response.bugs) ? response.bugs : []);
    } catch (error) {
      console.error("Load Bugs Error:",error);
      setBugs([]);
      toast.error(error.response?.data?.message || "Failed to load bugs");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignableMembers = async (projectId) => {
    if (!projectId) {
      setAssignableMembers([]);
      return;
    }

    try {
      setMembersLoading(true);
      const response = await getAssignableMembers(projectId);
      const members = response.members || [];

      setAssignableMembers(
        members.filter(
          member => member.role === "Developer" || member.role === "Tester"
        )
      );
    } catch (error) {
      console.error("Load Assignable Members Error:",error);
      setAssignableMembers([]);
      toast.error(
        error.response?.data?.message || "Failed to load project members"
      );
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  },[]);

  useEffect(() => {
    if (!selectedProjectId) {
      setAssignableMembers([]);
      setAssignedTo("");
      setBugs([]);
      return;
    }

    setAssignedTo("");
    loadAssignableMembers(selectedProjectId);
    loadBugs();
  },[selectedProjectId]);

  useEffect(() => {
    const refreshBugs = () => {
      if (selectedProjectId) loadBugs();
    };

    window.addEventListener("bugsUpdated",refreshBugs);
    window.addEventListener("focus",refreshBugs);

    return () => {
      window.removeEventListener("bugsUpdated",refreshBugs);
      window.removeEventListener("focus",refreshBugs);
    };
  },[selectedProjectId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bug?")) return;

    try {
      setLoading(true);
      await deleteBug(id);
      toast.success("Bug deleted successfully");
      await loadBugs();
    } catch (error) {
      console.error("Delete Bug Error:",error);
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleViewBug = (bug) => {
    navigate(`/projects/${bug.project_id}`);
  };

  const handleAssignedToChange = (e) => {
    const userId = e.target.value;
    setAssignedTo(userId);
    console.log("Bug will be assigned to:",userId);
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bug Management</h1>
          <p className="mt-2 text-slate-400">
            Track, assign, and manage project bugs
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-cyan-400">
          <Sparkles size={18}/>
          <span>AI Bug Review</span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">
            Project
          </label>

          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            <option value="">Select Project</option>

            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">
            Assigned To
          </label>

          <select
            value={assignedTo}
            onChange={handleAssignedToChange}
            disabled={!selectedProjectId || membersLoading}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {membersLoading ? "Loading members..." : "Unassigned"}
            </option>

            {assignableMembers.map(member => (
              <option
                key={member.userId || member.id}
                value={member.userId || member.id}
              >
                {member.name} — {member.role}
              </option>
            ))}
          </select>

          {!membersLoading &&
            selectedProjectId &&
            assignableMembers.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">
                No Developers or Testers are assigned to this project.
              </p>
            )}
        </div>
      </div>

      <BugFilters/>

      {!selectedProjectId ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-10 text-center">
          <p className="text-slate-400">
            Select a project to view its bugs.
          </p>
        </div>
      ) : bugs.length === 0 && !loading ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-10 text-center">
          <h2 className="text-xl font-semibold text-emerald-400">
            Bug Clear
          </h2>
          <p className="mt-2 text-slate-400">
            No Bugs Found in this project.
          </p>
        </div>
      ) : (
        <BugTable
          bugs={bugs}
          loading={loading}
          onDelete={handleDelete}
          onView={handleViewBug}
        />
      )}
    </DashboardLayout>
  );
};

export default Bugs;