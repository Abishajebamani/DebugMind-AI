import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Modal from "../Common/Modal";

import {
  createBug,
  updateBug,
} from "../../services/bugService";

import { getProjects } from "../../services/projectService";
import { getAssignableMembers } from "../../services/memberService";

const BugModal = ({
  open,
  onClose,
  refresh,
  editingBug,
}) => {
  const [projects, setProjects] = useState([]);
  const [assignableMembers, setAssignableMembers] =
    useState([]);
  const [membersLoading, setMembersLoading] =
    useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      status: "Open",
      project_id: "",
      assigned_to: "",
    },
  });

  const selectedProjectId = watch("project_id");

  // =====================================================
  // LOAD PROJECTS
  // =====================================================

  useEffect(() => {
    if (!open) return;

    const loadProjects = async () => {
      try {
        const res = await getProjects();

        setProjects(res.projects || []);
      } catch (err) {
        console.error(
          "Failed to load projects:",
          err
        );

        toast.error(
          err.response?.data?.message ||
            "Failed to load projects"
        );
      }
    };

    loadProjects();
  }, [open]);

  // =====================================================
  // LOAD DEVELOPERS + TESTERS
  // WHEN PROJECT CHANGES
  // =====================================================

  useEffect(() => {
    if (!open || !selectedProjectId) {
      setAssignableMembers([]);
      return;
    }

    const loadMembers = async () => {
      try {
        setMembersLoading(true);

        const response =
          await getAssignableMembers(
            selectedProjectId
          );

        const members = response.members || [];

        // Frontend protection.
        // Backend should also enforce this.
        const filteredMembers =
          members.filter(
            (member) =>
              member.role === "Developer" ||
              member.role === "Tester"
          );

        setAssignableMembers(
          filteredMembers
        );
      } catch (err) {
        console.error(
          "Failed to load assignable members:",
          err
        );

        setAssignableMembers([]);

        toast.error(
          err.response?.data?.message ||
            "Failed to load project members"
        );
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [open, selectedProjectId]);

  // =====================================================
  // LOAD EDITING DATA
  // =====================================================

  useEffect(() => {
    if (!open) return;

    if (editingBug) {
      setValue(
        "title",
        editingBug.title || ""
      );

      setValue(
        "description",
        editingBug.description || ""
      );

      setValue(
        "priority",
        editingBug.priority || "Medium"
      );

      setValue(
        "status",
        editingBug.status || "Open"
      );

      setValue(
        "project_id",
        editingBug.project_id || ""
      );

      setValue(
        "assigned_to",
        editingBug.assigned_to || ""
      );
    } else {
      reset({
        title: "",
        description: "",
        priority: "Medium",
        status: "Open",
        project_id: "",
        assigned_to: "",
      });
    }
  }, [
    editingBug,
    open,
    reset,
    setValue,
  ]);

  // =====================================================
  // SUBMIT
  // =====================================================

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        assigned_to:
          data.assigned_to || null,
      };

      console.log(
        "Bug Payload:",
        payload
      );

      if (editingBug) {
        await updateBug(
          editingBug.id,
          payload
        );

        toast.success(
          "Bug updated successfully"
        );
      } else {
        await createBug(payload);

        toast.success(
          "Bug created successfully"
        );
      }

      refresh();

      reset();

      setAssignableMembers([]);

      onClose();
    } catch (err) {
      console.error(
        "Bug Submit Error:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          "Something went wrong"
      );
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        editingBug
          ? "Edit Bug"
          : "Create New Bug"
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* =================================================
            TITLE
        ================================================= */}

        <div>
          <label className="mb-2 block text-slate-300">
            Bug Title
          </label>

          <input
            {...register("title", {
              required:
                "Title is required",
            })}
            placeholder="Enter bug title"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
          />

          {errors.title && (
            <p className="mt-1 text-sm text-red-400">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <div>
          <label className="mb-2 block text-slate-300">
            Description
          </label>

          <textarea
            rows={4}
            {...register("description", {
              required:
                "Description is required",
            })}
            placeholder="Describe the bug..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
          />

          {errors.description && (
            <p className="mt-1 text-sm text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* =================================================
            PROJECT + PRIORITY
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* PROJECT */}

          <div>
            <label className="mb-2 block text-slate-300">
              Project
            </label>

            <select
              {...register(
                "project_id",
                {
                  required:
                    "Project is required",
                }
              )}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="">
                Select Project
              </option>

              {projects.map(
                (project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                )
              )}
            </select>

            {errors.project_id && (
              <p className="mt-1 text-sm text-red-400">
                {
                  errors.project_id
                    .message
                }
              </p>
            )}
          </div>

          {/* PRIORITY */}

          <div>
            <label className="mb-2 block text-slate-300">
              Priority
            </label>

            <select
              {...register("priority")}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="Low">
                Low
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="High">
                High
              </option>

              <option value="Critical">
                Critical
              </option>
            </select>
          </div>
        </div>

        {/* =================================================
            ASSIGNED TO
        ================================================= */}

        <div>
          <label className="mb-2 block text-slate-300">
            Assigned To
          </label>

          <select
            {...register("assigned_to")}
            disabled={
              !selectedProjectId ||
              membersLoading
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {membersLoading
                ? "Loading members..."
                : "Unassigned"}
            </option>

            {assignableMembers.map(
              (member) => (
                <option
                  key={
                    member.userId ||
                    member.id
                  }
                  value={
                    member.userId ||
                    member.id
                  }
                >
                  {member.name} —{" "}
                  {member.role}
                </option>
              )
            )}
          </select>

          {!membersLoading &&
            selectedProjectId &&
            assignableMembers.length ===
              0 && (
              <p className="mt-2 text-xs text-slate-500">
                No Developers or Testers
                are available in this
                project.
              </p>
            )}

          <p className="mt-2 text-xs text-slate-500">
            Only Developers and Testers
            belonging to the selected
            project can be assigned.
          </p>
        </div>

        {/* =================================================
            STATUS
        ================================================= */}

        <div>
          <label className="mb-2 block text-slate-300">
            Status
          </label>

          <select
            {...register("status")}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            <option value="Open">
              Open
            </option>

            <option value="In Progress">
              In Progress
            </option>

            <option value="Resolved">
              Resolved
            </option>
          </select>
        </div>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-700 px-5 py-2 text-white hover:bg-slate-600"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-cyan-500 px-5 py-2 font-semibold text-white hover:bg-cyan-600 disabled:opacity-70"
          >
            {isSubmitting
              ? editingBug
                ? "Updating..."
                : "Creating..."
              : editingBug
              ? "Update Bug"
              : "Create Bug"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BugModal;