import { createBugSchema, updateBugSchema, assignBugSchema } from "../validators/bugValidator.js";
import { createBug, getBugs, updateBug,  deleteBug,   assignBug,  getMyBugs,  getProjectBugsService, } from "../services/bugService.js";

export const create = async (req, res) => {
  try {
    // Validate request body
    const validatedData = createBugSchema.parse(req.body);

    // Save bug
    const bug = await createBug(validatedData, req.user.id);

    res.status(201).json({
      success: true,
      message: "Bug created successfully",
      bug,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const bugs = await getBugs(
      req.user.id,
      req.query
    );

    res.status(200).json({
      success: true,
      count: bugs.length,
      bugs,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const update = async (req, res) => {
  try {
    const validatedData = updateBugSchema.parse(req.body);

    const bug = await updateBug(
      req.params.id,
      req.user.id,
      validatedData
    );

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bug updated successfully",
      bug,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const remove = async (req, res) => {
  try {
    const bug = await deleteBug(req.params.id, req.user.id);

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bug deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const assign = async (req, res) => {
  try {
    const validatedData = assignBugSchema.parse(req.body);

    const bug = await assignBug(
      req.params.id,
      validatedData.assigned_to
    );

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bug assigned successfully",
      bug,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const myBugs = async (req, res) => {
  try {
    const bugs = await getMyBugs(req.user.id);

    res.status(200).json({
      success: true,
      count: bugs.length,
      bugs,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectBugs = async (req, res) => {
  try {
    const bugs = await getProjectBugsService(
      req.params.projectId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      bugs,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};