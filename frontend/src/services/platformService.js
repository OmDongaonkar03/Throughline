const API_URL = import.meta.env.VITE_API_URL;

export const platformService = {
  /**
   * Fetch platform settings
   * @param {Object} apiRequest - The authenticated API request function from AuthContext
   * @returns {Promise<Object>} Platform settings
   */
  getSettings: async (apiRequest) => {
    const response = await apiRequest(`${API_URL}/platform/settings`);

    if (!response.ok) {
      throw new Error("Failed to fetch platform settings");
    }

    const data = await response.json();
    return data.settings;
  },

  /**
   * Update platform settings
   * @param {Object} apiRequest - The authenticated API request function from AuthContext
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated platform settings
   */
  updateSettings: async (apiRequest, settings) => {
    const response = await apiRequest(`${API_URL}/platform/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update platform settings");
    }

    return data.settings;
  },
};