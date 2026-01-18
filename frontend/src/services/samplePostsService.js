const API_URL = import.meta.env.VITE_API_URL;

export const samplePostService = {
  /**
   * Get all sample posts for the authenticated user
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @returns {Promise<Object>} Sample posts data
   */
  getSamplePosts: async (apiRequest) => {
    const response = await apiRequest(`${API_URL}/sample`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch sample posts");
    }

    return await response.json();
  },

  /**
   * Create a new sample post
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} content - The post content
   * @returns {Promise<Object>} Created sample post
   */
  createSamplePost: async (apiRequest, content) => {
    const response = await apiRequest(`${API_URL}/sample`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to create sample post");
    }

    return result;
  },

  /**
   * Update a sample post
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} id - The post ID
   * @param {string} content - The updated content
   * @returns {Promise<Object>} Updated sample post
   */
  updateSamplePost: async (apiRequest, id, content) => {
    const response = await apiRequest(`${API_URL}/sample/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update sample post");
    }

    return result;
  },

  /**
   * Delete a sample post
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} id - The post ID
   * @returns {Promise<Object>} Success message
   */
  deleteSamplePost: async (apiRequest, id) => {
    const response = await apiRequest(`${API_URL}/sample/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete sample post");
    }

    return result;
  },

  /**
   * Extract tone profile from sample posts (manual trigger)
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @returns {Promise<Object>} Extracted tone profile
   */
  extractTone: async (apiRequest) => {
    const response = await apiRequest(`${API_URL}/generation/tone/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to extract tone profile");
    }

    return result;
  },
};