const API_URL = import.meta.env.VITE_API_URL;

export const postsService = {
  /**
   * Get all posts for the authenticated user
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {Object} params - Query parameters (type, limit, offset)
   * @returns {Promise<Object>} Posts data with pagination
   */
  getPosts: async (apiRequest, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.type) queryParams.append("type", params.type);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.offset) queryParams.append("offset", params.offset);

    const queryString = queryParams.toString();
    const url = `${API_URL}/generation/posts${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiRequest(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch posts");
    }

    return await response.json();
  },

  /**
   * Generate a new post (daily/weekly/monthly)
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} type - Post type ('daily', 'weekly', 'monthly')
   * @param {Object} data - Generation data (date only)
   * @returns {Promise<Object>} Generated post data
   */
  generatePost: async (apiRequest, type, data = {}) => {
    const response = await apiRequest(`${API_URL}/generation/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Failed to generate ${type} post`);
    }

    return result;
  },

  /**
   * Regenerate a base post (creates a new version)
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} postId - The base post ID
   * @returns {Promise<Object>} Regenerated post
   */
  regeneratePost: async (apiRequest, postId) => {
    const response = await apiRequest(
      `${API_URL}/generation/posts/${postId}/regenerate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to regenerate post");
    }

    return result;
  },

  /**
   * Get regeneration status
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @returns {Promise<Object>} Regeneration stats
   */
  getRegenStatus: async (apiRequest) => {
    const response = await apiRequest(`${API_URL}/generation/regen-status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch regeneration status");
    }

    return await response.json();
  },

  /**
   * Update a base post content (manual edit)
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} postId - The base post ID
   * @param {string} content - Updated content
   * @returns {Promise<Object>} Updated post
   */
  updatePost: async (apiRequest, postId, content) => {
    const response = await apiRequest(`${API_URL}/generation/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update post");
    }

    return result;
  },

  /**
   * Submit feedback for a post (thumbs up/down)
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} postId - The post ID
   * @param {number} rating - 1 = thumbs down, 2 = thumbs up
   * @param {string} issue - Optional issue type
   * @returns {Promise<Object>} Feedback response
   */
  submitFeedback: async (apiRequest, postId, rating, issue = null) => {
    const response = await apiRequest(`${API_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId, rating, issue }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to submit feedback");
    }

    return result;
  },

  /**
   * Get feedback for a post
   * @param {Function} apiRequest - The authenticated API request function from AuthContext
   * @param {string} postId - The post ID
   * @returns {Promise<Object>} Feedback data
   */
  getFeedback: async (apiRequest, postId) => {
    const response = await apiRequest(`${API_URL}/feedback/${postId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch feedback");
    }

    return await response.json();
  },
};