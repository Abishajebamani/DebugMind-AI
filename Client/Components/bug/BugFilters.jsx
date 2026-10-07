import { Search } from "lucide-react";

const BugFilters = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">

      <div className="grid md:grid-cols-4 gap-4">

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-3 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search bugs..."
            className="w-full bg-slate-800 text-white rounded-lg py-2 pl-10 pr-4 outline-none border border-slate-700 focus:border-cyan-500"
          />
        </div>

        {/* Status */}
        <select
          className="bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-700 outline-none focus:border-cyan-500"
        >
          <option value="">All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>

        {/* Priority */}
        <select
          className="bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-700 outline-none focus:border-cyan-500"
        >
          <option value="">All Priority</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        {/* Project */}
        <select
          className="bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-700 outline-none focus:border-cyan-500"
        >
          <option value="">All Projects</option>
        </select>

      </div>

    </div>
  );
};

export default BugFilters;