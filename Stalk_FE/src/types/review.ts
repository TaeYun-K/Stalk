export interface ReviewCreateRequestDto {
  consultationId: number;
  rating: number; // 1-5
  content: string;
}

export interface ReviewUpdateRequestDto {
  rating: number; // 1-5
  content: string;
}

export interface ReviewCreateResponseDto {
  reviewId: number;
  message: string;
}

export interface ReviewResponseDto {
  reviewId: number;
  consultationId: number;
  advisorName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface AdvisorReviewResponseDto {
  reviewId: number;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
}


