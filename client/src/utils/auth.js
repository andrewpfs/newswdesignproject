// Get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Get user ID from localStorage
export const getUserId = () => {
  return localStorage.getItem("userId");
};

// Get user role from localStorage
export const getUserRole = () => {
  return localStorage.getItem("userRole");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Check if user is admin
export const isAdmin = () => {
  return getUserRole() === "admin";
};

// Get auth headers for API requests
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Logout user
export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  window.location.href = "/login";
};

// Fetch with auth
export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  // If unauthorized, redirect to login
  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error("Unauthorized");
  }

  return response;
};

