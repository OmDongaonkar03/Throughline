const API_URL = import.meta.env.VITE_API_URL;

export const dashboardService = {
  /**
   * Get activity statistics for a specific year
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {number} year - The year to fetch stats for
   * @returns {Promise<Object>} Activity statistics data
   */
  getActivityStats: async (apiRequest, year) => {
    const response = await apiRequest(`${API_URL}/checkin/stats?year=${year}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to fetch activity stats");
    }

    return await response.json();
  },

  /**
   * Get check-ins for a specific date
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} date - The date to fetch check-ins for (YYYY-MM-DD format)
   * @returns {Promise<Object>} Check-ins data for the specified date
   */
  getCheckInsByDate: async (apiRequest, date) => {
    const response = await apiRequest(`${API_URL}/checkin?date=${date}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to fetch check-ins");
    }

    return await response.json();
  },
};