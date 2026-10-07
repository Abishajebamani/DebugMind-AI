import {
  uploadAttachment,
  getAttachments,
} from "../services/attachmentService.js";

export const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const attachment = await uploadAttachment(
      req.params.bugId,
      req.user.id,
      req.file
    );

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      attachment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const attachments = await getAttachments(
      req.params.bugId
    );

    res.status(200).json({
      success: true,
      count: attachments.length,
      attachments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};