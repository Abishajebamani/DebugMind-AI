import api from "./api";

export const getDashboard = async (projectId) => {
  const response = await api.get(`/dashboard/stats?projectId=${projectId}`);
  return response.data;
};

export const getRecentBugs = async (projectId) => {
  const response = await api.get(`/dashboard/recent-bugs?projectId=${projectId}`);
  return response.data;
};

export const getBugChart = async (projectId) => {
  const response = await api.get(`/dashboard/bug-chart?projectId=${projectId}`);
  return response.data;
};
