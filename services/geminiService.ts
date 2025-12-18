import { GoogleGenAI, Chat, Part, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { FileData } from "../types";

export const MODELS = [
  { id: "gemini-3-flash-preview", name: "Gemini 3.0 Flash Preview" },
  { id: "gemini-3-pro-preview", name: "Gemini 3.0 Pro Preview" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
];

export const createSession = (apiKey: string, model: string = "gemini-3-flash-preview"): Chat => {
  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: model,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      maxOutputTokens: 8192,
    },
  });
};

export const cloneSession = async (apiKey: string, oldChat: Chat, newModel: string): Promise<Chat> => {
  // Extract history from old chat
  // Note: The SDK might store history in specific way. 
  // We assume getHistory() is available or accessing internal state if needed.
  // For @google/genai, retrieving history might be done via fetching previous messages.
  // However, if the SDK doesn't expose clean history sync, we might need to assume 
  // we only need to carry over the context for safety or rely on the SDK's history property.

  // Attempting to get history. If strict type access fails, we might need a workaround.
  // Assuming standard usage:
  let history: Content[] = [];
  try {
    history = await oldChat.getHistory();
  } catch (e) {
    console.warn("Could not retrieve history for cloning, starting fresh context", e);
  }

  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: newModel,
    history: history,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      maxOutputTokens: 8192,
    },
  });
};


// Bước 1: Sinh Đề 1 & Đáp án 1 (Có File gốc)
export const generateStep1 = async (
  chat: Chat,
  file: FileData,
  onChunk: (text: string) => void
): Promise<void> => {
  const filePart: Part = {
    inlineData: {
      mimeType: file.type,
      data: file.data,
    },
  };

  const textPart: Part = {
    text: `BƯỚC 1:
Dựa vào file đề gốc, hãy sinh ra **ĐỀ BIẾN THỂ SỐ 1**.
Ngay sau đó, viết **ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ 1**.

Yêu cầu:
- Đề thi: Đủ số lượng câu như đề gốc. Đầy đủ nội dung.
- Đáp án: Câu dễ chỉ cần đáp án (1.A). Câu khó phải có lời giải vắn tắt.`
  };

  try {
    const result = await chat.sendMessageStream({
      message: [filePart, textPart]
    });

    for await (const chunk of result) {
      if (chunk.text) onChunk(chunk.text);
    }
  } catch (error) {
    console.error("Gemini Error Step 1:", error);
    throw error;
  }
};

// Bước 2 & 3: Sinh Đề tiếp theo (Dựa trên ngữ cảnh cũ)
export const generateNextStep = async (
  chat: Chat,
  stepNumber: number,
  onChunk: (text: string) => void
): Promise<void> => {
  const prompt = `BƯỚC ${stepNumber}:
Tiếp tục sinh ra **ĐỀ BIẾN THỂ SỐ ${stepNumber}** (Khác số liệu/cách hỏi so với các đề trước).
Ngay sau đó, viết **ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ ${stepNumber}**.

Yêu cầu:
- Đề thi: Đủ số lượng câu.
- Đáp án: Câu dễ chỉ cần đáp án. Câu khó phải có lời giải vắn tắt.`;

  try {
    const result = await chat.sendMessageStream({
      message: prompt
    });

    for await (const chunk of result) {
      if (chunk.text) onChunk(chunk.text);
    }
  } catch (error) {
    console.error(`Gemini Error Step ${stepNumber}:`, error);
    throw error;
  }
};
