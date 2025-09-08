
export interface Quiz1Question {
  definition: string;
  word: string; // The correct word
  options: string[]; // A list of word options
}

export interface Quiz2Question {
  word: string;
  sentence: string;
  options: string[];
}

export interface Quiz3Question {
  word: string;
  scenario: string;
  options: string[];
}

export type QuizQuestion = Quiz1Question | Quiz2Question | Quiz3Question;

export interface LearningCard {
  word: string;
  charDefinitions: { char: string; definition: string }[];
  definition: string;
  sentences: string[];
}

export enum QuizType {
  DEFINITION = 'definition',
  SENTENCE = 'sentence',
  CONCEPT = 'concept',
}

export enum AppState {
  INPUT = 'INPUT',
  POST_ANALYSIS = 'POST_ANALYSIS',
  SELECT = 'SELECT',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  LEARN = 'LEARN',
  PRINT_VIEW = 'PRINT_VIEW',
  PRINT_LEARNING = 'PRINT_LEARNING',
  VOICE_MATERIAL = 'VOICE_MATERIAL',
  VOICE_WORD_MATERIAL = 'VOICE_WORD_MATERIAL',
  VOICE_WORD_MATERIAL_2 = 'VOICE_WORD_MATERIAL_2',
}

export interface TTSSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  volume: number;
}

export const IMAGE_STYLES = [
    "一般繪本風格", 
    "吉卜力風格", 
    "著色風格", 
    "真實圖片風格",
    "像素藝術風格",
    "水彩畫風格"
] as const;

export type ImageStyle = typeof IMAGE_STYLES[number];

export interface CustomContent {
  imageUrl: string;
  sentence: string;
}

export interface HistoryItem {
    name: string;
    content: string;
}