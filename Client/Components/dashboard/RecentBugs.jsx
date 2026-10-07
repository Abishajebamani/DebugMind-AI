import { useEffect, useState } from "react";
import { getRecentBugs } from "../../services/dashboardService";

const statusColor = {
  Open: "text-red-400",
  "In Progress": "text-yellow-400",
  "Fix Generated": "text-yellow-400",
  "Fix Applied": "text-yellow-400",
  Resolved: "text-green-400"
};

const priorityColor = {
  Critical: "text-red-500",
  High: "text-red-400",
  Medium: "text-yellow-400",
  Low: "text-green-400"
};

const RecentBugs = ({ projectId }) => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBugs = async (isActive = () => true) => {
    if (!projectId) {
      if (isActive()) {
        setBugs([]);
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setBugs([]);
      const data = await getRecentBugs(projectId);
      if (isActive()) setBugs(data.bugs || []);
    } catch (error) {
      console.error("Failed to load bugs:", error);
      if (isActive()) setBugs([]);
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetchBugs(() => active);

    const handleDashboardRefresh = () => {
      fetchBugs(() => active);
    };

    window.addEventListener(
      "dashboardRefresh",
      handleDashboardRefresh
    );

    return () => {
      active = false;
      window.removeEventListener(
        "dashboardRefresh",
        handleDashboardRefresh
      );
    };
  }, [projectId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        Recent AI Findings
      </h2>

      {loading ? (
        <div className="text-center py-8 text-slate-400">
          Loading...
        </div>
      ) : bugs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl font-semibold text-green-400">
            Bug Clear
          </p>
          <p className="mt-2 text-slate-400">
            No active bugs found.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-700 text-slate-400">
              <tr>
                <th className="pb-3">Bug</th>
                <th className="pb-3">Project</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {bugs.map((bug) => (
                <tr
                  key={bug.id}
                  className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                >
                  <td className="py-4 text-white">
                    {bug.title}
                  </td>

                  <td className="text-slate-300">
                    {bug.project_name || "N/A"}
                  </td>

                  <td
                    className={
                      priorityColor[bug.priority] ||
                      "text-slate-300"
                    }
                  >
                    {bug.priority}
                  </td>

                  <td
                    className={
                      statusColor[bug.status] ||
                      "text-slate-300"
                    }
                  >
                    {bug.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentBugs;