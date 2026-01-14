const API_URL = import.meta.env.VITE_API_URL;

export const notificationService = {
  /**
   * Fetch notification settings
   * @param {Object} apiRequest - The authenticated API request function from AuthContext
   * @returns {Promise<Object>} Notification settings
   */
  getSettings: async (apiRequest) => {
    const response = await apiRequest(`${API_URL}/notifications`);

    if (!response.ok) {
      throw new Error("Failed to fetch notification settings");
    }

    const data = await response.json();
    return data.settings;
  },

  /**
   * Update notification settings
   * @param {Object} apiRequest - The authenticated API request function from AuthContext
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated notification settings
   */
  updateSettings: async (apiRequest, settings) => {
    const response = await apiRequest(`${API_URL}/notifications`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error("Failed to update notification settings");
    }

    const data = await response.json();
    return data.settings;
  },
};