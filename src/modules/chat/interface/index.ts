export interface ChatResponse<T> {
  success: boolean;
  error?: string | null;
  data?: T | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  nickName: string;
  profileUrl: string | null;
  master?: boolean;
}

export interface MessageAuthor {
  authorId: string;
  nickName?: string;
  profileUrl?: string;
}
