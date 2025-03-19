import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Email {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  category?: string;
  is_interested: boolean;
}

export interface EmailsResponse {
  total: number;
  emails: Email[];
}

export interface SuggestedReply {
  text: string;
  confidence: number;
  timestamp: string;
}

export const emailService = {
  // Fetch all emails with optional filtering
  async getEmails(params?: {
    page?: number;
    size?: number;
    query?: string;
    category?: string;
  }): Promise<EmailsResponse> {
    const { data } = await api.get('/emails', { params });
    return data;
  },

  // Fetch a single email by ID
  async getEmail(id: string): Promise<Email> {
    const { data } = await api.get(`/email/${id}`);
    return data;
  },

  // Trigger email synchronization
  async syncEmails(): Promise<{ status: string; message: string }> {
    const { data } = await api.post('/sync');
    return data;
  },

  // Mark email as interested/not interested
  async markInterested(emailId: string, interested: boolean): Promise<{ status: string; message: string }> {
    const { data } = await api.post('/mark-interested', {
      email_id: emailId,
      interested,
    });
    return data;
  },

  // Get AI-suggested replies for an email
  async getSuggestedReplies(emailId: string): Promise<SuggestedReply[]> {
    const { data } = await api.get(`/suggest-replies/${emailId}`);
    return data.suggestions;
  },
};

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
        default:
          // Handle other errors
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;