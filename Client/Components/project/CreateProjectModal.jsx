import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Modal from "../Common/Modal";
import { createProject } from "../../services/projectService";

const CreateProjectModal = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await createProject(data);

      toast.success("Project created successfully!");

      reset();

      onClose();

      onProjectCreated();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to create project"
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Project"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div>
          <label className="block text-gray-300 mb-2">
            Project Name
          </label>

          <input
            {...register("name", {
              required: "Project name is required",
            })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500"
            placeholder="Enter project name"
          />

          {errors.name && (
            <p className="text-red-400 text-sm mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 mb-2">
            Description
          </label>

          <textarea
            rows={4}
            {...register("description", {
              required: "Description is required",
            })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500"
            placeholder="Enter project description"
          />

          {errors.description && (
            <p className="text-red-400 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {isSubmitting
              ? "Creating..."
              : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;