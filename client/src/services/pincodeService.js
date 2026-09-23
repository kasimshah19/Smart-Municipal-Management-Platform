import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const pincodeService = {
  /**
   * Fetch postal office details for a specific 6-digit Pincode.
   * @param {string} pincode - 6 digit postal code
   * @returns {Promise<Array>} List of matching postal offices
   */
  getPincodeDetails: async (pincode) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pincodes/${pincode}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw new Error('Network error unable to lookup pincode.');
    }
  },

  /**
   * Fetch paginated list of pincodes for Admin Explorer.
   * @param {Object} params - { page, limit, search, district, type }
   * @returns {Promise<Object>} Paginated results
   */
  getAdminPincodes: async (params) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pincodes/admin/search`, { params });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw new Error('Network error unable to fetch pincodes.');
    }
  },

  /**
   * Fetch unique postal districts for filtering.
   * @returns {Promise<Object>} List of district strings
   */
  getPostalDistricts: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pincodes/admin/districts`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw new Error('Network error unable to fetch postal districts.');
    }
  }
};
