export interface ScoreRecord {
  nickname: string;
  country: string;
  score: number;
}

export interface ScoreSubmitResponse {
  success: boolean;
  message?: string;
} 