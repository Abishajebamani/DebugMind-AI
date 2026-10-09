import { useEffect, useState } from "react";
import DashboardLayout from "../../src/layouts/DashboardLayout";
import DashboardCard from "../../Components/layout/DashboardCard";
import RecentBugs from "../../Components/dashboard/RecentBugs";
import ProjectChart from "../../Components/dashboard/ProjectChart";
import AIInsights from "../../Components/dashboard/AIInsights";
import { getDashboard } from "../../services/dashboardService";
import { getProjects } from "../../services/projectService";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [stats, setStats] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        const projectList = data.projects || [];

        setProjects(projectList);
        setSelectedProjectId(projectList[0]?.id || "");
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setStats(null);
      return;
    }

    let active = true;

    const fetchDashboard = async () => {
      try {
        setStatsLoading(true);
        setStats(null);

        const data = await getDashboard(selectedProjectId);

        if (active) {
          setStats(data.dashboard);
        }
      } catch (error) {
        if (active) {
          console.error("Dashboard Error:", error);
          setStats(null);
        }
      } finally {
        if (active) {
          setStatsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome to DebugMind AI
          </h1>

          <p className="mt-1 text-slate-400">
            Monitor your projects, bugs, and AI insights from one place.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-400">
          Project

          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            disabled={projectsLoading || projects.length === 0}
            className="min-w-56 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
          >
            <option value="">Select a project</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {projectsLoading ? (
        <p className="text-slate-400">Loading projects...</p>
      ) : !selectedProjectId ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
          Select a project to view its dashboard.
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <DashboardCard
              title="Projects Uploaded"
              value={statsLoading ? "..." : stats?.totalProjects ?? 0}
              color="text-cyan-400"
            />

            <DashboardCard
              title="Active AI Bugs"
              value={statsLoading ? "..." : stats?.totalBugs ?? 0}
              color="text-purple-400"
            />

            <DashboardCard
              title="Pending Bugs"
              value={statsLoading ? "..." : stats?.openBugs ?? 0}
              color="text-red-400"
            />

            <DashboardCard
              title="AI Fixed Bugs"
              value={statsLoading ? "..." : stats?.resolvedBugs ?? 0}
              color="text-green-400"
            />

            <DashboardCard
              title="Build Success Rate"
              value="--"
              color="text-yellow-400"
            />
          </div>

          {/* Main Dashboard Content */}
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Recent Bugs */}
            <div className="lg:col-span-2">
              <RecentBugs projectId={selectedProjectId} />
            </div>

            {/* Right Side */}
            <div className="space-y-4">
              <ProjectChart projectId={selectedProjectId} />

              <AIInsights projectId={selectedProjectId} />
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;

