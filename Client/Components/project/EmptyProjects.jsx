import { FolderOpen } from "lucide-react";

const EmptyProjects = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
      <FolderOpen
        className="mx-auto text-slate-500 mb-4"
        size={60}
      />

      <h2 className="text-2xl font-semibold text-white">
        No Projects Found
      </h2>

      <p className="text-slate-400 mt-3">
        Create your first project to start tracking bugs with AI.
      </p>
    </div>
  );
};

export default EmptyProjects;