import { ScoreRecord, ScoreSubmitResponse } from '../types/score';
import { submitScoreToCloudIfSignedIn } from '../services/userDataService';
import { sanitizeScoreRecord } from './validation';

export const submitScore = async (scoreData: ScoreRecord): Promise<ScoreSubmitResponse> => {
  try {
    const sanitized = sanitizeScoreRecord(scoreData);
    return await submitScoreToCloudIfSignedIn(sanitized);
  } catch (error) {
    return {
      success: false,
      cloudSynced: false,
      message: error instanceof Error ? error.message : 'Failed to submit score.',
    };
  }
};
