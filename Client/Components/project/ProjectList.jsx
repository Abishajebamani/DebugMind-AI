import ProjectCard from "./ProjectCard";
import EmptyProjects from "./EmptyProjects";

const ProjectList = ({ projects }) => {
  if (!projects.length) {
    return <EmptyProjects />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project._id || project.id}
          project={project}
        />
      ))}
    </div>
  );
};

export default ProjectList;