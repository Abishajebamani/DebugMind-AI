import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../src/layouts/DashboardLayout";
import {
  FolderKanban,
  Plus,
  Search,
  Calendar
} from "lucide-react";

import { getProjects, deleteProject, uploadProject } from "../../services/projectService";
import { toast } from "react-toastify";

const Projects = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", github_url: "", zipFile: null });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
  try {
    const data = await getProjects();

    console.log("PROJECTS API RESPONSE:", data);
    console.log(data.projects);

    setProjects(data.projects || []);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }
};

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);
      payload.append("github_url", formData.github_url);
      if (formData.zipFile) payload.append("zipFile", formData.zipFile);

      await uploadProject(payload);
      toast.success("Project uploaded successfully");
      setFormData({ name: "", description: "", github_url: "", zipFile: null });
      await fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this project?"
  );

  if (!confirmDelete) return;

  try {
    await deleteProject(id);

    toast.success("Project deleted successfully");

    fetchProjects();
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
      "Failed to delete project"
    );
  }
};

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400">Upload codebases and let AI scan them for bugs.</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <h2 className="font-semibold text-white">Upload Project for AI Scan</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none" placeholder="Project Name" required />
          <input value={formData.github_url} onChange={(e) => setFormData({ ...formData, github_url: e.target.value })} className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none" placeholder="GitHub Repository URL" />
        </div>
        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 outline-none" placeholder="Project Description" rows="3" required />
        <input type="file" accept=".zip" onChange={(e) => setFormData({ ...formData, zipFile: e.target.files?.[0] || null })} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-cyan-500 file:text-white" />
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-5 py-2 rounded-lg text-white font-medium transition disabled:opacity-70">
          <Plus size={18} />
          {loading ? "Uploading..." : "Upload & Prepare"}
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8 flex items-center">
        <Search
          className="text-gray-400 mr-3"
          size={20}
        />

        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="bg-transparent outline-none w-full text-white"
        />
      </div>

      {/* Projects */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500 transition duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <FolderKanban
                  className="text-cyan-400"
                  size={34}
                />

                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold">
                  {project.scan_status || "Pending"}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-white">
                {project.name}
              </h2>

              <p className="text-gray-400 mt-2 h-12 overflow-hidden">
                {project.description}
              </p>

              <div className="space-y-3 mt-6 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>AI Bugs Found</span>

                  <span className="text-red-400 font-semibold">
                    0
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>GitHub URL</span>

                  <span className="text-slate-400 text-right max-w-[140px] truncate">
                    {project.github_url || "—"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar size={15} />
                    Created
                  </span>

                  <span>
                    {new Date(
                      project.created_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
                <div className="flex gap-3 mt-6">
  <button
    onClick={() =>
      navigate(`/projects/${project.id}`)
    }
    className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition"
  >
    Open Project
  </button>

  <button
    onClick={() => handleDelete(project.id)}
    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
  >
    Delete
  </button>
</div>
              
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <FolderKanban
              size={70}
              className="text-slate-600 mb-5"
            />

            <h2 className="text-2xl font-bold text-white">
              No Projects Found
            </h2>

            <p className="text-slate-400 mt-2">
              Create your first project to get
              started.
            </p>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
};

export default Projects;