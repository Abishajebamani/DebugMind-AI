import { Search } from "lucide-react";

const ProjectSearch = ({ value, onChange }) => {
  return (
    <div className="relative w-full md:w-96">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />

      <input
        type="text"
        placeholder="Search projects..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500"
      />
    </div>
  );
};

export default ProjectSearch;