const difficultyTranslations = {
  ko: {
    difficultyModal: {
      title: '난이도 변경',
      subtitle: '기믹 조합에 따라 난이도와 점수 보정이 달라집니다. 오늘은 어떤 고난을 고를까요?',
      dialogAria: '난이도 및 기믹 설정',
      closeAria: '닫기',
      scoreFormula: '예상 점수 공식: finalScore = baseScore + adjustmentScore',
      scorePreview:
        '{{baseScore}}초 기준 -> {{finalScore}}점 (기본 {{baseScore}} + 보정 {{adjustmentScore}})',
      toggleOn: 'ON',
      toggleOff: 'OFF',
      apply: '적용',
      cancel: '취소',
    },
    gameplayModifiers: {
      'crossline-40-80': {
        name: '바둑판 난사',
        description:
          '정사각형 맵 가장자리(상/하/좌/우)에서 직선 탄환이 날아옵니다. 최대 2개 레인이 십자 교차 패턴을 만듭니다.',
      },
      'shrink-field-80': {
        name: '압축 아레나',
        description: '플레이 가능한 맵이 80%로 축소됩니다. 숨 쉴 공간이 줄어듭니다.',
      },
      'haste-bullets-110': {
        name: '스피드 포화',
        description: '기본 추적 탄환의 속도가 120%로 증가합니다.',
      },
      'one-life': {
        name: '인생은 한 방!',
        description: '목숨이 3개에서 1개로 줄어듭니다. 진짜 실전 모드입니다.',
      },
      'critical-shot': {
        name: '회심의 한 발',
        description: '주기적으로 플레이어를 조준하는 200% 속도의 특수 탄환이 추가됩니다.',
      },
    },
  },
  en: {
    difficultyModal: {
      title: 'Difficulty',
      subtitle:
        'Your gimmick mix changes both danger and score bonus. Pick your flavor of chaos.',
      dialogAria: 'Difficulty and gimmick settings',
      closeAria: 'Close',
      scoreFormula: 'Score formula preview: finalScore = baseScore + adjustmentScore',
      scorePreview:
        'At {{baseScore}}s -> {{finalScore}} pts (base {{baseScore}} + bonus {{adjustmentScore}})',
      toggleOn: 'ON',
      toggleOff: 'OFF',
      apply: 'Apply',
      cancel: 'Cancel',
    },
    gameplayModifiers: {
      'crossline-40-80': {
        name: 'Checkerboard Barrage',
        description:
          'Straight bullets launch from all four edges of the square map. Up to two lanes can cross in a plus pattern.',
      },
      'shrink-field-80': {
        name: 'Compressed Arena',
        description: 'The playable field shrinks to 80%. Less room, more panic.',
      },
      'haste-bullets-110': {
        name: 'Speed Saturation',
        description: 'Base tracking bullets move at 120% speed.',
      },
      'one-life': {
        name: 'One Shot Life',
        description: 'Lives drop from 3 to 1. No warm-up, only clutch.',
      },
      'critical-shot': {
        name: 'Clutch Round',
        description: 'A periodic special bullet targets the player at 200% speed.',
      },
    },
  },
  ja: {
    difficultyModal: {
      title: '難易度変更',
      subtitle: 'ギミックの組み合わせで難易度とスコア補正が変わります。今日はどの修羅場にしますか？',
      dialogAria: '難易度とギミックの設定',
      closeAria: '閉じる',
      scoreFormula: '予想スコア式: finalScore = baseScore + adjustmentScore',
      scorePreview:
        '{{baseScore}}秒基準 -> {{finalScore}}点 (基本 {{baseScore}} + 補正 {{adjustmentScore}})',
      toggleOn: 'ON',
      toggleOff: 'OFF',
      apply: '適用',
      cancel: 'キャンセル',
    },
    gameplayModifiers: {
      'crossline-40-80': {
        name: '碁盤乱れ撃ち',
        description:
          '正方形マップの四辺から直線弾が発射されます。最大2レーンで十字交差パターンが発生します。',
      },
      'shrink-field-80': {
        name: '圧縮アリーナ',
        description: 'プレイ領域が80%に縮小。回避スペースがぐっと狭くなります。',
      },
      'haste-bullets-110': {
        name: 'スピード飽和',
        description: '基本追尾弾の速度が120%に上昇します。',
      },
      'one-life': {
        name: '人生は一発！',
        description: 'ライフが3から1に減少。ミスは一度きりです。',
      },
      'critical-shot': {
        name: '会心の一発',
        description: 'プレイヤーを狙う200%速度の特弾が周期的に追加されます。',
      },
    },
  },
  'zh-CN': {
    difficultyModal: {
      title: '调整难度',
      subtitle: '机关组合会同时改变难度和分数加成。今天想挑战哪种地狱模式？',
      dialogAria: '难度与机关设置',
      closeAria: '关闭',
      scoreFormula: '预估分数公式: finalScore = baseScore + adjustmentScore',
      scorePreview:
        '以 {{baseScore}} 秒为基准 -> {{finalScore}} 分 (基础 {{baseScore}} + 加成 {{adjustmentScore}})',
      toggleOn: 'ON',
      toggleOff: 'OFF',
      apply: '应用',
      cancel: '取消',
    },
    gameplayModifiers: {
      'crossline-40-80': {
        name: '棋盘乱射',
        description: '在正方形地图四边发射直线子弹，最多两条轨道会形成十字交叉弹幕。',
      },
      'shrink-field-80': {
        name: '压缩竞技场',
        description: '可活动区域缩小到80%，走位空间明显变窄。',
      },
      'haste-bullets-110': {
        name: '速度饱和',
        description: '基础追踪子弹速度提升到120%。',
      },
      'one-life': {
        name: '人生一发！',
        description: '生命值从3降到1，失误空间几乎为零。',
      },
      'critical-shot': {
        name: '会心一弹',
        description: '会周期性追加一枚以200%速度瞄准玩家的特弹。',
      },
    },
  },
};

export default difficultyTranslations;
