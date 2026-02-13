import { ScoreRecord, ScoreSubmitResponse } from '../types/score';
import { submitScoreToCloudIfSignedIn } from '../services/userDataService';

export const submitScore = async (scoreData: ScoreRecord): Promise<ScoreSubmitResponse> => {
  try {
    return await submitScoreToCloudIfSignedIn(scoreData);
  } catch (error) {
    return {
      success: false,
      cloudSynced: false,
      message: error instanceof Error ? error.message : 'Failed to submit score.',
    };
  }
};