const ProjectCard = ({ project }) => {
  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 hover:border-cyan-500 transition">
      <h2 className="text-xl font-semibold text-white">
        {project.name}
      </h2>

      <p className="text-gray-400 mt-2">
        {project.description}
      </p>

      <div className="mt-4 flex justify-between text-sm">
        <span className="text-cyan-400">
          Bugs: {project.totalBugs}
        </span>

        <span className="text-green-400">
          Members: {project.members}
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;