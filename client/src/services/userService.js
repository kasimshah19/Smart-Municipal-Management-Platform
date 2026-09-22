import api from './api';

const userService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  updateUserRoleAndScope: async (id, roleData) => {
    const response = await api.patch(`/users/${id}/role-scope`, roleData);
    return response.data;
  }
};

export default userService;
