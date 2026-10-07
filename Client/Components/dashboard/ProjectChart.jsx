import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";
import { getBugChart } from "../../services/dashboardService";

const COLORS = ["#ef4444", "#facc15", "#22c55e", "#3b82f6"];

const ProjectChart = ({ projectId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChart = async (isActive = () => true) => {
    if (!projectId) {
      if (isActive()) {
        setData([]);
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setData([]);
      const res = await getBugChart(projectId);
      if (isActive()) setData(res.chart || []);
    } catch (error) {
      console.error("Chart Error:", error);
      if (isActive()) setData([]);
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetchChart(() => active);

    const handleDashboardRefresh = () => {
      fetchChart(() => active);
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
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <h2 className="text-xl font-semibold mb-4 text-white">
        Bug Overview
      </h2>

      {loading ? (
        <div className="h-72 flex items-center justify-center text-slate-400">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="min-h-40 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-semibold text-green-400">
            Bug Clear
          </p>
          <p className="mt-2 text-slate-400">
            No active bugs found.
          </p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                outerRadius={90}
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`${entry.status}-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ProjectChart;