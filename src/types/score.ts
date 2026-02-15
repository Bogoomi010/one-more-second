export interface ScoreRecord {
  nickname: string;
  country: string;
  score: number; // ranking score (final score)
  finalScore: number;
  normalScore: number;
}

export interface ScoreSubmitResponse {
  success: boolean;
  message?: string;
  cloudSynced: boolean;
}
