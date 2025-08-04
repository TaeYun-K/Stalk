import AuthService from './authService';

export interface CommunityPostCreateRequestDto {
  category: string;
  title: string;
  content: string;
}

export interface CommunityPostUpdateRequestDto {
  category: string;
  title: string;
  content: string;
}

export interface CommunityPostSummaryDto {
  id: number;
  title: string;
  content: string;
  category: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostDetailDto {
  id: number;
  title: string;
  content: string;
  category: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export enum PostCategory {
  MARKET_ANALYSIS = 'MARKET_ANALYSIS',
  INVESTMENT_KNOWLEDGE = 'INVESTMENT_KNOWLEDGE',
  PORTFOLIO = 'PORTFOLIO',
  NEWS = 'NEWS'
}

class CommunityService {
  // List posts with authentication
  static async getPosts(category: string = 'INVESTMENT_KNOWLEDGE') {
    try {
      const response = await AuthService.authenticatedRequest(
        `/api/community/posts?category=${category}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  // Create post with authentication
  static async createPost(data: CommunityPostCreateRequestDto) {
    try {
      const response = await AuthService.authenticatedRequest(
        '/api/community/posts',
        {
          method: 'POST',
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Get post detail with authentication
  static async getPostDetail(postId: number) {
    try {
      const response = await AuthService.authenticatedRequest(
        `/api/community/posts/${postId}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch post detail');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching post detail:', error);
      throw error;
    }
  }

  // Update post with authentication
  static async updatePost(postId: number, data: CommunityPostUpdateRequestDto) {
    try {
      const response = await AuthService.authenticatedRequest(
        `/api/community/posts/${postId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Delete post with authentication
  static async deletePost(postId: number) {
    try {
      const response = await AuthService.authenticatedRequest(
        `/api/community/posts/${postId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}

export default CommunityService; 