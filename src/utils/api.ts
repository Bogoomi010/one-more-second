import { ScoreRecord, ScoreSubmitResponse } from '../types/score';

// TODO: 실제 서버 구현 후 API 호출로 변경
export const submitScore = async (scoreData: ScoreRecord): Promise<ScoreSubmitResponse> => {
  return new Promise((resolve) => {
    // 임시로 1초 후에 성공 응답을 반환
    setTimeout(() => {
      console.log('Score submitted:', scoreData);
      resolve({
        success: true,
        message: '스코어가 성공적으로 저장되었습니다.',
      });
    }, 1000);
  });
}; 