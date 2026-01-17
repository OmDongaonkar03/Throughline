const API_URL = import.meta.env.VITE_API_URL;

export const toneProfileService = {
  /**
   * Get tone profile for the authenticated user
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @returns {Promise<Object>} Tone profile data
   */
  getToneProfile: async (apiRequest) => {
    const response = await apiRequest(`${API_URL}/tone`);

    const result = await response.json();

    if (!response.ok) {
      // If 404, it just means no profile exists yet - return empty state
      if (response.status === 404) {
        return { hasProfile: false, toneProfile: null };
      }
      throw new Error(result.message || "Failed to fetch tone profile");
    }

    return result;
  },

  /**
   * Update tone profile customizations
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {Object} data - The customization data
   * @returns {Promise<Object>} Updated tone profile
   */
  updateToneProfile: async (apiRequest, data) => {
    const response = await apiRequest(`${API_URL}/tone`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update tone profile");
    }

    return result;
  },
};