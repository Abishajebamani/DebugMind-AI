import { useEffect,useState } from "react";
import DashboardLayout from "../../src/layouts/DashboardLayout";
import { FolderKanban,Plus,Search,Calendar,Users } from "lucide-react";
import { getProjects } from "../../services/projectService";

const Projects=()=>{
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");

  useEffect(()=>{
    const fetchProjects=async()=>{
      try{
        const data=await getProjects();
        setProjects(data.projects||data||[]);
      }catch(error){
        console.error("Projects Error:",error);
      }finally{
        setLoading(false);
      }
    };
    fetchProjects();
  },[]);

  const filteredProjects=projects.filter(project=>
    project.name?.toLowerCase().includes(search.toLowerCase())||
    project.description?.toLowerCase().includes(search.toLowerCase())
  );

  return(
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400">Manage all your development projects</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-5 py-2 rounded-lg text-white font-medium transition">
          <Plus size={18}/>
          New Project
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8 flex items-center">
        <Search className="text-gray-400 mr-3" size={20}/>
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="bg-transparent outline-none w-full text-white"
        />
      </div>

      {loading?(
        <div className="text-center text-gray-400 py-12">
          Loading projects...
        </div>
      ):filteredProjects.length===0?(
        <div className="text-center text-gray-400 py-12">
          No projects found.
        </div>
      ):(
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(project=>(
            <div
              key={project.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500 transition"
            >
              <div className="flex items-center justify-between mb-5">
                <FolderKanban className="text-cyan-400" size={35}/>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400">
                  {project.scan_status||"Uploaded"}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-white">
                {project.name}
              </h2>

              <p className="text-gray-400 mt-2 mb-6">
                {project.description||"No description available"}
              </p>

              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Bugs</span>
                  <span className="font-semibold text-red-400">
                    {project.bug_count??0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Users size={15}/>
                    Members
                  </span>
                  <span>{project.member_count??0}</span>
                </div>

                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar size={15}/>
                    Created
                  </span>
                  <span>
                    {project.created_at
                      ?new Date(project.created_at).toLocaleDateString()
                      :"N/A"}
                  </span>
                </div>
              </div>

              <button className="w-full mt-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition">
                Open Project
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Projects;