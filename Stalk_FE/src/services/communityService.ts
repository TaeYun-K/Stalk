import AuthService from './authService';
import { 
  PostCategory, 
  CommunityPostSummaryDto, 
  CommunityPostDetailDto, 
  CommunityPostCreateRequestDto, 
  CommunityPostUpdateRequestDto,
  CommunityCommentDto,
  CommunityCommentCreateRequestDto,
  CommunityCommentUpdateRequestDto
} from '@/types';

class CommunityService {
  // List posts without authentication (public API)
  static async getPosts(category: string = PostCategory.ALL): Promise<{ content: CommunityPostSummaryDto[] }> {
    try {
      console.log('Making request to:', `/api/community/posts?category=${category}`);
      const response = await fetch(
        `/api/community/posts?category=${category}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      console.log('Raw API response:', data);
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
        if (response.status === 401) {
          // 토큰 만료 시 새로고침 시도
          console.log('토큰이 만료되었습니다. 새로고침을 시도합니다.');
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            // 새 토큰으로 다시 시도
            const retryResponse = await AuthService.authenticatedRequest(
              '/api/community/posts',
              {
                method: 'POST',
                body: JSON.stringify(data)
              }
            );
            
            if (!retryResponse.ok) {
              throw new Error('Failed to create post after token refresh');
            }
            
            return await retryResponse.json();
          } else {
            throw new Error('토큰 새로고침에 실패했습니다. 다시 로그인해주세요.');
          }
        }
        throw new Error('Failed to create post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Get post detail without authentication (public API)
  static async getPostDetail(postId: number): Promise<CommunityPostDetailDto> {
    try {
      const response = await fetch(
        `/api/community/posts/${postId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
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
        if (response.status === 401) {
          // 토큰 만료 시 새로고침 시도
          console.log('토큰이 만료되었습니다. 새로고침을 시도합니다.');
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            // 새 토큰으로 다시 시도
            const retryResponse = await AuthService.authenticatedRequest(
              `/api/community/posts/${postId}`,
              {
                method: 'PUT',
                body: JSON.stringify(data)
              }
            );
            
            if (!retryResponse.ok) {
              throw new Error('Failed to update post after token refresh');
            }
            
            return await retryResponse.json();
          } else {
            throw new Error('토큰 새로고침에 실패했습니다. 다시 로그인해주세요.');
          }
        }
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
        if (response.status === 401) {
          // 토큰 만료 시 새로고침 시도
          console.log('토큰이 만료되었습니다. 새로고침을 시도합니다.');
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            // 새 토큰으로 다시 시도
            const retryResponse = await AuthService.authenticatedRequest(
              `/api/community/posts/${postId}`,
              {
                method: 'DELETE'
              }
            );
            
            if (!retryResponse.ok) {
              throw new Error('Failed to delete post after token refresh');
            }
            
            return await retryResponse.json();
          } else {
            throw new Error('토큰 새로고침에 실패했습니다. 다시 로그인해주세요.');
          }
        }
        throw new Error('Failed to delete post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Get comments for a post
  static async getComments(postId: number, pageNo: number = 1, pageSize: number = 10): Promise<{ content: CommunityCommentDto[] }> {
    try {
      const response = await fetch(
        `/api/community/posts/${postId}/comments?pageNo=${pageNo}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Create comment with authentication
  static async createComment(postId: number, data: CommunityCommentCreateRequestDto) {
    try {
      const response = await AuthService.authenticatedRequest(
        `/api/community/posts/${postId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰 만료 시 새로고침 시도
          console.log('토큰이 만료되었습니다. 새로고침을 시도합니다.');
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            // 새 토큰으로 다시 시도
            const retryResponse = await AuthService.authenticatedRequest(
              `/api/community/posts/${postId}/comments`,
              {
                method: 'POST',
                body: JSON.stringify(data)
              }
            );
            
            if (!retryResponse.ok) {
              throw new Error('Failed to create comment after token refresh');
            }
            
            return await retryResponse.json();
          } else {
            throw new Error('토큰 새로고침에 실패했습니다. 다시 로그인해주세요.');
          }
        }
        throw new Error('Failed to create comment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Update comment with authentication
  static async updateComment(commentId: number, data: CommunityCommentUpdateRequestDto) {
    try {
      const response = await AuthService.authenticatedRequest(
        `/api/community/comments/${commentId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  // Delete comment with authentication
  static async deleteComment(commentId: number) {
    try {
      const response = await AuthService.authenticatedRequest(
        `/api/community/comments/${commentId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰 만료 시 새로고침 시도
          console.log('토큰이 만료되었습니다. 새로고침을 시도합니다.');
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            // 새 토큰으로 다시 시도
            const retryResponse = await AuthService.authenticatedRequest(
              `/api/community/comments/${commentId}`,
              {
                method: 'DELETE'
              }
            );
            
            if (!retryResponse.ok) {
              throw new Error('Failed to delete comment after token refresh');
            }
            
            return await retryResponse.json();
          } else {
            throw new Error('토큰 새로고침에 실패했습니다. 다시 로그인해주세요.');
          }
        }
        throw new Error('Failed to delete comment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // 본인 작성 글 조회 (투자 지식iN용)
  static async getMyPosts(category: string = 'ALL', pageNo: number = 1, pageSize: number = 10): Promise<{ content: CommunityPostSummaryDto[] }> {
    try {
      // 백엔드에서 authorId를 처리하지 않으므로 임시로 모든 글을 가져온 후 필터링
      const queryParams = new URLSearchParams({
        category: category,
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString()
      });

      const response = await AuthService.authenticatedRequest(
        `/api/community/posts?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 현재 사용자 정보 가져오기
      const userInfo = AuthService.getUserInfo();
      if (!userInfo) {
        return { content: [] };
      }

      // 본인이 작성한 글만 필터링
      const myPosts = data.result.content.filter((post: any) => {
        // authorName이 현재 사용자의 이름/닉네임과 일치하는지 확인
        return post.authorName === userInfo.name || post.authorName === userInfo.nickname;
      });

      return { content: myPosts };
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw error;
    }
  }
}

export default CommunityService; 