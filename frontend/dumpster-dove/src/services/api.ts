const API_BASE_URL = process.env.VITE_API_URL || 'https://dumps.online';
const AUTH_BASE_URL = process.env.VITE_API_URL || 'https://dumps.online';

export interface Post {
  id: number;
  content: string;
  image_url?: string;
  hashtag: string;
  created_at: string;
  user_token: string;
  fictional_name: string;
  reactions: {
    thumbs_up: number;
    heart: number;
    laugh: number;
    angry: number;
  };
}

export interface PostCreate {
  content: string;
  image_url?: string;
  hashtag: string;
  user_token: string;
  fictional_name: string;
}

export interface PostUpdate {
  content?: string;
  image_url?: string;
  hashtag?: string;
  fictional_name?: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}

export interface TokenResponse {
  token: string;
  message: string;
  created_at: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Token management
  async generateToken(): Promise<TokenResponse> {
    try {
      console.log('Making request to:', `${AUTH_BASE_URL}/generate-token`);
      const response = await fetch(`${AUTH_BASE_URL}/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Token response data:', data);
      return data;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }

  // Posts
  async createPost(post: PostCreate): Promise<Post> {
    console.log('API: Creating post with data:', post);
    return this.request<Post>('/create', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  async getPosts(hashtag?: string, page: number = 1, limit: number = 20): Promise<PostListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (hashtag) {
      params.append('hashtag', hashtag);
    }

    console.log('API: Getting posts with params:', { hashtag, page, limit });
    return this.request<PostListResponse>(`/posts?${params.toString()}`);
  }

  async getMyPosts(token: string, page: number = 1, limit: number = 10): Promise<PostListResponse> {
    const params = new URLSearchParams({
      token,
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<PostListResponse>(`/mydumps?${params.toString()}`);
  }

  async updatePost(postId: number, token: string, updates: PostUpdate): Promise<Post> {
    const params = new URLSearchParams({ token });
    return this.request<Post>(`/post/${postId}?${params.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deletePost(postId: number, token: string): Promise<{ message: string }> {
    const params = new URLSearchParams({ token });
    return this.request<{ message: string }>(`/post/${postId}?${params.toString()}`, {
      method: 'DELETE',
    });
  }

  async reactToPost(postId: number, reaction: string, token: string): Promise<Post> {
    const params = new URLSearchParams({ reaction, token });
    console.log('API: Reacting to post', { postId, reaction, token, url: `/post/${postId}/react?${params.toString()}` });
    return this.request<Post>(`/post/${postId}/react?${params.toString()}`, {
      method: 'POST',
    });
  }

  async uploadImage(file: File): Promise<{ image_url: string; message: string }> {
    console.log('API: Uploading image', { fileName: file.name, fileSize: file.size, fileType: file.type });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image upload error:', errorText);
      throw new Error(`Image upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Image uploaded successfully:', data);
    return data;
  }

  // S3 Upload functionality
  async uploadImageToS3(file: File): Promise<string> {
    try {
      console.log('Starting S3 upload for file:', file.name);
      
      // Step 1: Get presigned URL from backend
      const presignedResponse = await this.request('/upload/presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || 'image/jpeg'
        })
      });

      console.log('Got presigned URL:', presignedResponse);
      const { upload_url, image_url } = presignedResponse as { upload_url: string; image_url: string };

      // Step 2: Upload directly to S3
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'image/jpeg'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
      }

      console.log('S3 upload successful, image URL:', image_url);
      return image_url;
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
