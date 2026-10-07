import api from "./api";

export const getRecentBugs = async () => {
  const response = await api.get("/bugs");
  return response.data;
};

export const createBug = async (data) => {
  const response = await api.post("/bugs", data);
  return response.data;
};

export const updateBug = async (bugId, bugData) => {
  const response = await api.put(
    `/bugs/${bugId}`,
    bugData
  );

  return response.data;
};

export const deleteBug = async (id) => {
  const response = await api.delete(`/bugs/${id}`);
  return response.data;
};

export const getProjectBugs = async (projectId) => {
  const response = await api.get(
    `/ai-projects/${projectId}/bugs`
  );

  console.log("AI PROJECT BUGS RESPONSE:", response.data);

  return response.data;
};

export const assignBug = async (bugId, userId) => {
  const response = await api.put(`/bugs/${bugId}/assign`, {
    assigned_to: userId,
  });

  return response.data;
};