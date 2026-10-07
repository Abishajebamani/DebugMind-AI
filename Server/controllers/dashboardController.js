import {
  getDashboardStats,
  getRecentBugs,
  getBugChartData
} from "../services/dashboardService.js";

export const stats = async (req, res) => {
  try {
    const dashboard = await getDashboardStats(req.user.id);
    res.status(200).json({
      success: true,
      dashboard
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

export const recentBugs = async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "projectId is required"
    });
  }

  try {
    const bugs = await getRecentBugs(projectId, req.user.id);
    res.status(200).json({
      success: true,
      bugs
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

export const bugChart = async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "projectId is required"
    });
  }

  try {
    const chart = await getBugChartData(projectId, req.user.id);
    res.status(200).json({
      success: true,
      chart
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};