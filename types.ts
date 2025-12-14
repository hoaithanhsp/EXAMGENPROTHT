export interface FileData {
  name: string;
  type: string;
  data: string; // Base64 string
}

export enum AppState {
  IDLE,
  PROCESSING_STEP_1, // Đang sinh Đề 1 + Đáp án
  PROCESSING_STEP_2, // Đang sinh Đề 2 + Đáp án
  PROCESSING_STEP_3, // Đang sinh Đề 3 + Đáp án
  COMPLETE,          // Hoàn tất cả 3 bước
  ERROR
}

export interface GenerationConfig {
  model: string;
  temperature: number;
}