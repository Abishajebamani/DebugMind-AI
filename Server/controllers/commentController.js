import { createCommentSchema } from "../validators/commentValidator.js";
import {
  createComment,
  getComments,
} from "../services/commentService.js";

// Add Comment
export const create = async (req, res) => {
  try {
    const validatedData = createCommentSchema.parse(req.body);

    const comment = await createComment(
      req.params.bugId,
      req.user.id,
      validatedData.comment
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Comments
export const getAll = async (req, res) => {
  try {
    const comments = await getComments(req.params.bugId);

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};