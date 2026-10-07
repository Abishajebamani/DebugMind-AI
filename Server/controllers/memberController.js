import {
  createMemberInputSchema,
  updateMemberRoleSchema,
} from "../validators/memberValidator.js";

import {
  addMember,
  findProjectById,
  findProjectMembership,
  findUserByEmail,
  findMemberById,
  getMembers,
  removeMember,
  updateMemberRole,
  ensureProjectOwnerMembership,
  getAssignableMembers as getAssignableMembersService,
} from "../services/memberService.js";

const canManageMembers = (userRole, membershipRole) => {
  if (userRole === "Admin") return true;

  return membershipRole === "Project Manager";
};

const canViewMembers = (userRole, membershipRole) => {
  if (userRole === "Admin") return true;

  return Boolean(membershipRole);
};

// ======================================================
// ADD MEMBER
// ======================================================

export const create = async (req, res) => {
  try {
    const data = createMemberInputSchema.parse(req.body);
    
    console.log("ADD MEMBER AUTH:");
    console.log("User ID:", req.user.id);
    console.log("User Role:", req.user.role);
    console.log("Project ID:", data.projectId);

    const project = await findProjectById(data.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const currentMembership = await findProjectMembership(
      data.projectId,
      req.user.id
    );
    console.log("Current Membership:", currentMembership);

    if (!canManageMembers(req.user.role, currentMembership?.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to manage project members",
      });
    }

    const user = await findUserByEmail(data.email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Ask the user to register first.",
      });
    }

    const member = await addMember({
      project_id: data.projectId,
      user_id: user.id,
      role: data.role,
    });

    return res.status(201).json({
      success: true,
      member,
    });
  } catch (error) {
    if (
      error.message === "User is already a member of this project" ||
      error.message?.includes("duplicate key")
    ) {
      return res.status(409).json({
        success: false,
        message: "User is already a member of this project",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET MEMBERS
// ======================================================

export const getAll = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const project = await findProjectById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    let currentMembership = await findProjectMembership(
      projectId,
      req.user.id
    );

    // Existing projects may not have their owner inside
    // project_members yet. Create that membership automatically.
    if (!currentMembership && project.user_id === req.user.id) {
      currentMembership = await ensureProjectOwnerMembership(
        projectId,
        req.user.id
      );
    }

    if (!canViewMembers(req.user.role, currentMembership?.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view members",
      });
    }

    const members = await getMembers(projectId);

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get Members Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE MEMBER ROLE
// ======================================================

export const update = async (req, res) => {
  try {
    const data = updateMemberRoleSchema.parse(req.body);

    const memberId = req.params.id;
    const projectId = req.params.projectId;

    const project = await findProjectById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    let currentMembership = await findProjectMembership(
      projectId,
      req.user.id
    );

    // Make sure an existing project owner has membership.
    if (!currentMembership && project.user_id === req.user.id) {
      currentMembership = await ensureProjectOwnerMembership(
        projectId,
        req.user.id
      );
    }

    if (!canManageMembers(req.user.role, currentMembership?.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to manage project members",
      });
    }

    const member = await updateMemberRole(memberId, data.role);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      member,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// REMOVE MEMBER
// ======================================================
export const remove = async (req, res) => {
  try {
    const memberId = req.params.id;

    // Find the member being removed
    const member = await findMemberById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Find current user's membership in the same project
    const currentMembership = await findProjectMembership(
      member.project_id,
      req.user.id
    );

    // Only Admin or Project Manager can remove members
    if (!canManageMembers(req.user.role, currentMembership?.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to remove project members",
      });
    }

    // ==================================================
    // PROJECT MANAGER PROTECTION
    // ==================================================

    if (member.role === "Project Manager") {
      // Get all members of this project
      const projectMembers = await getMembers(member.project_id);

      // Count Project Managers in THIS project only
      const projectManagers = projectMembers.filter(
        (projectMember) =>
          projectMember.role === "Project Manager"
      );

      // Do not allow removing the only Project Manager
      if (projectManagers.length <= 1) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot remove the only Project Manager. Assign another Project Manager first.",
        });
      }
    }

    const removedMember = await removeMember(memberId);

    return res.json({
      success: true,
      message: "Member removed successfully",
      member: removedMember,
    });
  } catch (error) {
    console.error("Remove Member Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAssignableMembers = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    console.log("=================================");
    console.log("GET ASSIGNABLE MEMBERS");
    console.log("Project ID:", projectId);
    console.log("User:", req.user);
    console.log("=================================");

    const project = await findProjectById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const currentMembership = await findProjectMembership(
      projectId,
      req.user.id
    );

    if (
      req.user.role !== "Admin" &&
      !currentMembership &&
      project.user_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }
    const members = await getAssignableMembersService(projectId);

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("=================================");
    console.error("GET ASSIGNABLE MEMBERS ERROR");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load assignable members",
    });
  }
};