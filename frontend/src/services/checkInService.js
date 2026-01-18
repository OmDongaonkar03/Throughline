const API_URL = import.meta.env.VITE_API_URL;

export const checkInService = {
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

  /**
   * Create a new check-in
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} content - The check-in content
   * @returns {Promise<Object>} Created check-in data
   */
  createCheckIn: async (apiRequest, content) => {
    const response = await apiRequest(`${API_URL}/checkin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to create check-in");
    }

    return result;
  },
};