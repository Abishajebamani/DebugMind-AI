import {
  Eye,
  Trash2,
  Bug,
} from "lucide-react";

const BugTable = ({
  bugs,
  loading,
  onDelete,
  onView,
}) => {
  if (loading) {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center text-slate-400">
        Loading bugs...
      </div>
    );
  }

  if (!bugs || bugs.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl p-10 text-center">
        <Bug
          size={50}
          className="mx-auto text-slate-600 mb-3"
        />

        <h2 className="text-xl text-white">
          No Bugs Found
        </h2>

        <p className="text-slate-400 mt-2">
          No AI bugs were detected in this project.
        </p>
      </div>
    );
  }

  const severityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "text-red-500";

      case "high":
        return "text-orange-400";

      case "medium":
        return "text-yellow-400";

      case "low":
        return "text-green-400";

      default:
        return "text-slate-400";
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "Resolved":
      case "Fix Applied":
        return "bg-green-500/20 text-green-400";

      case "Fix Generated":
        return "bg-cyan-500/20 text-cyan-400";

      case "In Progress":
        return "bg-yellow-500/20 text-yellow-400";

      default:
        return "bg-red-500/20 text-red-400";
    }
  };

  return (
    <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">

      <table className="min-w-full">

        {/* HEADER */}

        <thead className="bg-slate-800">

          <tr>

            <th className="px-6 py-4 text-left text-slate-300">
              Bug
            </th>

            <th className="px-6 py-4 text-left text-slate-300">
              File
            </th>

            <th className="px-6 py-4 text-left text-slate-300">
              Line
            </th>

            <th className="px-6 py-4 text-left text-slate-300">
              Severity
            </th>

            <th className="px-6 py-4 text-left text-slate-300">
              Status
            </th>

            <th className="px-6 py-4 text-left text-slate-300">
              Created
            </th>

            <th className="px-6 py-4 text-center text-slate-300">
              Actions
            </th>

          </tr>

        </thead>

        {/* BODY */}

        <tbody>

          {bugs.map((bug) => (

            <tr
              key={bug.id}
              className="border-b border-slate-800 hover:bg-slate-800/40"
            >

              {/* BUG TITLE */}

              <td className="px-6 py-4">

                <div className="text-white font-medium">
                  {bug.bug_title || "Untitled Bug"}
                </div>

                <div className="text-xs text-slate-500 mt-1 max-w-[300px] truncate">
                  {bug.bug_description || "No description"}
                </div>

              </td>

              {/* FILE */}

              <td className="px-6 py-4">

                <span className="text-cyan-400 text-sm">
                  {bug.file_name || bug.source_file_path || "-"}
                </span>

              </td>

              {/* LINE */}

              <td className="px-6 py-4 text-slate-300">
                {bug.line_number || "-"}
              </td>

              {/* SEVERITY */}

              <td
                className={`px-6 py-4 font-semibold ${severityColor(
                  bug.severity
                )}`}
              >
                {bug.severity || "Unknown"}
              </td>

              {/* STATUS */}

              <td className="px-6 py-4">

                <span
                  className={`px-3 py-1 rounded-full text-xs ${statusColor(
                    bug.fix_status || bug.status
                  )}`}
                >
                  {bug.fix_status || bug.status || "Open"}
                </span>

              </td>

              {/* CREATED */}

              <td className="px-6 py-4 text-slate-400">

                {bug.created_at
                  ? new Date(
                      bug.created_at
                    ).toLocaleDateString()
                  : "-"}

              </td>

              {/* ACTIONS */}

              <td className="px-6 py-4">

                <div className="flex justify-center gap-3">

                  {/* VIEW SOURCE */}

                  <button
                    onClick={() => onView && onView(bug)}
                    className="text-cyan-400 hover:text-cyan-300"
                    title="View Source"
                  >
                    <Eye size={18} />
                  </button>

                  {/* DELETE */}

                  <button
                    onClick={() => onDelete(bug.id)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete Bug"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
};

export default BugTable;