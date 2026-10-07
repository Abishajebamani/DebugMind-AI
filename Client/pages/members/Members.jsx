import { useEffect, useState } from "react";
import DashboardLayout from "../../src/layouts/DashboardLayout";
import { getProjects } from "../../services/projectService";
import {
  addMember,
  deleteMember,
  getMembers,
  updateMember,
} from "../../services/memberService";

import AddMemberModal from "../../Components/member/AddMemberModal";
import MemberTable from "../../Components/member/MemberTable";

import { toast } from "react-toastify";
import { Plus, Users } from "lucide-react";

const Members = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [canManage, setCanManage] = useState(false);

  // =====================================================
  // LOAD CURRENT USER + PROJECTS
  // =====================================================

  useEffect(() => {
    const storedUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    setCurrentUser(storedUser);

    fetchProjects();
  }, []);

  // =====================================================
  // FETCH PROJECTS
  // =====================================================

  const fetchProjects = async () => {
    try {
      const data = await getProjects();

      const projectList = data.projects || [];

      setProjects(projectList);

      if (projectList.length > 0) {
        setSelectedProjectId(projectList[0].id);
      } else {
        setSelectedProjectId("");
        setMembers([]);
        setCanManage(false);
      }
    } catch (error) {
      console.error("Get Projects Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load projects"
      );

      setProjects([]);
      setMembers([]);
      setCanManage(false);
    }
  };

  // =====================================================
  // FETCH MEMBERS WHEN USER + PROJECT ARE READY
  // =====================================================

  useEffect(() => {
    if (!selectedProjectId || !currentUser?.id) {
      return;
    }

    fetchMembers(selectedProjectId);
  }, [selectedProjectId, currentUser?.id]);

  // =====================================================
  // FETCH MEMBERS
  // =====================================================

  const fetchMembers = async (projectId) => {
    try {
      setLoading(true);

      const response = await getMembers(projectId);

      const memberList = response.members || [];

      setMembers(memberList);

      // -------------------------------------------------
      // Find logged-in user's membership
      // -------------------------------------------------

      const myMembership = memberList.find(
        (member) =>
          String(member.userId) ===
          String(currentUser?.id)
      );

      // -------------------------------------------------
      // Permission calculation
      // -------------------------------------------------

      const isAdmin =
        currentUser?.role === "Admin";

      const isProjectManager =
        myMembership?.role === "Project Manager";

      const managePermission =
        isAdmin || isProjectManager;

      setCanManage(managePermission);

      // -------------------------------------------------
      // Debug information
      // -------------------------------------------------

      console.log("MEMBER PERMISSION:", {
        userId: currentUser?.id,
        userRole: currentUser?.role,
        projectId,
        myMembership,
        isAdmin,
        isProjectManager,
        canManage: managePermission,
      });

    } catch (error) {
      console.error("Get Members Error:", error);

      const message =
        error.response?.data?.message ||
        "Unable to load members";

      toast.error(message);

      setMembers([]);
      setCanManage(false);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ADD MEMBER
  // =====================================================

  const handleAddMember = async ({ email, role }) => {
    if (!canManage) {
      toast.error(
        "You do not have permission to add members"
      );
      return;
    }

    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }

    try {
      setLoading(true);

      const response = await addMember(
        selectedProjectId,
        email,
        role
      );

      if (response.success) {
        toast.success(
          "Member added successfully"
        );

        setModalOpen(false);

        await fetchMembers(selectedProjectId);
      }
    } catch (error) {
      console.error("Add Member Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to add member"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHANGE MEMBER ROLE
  // =====================================================

  const handleChangeRole = async (member) => {
    if (!canManage) {
      toast.error(
        "You do not have permission to change member roles"
      );
      return;
    }

    // Don't allow changing Project Manager through this UI
    if (member.role === "Project Manager") {
      toast.error(
        "Project Manager role cannot be changed"
      );
      return;
    }

    const nextRole = window.prompt(
      "Select role: Developer, Tester, Project Manager",
      member.role
    );

    if (!nextRole) {
      return;
    }

    const allowedRoles = [
      "Developer",
      "Tester",
      "Project Manager",
    ];

    if (!allowedRoles.includes(nextRole)) {
      toast.error("Invalid role selected");
      return;
    }

    try {
      setLoading(true);

      await updateMember(
        selectedProjectId,
        member.id,
        nextRole
      );

      toast.success("Role updated successfully");

      await fetchMembers(selectedProjectId);
    } catch (error) {
      console.error(
        "Update Member Role Error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update role"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REMOVE MEMBER
  // =====================================================

  const handleRemove = async (member) => {
    if (!canManage) {
      toast.error(
        "You do not have permission to remove members"
      );
      return;
    }

    // Prevent removing yourself
    if (
      String(member.userId) ===
      String(currentUser?.id)
    ) {
      toast.error(
        "You cannot remove yourself from the project"
      );
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.name} from this project?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deleteMember(member.id);

      toast.success(
        "Member removed successfully"
      );

      await fetchMembers(selectedProjectId);
    } catch (error) {
      console.error(
        "Remove Member Error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to remove member"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PROJECT CHANGE
  // =====================================================

  const handleProjectChange = (e) => {
    const projectId = e.target.value;

    setSelectedProjectId(projectId);

    setMembers([]);
    setCanManage(false);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* PAGE TITLE */}

        <div>
          <h1 className="text-3xl font-bold text-white">
            Members
          </h1>

          <p className="mt-2 text-slate-400">
            Manage project members and their
            project-specific roles.
          </p>
        </div>

        {/* PROJECT SELECT + ADD MEMBER */}

        <div className="flex items-center gap-3">

          <select
            value={selectedProjectId}
            onChange={handleProjectChange}
            disabled={!projects.length || loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white outline-none focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {projects.length > 0 ? (
              projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))
            ) : (
              <option value="">
                No projects
              </option>
            )}
          </select>

          {/* ADD MEMBER ONLY FOR ADMIN / PROJECT MANAGER */}

          {canManage && (
            <button
              onClick={() => setModalOpen(true)}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* =================================================
          NO PROJECTS
          ================================================= */}

      {!projects.length ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-10 text-center">

          <Users
            size={40}
            className="mx-auto mb-4 text-slate-600"
          />

          <h2 className="text-lg font-semibold text-white">
            No projects available
          </h2>

          <p className="mt-2 text-slate-400">
            Create a project before managing members.
          </p>

        </div>
      ) : (
        <>
          {/* MEMBER COUNT */}

          <div className="mb-4 flex items-center gap-2 text-slate-400">

            <Users size={18} />

            <span>
              {loading
                ? "Loading members..."
                : `${members.length} member${
                    members.length === 1
                      ? ""
                      : "s"
                  }`}
            </span>

          </div>

          {/* MEMBER TABLE */}

          <MemberTable
            members={members}
            currentUserId={currentUser?.id}
            canManage={canManage}
            onChangeRole={handleChangeRole}
            onRemove={handleRemove}
            loading={loading}
          />
        </>
      )}

      {/* =================================================
          ADD MEMBER MODAL
          ================================================= */}

      <AddMemberModal
        isOpen={modalOpen}
        onClose={() => {
          if (!loading) {
            setModalOpen(false);
          }
        }}
        onSubmit={handleAddMember}
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default Members;