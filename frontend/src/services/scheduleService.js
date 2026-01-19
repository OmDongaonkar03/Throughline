const API_URL = import.meta.env.VITE_API_URL;

export const scheduleService = {
  /**
   * Fetch schedule settings
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @returns {Promise<Object>} Schedule settings
   */
  getSettings: async (apiRequest) => {
    const response = await apiRequest(`${API_URL}/schedule/settings`);

    if (!response.ok) {
      throw new Error("Failed to fetch schedule settings");
    }

    const data = await response.json();
    return data.schedule;
  },

  /**
   * Update schedule settings
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated schedule settings
   */
  updateSettings: async (apiRequest, settings) => {
    const response = await apiRequest(`${API_URL}/schedule/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update schedule settings");
    }

    return data.schedule;
  },
};