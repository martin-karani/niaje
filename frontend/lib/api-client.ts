// lib/api-client.ts

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Custom API client for interacting with the NestJS backend
 */
class ApiClient {
  /**
   * Make an authenticated request to the API
   */
  async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = localStorage.getItem('accessToken');

    // Prepare headers with authentication
    const headers = {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 errors (unauthorized) which could happen with expired tokens
      if (response.status === 401) {
        // Try to refresh the token
        const refreshed = await this.refreshToken();
        
        if (refreshed) {
          // Retry the request with the new token
          const newAccessToken = localStorage.getItem('accessToken');
          const newHeaders = {
            'Content-Type': 'application/json',
            ...(newAccessToken && { Authorization: `Bearer ${newAccessToken}` }),
            ...options.headers,
          };
          
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: newHeaders,
          });
          
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
        
        // If refresh failed or retry failed, redirect to login
        window.location.href = '/sign-in';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return false;
    }
  }

  // User-related API methods
  async getUserProfile() {
    return this.fetch<any>('/users/profile');
  }

  async updateUserProfile(data: any) {
    return this.fetch<any>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Subscription-related API methods
  async getUserSubscription() {
    return this.fetch<any>('/subscriptions/current');
  }

  async getSubscriptionDashboardUrl(customerId: string) {
    return this.fetch<{ url: string }>('/subscriptions/dashboard-url', {
      method: 'POST',
      body: JSON.stringify({ customerId }),
    });
  }

  // Add more API methods as needed for your application
}

// Export a singleton instance
export const apiClient = new ApiClient();