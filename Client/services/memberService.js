import api from "./api";

export const getMembers = async (projectId) => {
  const response = await api.get(`/members/${projectId}`);
  return response.data;
};

export const addMember = async (projectId, email, role) => {
  const response = await api.post("/members", { projectId, email, role });
  return response.data;
};

export const updateMember = async (projectId, memberId, role) => {
  const response = await api.put(`/members/${projectId}/${memberId}`, { role });
  return response.data;
};

export const deleteMember = async (id) => {
  const response = await api.delete(`/members/${id}`);
  return response.data;
};

export const getAssignableMembers = async (projectId) => {
  const response = await api.get(
    `/members/${projectId}/assignable`
  );

  return response.data;
};