import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { getRecentBugs } from "../../services/dashboardService";

const RecentBugs = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentBugs();
  }, []);

  const fetchRecentBugs = async () => {
    try {
      const res = await getRecentBugs();
      setBugs(res.bugs || []);
    } catch (error) {
      console.error("Failed to fetch recent bugs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500/20 text-red-400";
      case "High":
        return "bg-orange-500/20 text-orange-400";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "Low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "text-red-400";
      case "In Progress":
        return "text-yellow-400";
      case "Resolved":
        return "text-green-400";
      default:
        return "text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Recent Bugs
        </h2>

        <p className="text-slate-400">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-6">
        Recent Bugs
      </h2>

      {bugs.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          No recent bugs found.
        </div>
      ) : (
        <div className="space-y-4">
          {bugs.map((bug) => (
            <div
              key={bug.id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-400 mt-1" size={18} />

                <div>
                  <h3 className="text-white font-semibold">
                    {bug.title}
                  </h3>

                  <p className="text-sm text-slate-400">
                    {bug.project_name}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                    bug.priority
                  )}`}
                >
                  {bug.priority}
                </span>

                <p
                  className={`mt-2 text-sm font-medium ${getStatusColor(
                    bug.status
                  )}`}
                >
                  {bug.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentBugs;