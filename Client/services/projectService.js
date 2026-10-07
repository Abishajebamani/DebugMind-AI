import api from "./api";

export const getProjects = async () => {
  const response = await api.get("/projects");
  return response.data;
};

export const createProject = async (data) => {
  const response = await api.post("/projects", data);
  return response.data;
};

export const updateProject = async (id, data) => {
  const response = await api.put(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

export const getProjectById = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const uploadProject = async (formData) => {
  const response = await api.post(
    "/ai-projects/upload",
    formData
  );

  return response.data;
};

export const scanProject = async (id) => {
  const response = await api.post(`/ai-projects/${id}/scan`);
  return response.data;
};

export const getProjectBugs = async (id) => {
  const response = await api.get(`/ai-projects/${id}/bugs`);
  return response.data;
};

export const analyzeBug = async (id) => {
  const response = await api.get(`/ai-projects/bugs/${id}/analyze`);
  return response.data;
};

export const fixBug = async (id) => {
  const response = await api.post(`/ai-projects/bugs/${id}/fix`);
  return response.data;
};

export const applyFix = async (id, payload) => {
  const response = await api.post(`/ai-projects/bugs/${id}/apply-fix`, payload);
  return response.data;
};

export const buildProject = async (id) => {
  const response = await api.post(`/ai-projects/${id}/build`);
  return response.data;
};

export const downloadRepairedProject = async (id) => {
  const response = await api.get(
    `/ai-projects/${id}/download-repaired`,
    {
      responseType: "blob",
    }
  );

  return response;
};

