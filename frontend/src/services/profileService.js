const API_URL = import.meta.env.VITE_API_URL;

export const profileService = {
  /**
   * Update user profile data
   * @param {Object} apiRequest - The authenticated API request function from AuthContext
   * @param {Object} data - Profile data to update (name, bio, email)
   * @returns {Promise<Object>} Updated user data
   */
  updateProfile: async (apiRequest, data) => {
    const response = await apiRequest(`${API_URL}/profile/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update profile");
    }

    return result;
  },

  /**
   * Request a new verification email
   * @param {Object} apiRequest - The authenticated API request function from AuthContext
   * @returns {Promise<Object>} Success message
   */
  requestVerification: async (apiRequest) => {
    const response = await apiRequest(`${API_URL}/profile/verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to send verification email");
    }

    return result;
  },

  /**
   * Verify email with token
   * @param {string} token - Verification token from email link
   * @returns {Promise<Object>} Verification result
   */
  verifyEmail: async (token) => {
    const response = await fetch(`${API_URL}/profile/verify/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to verify email");
    }

    return result;
  },
};