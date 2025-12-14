import { GoogleGenAI, Chat, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { FileData } from "../types";

export const createSession = (apiKey: string): Chat => {
  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: "gemini-2.5-flash",
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