import { ScoreRecord, ScoreSubmitResponse } from '../types/score';
import { submitScoreToCloudIfSignedIn } from '../services/userDataService';

export const submitScore = async (scoreData: ScoreRecord): Promise<ScoreSubmitResponse> => {
  const cloudResult = await submitScoreToCloudIfSignedIn(scoreData);
  if (cloudResult.success) {
    return cloudResult;
  }

  return {
    success: true,
    message: '클라우드 저장에 실패했지만 로컬 기록은 저장되었습니다.',
  };
}; 