import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { FileData } from "../types";

// Kiểu dữ liệu cho chat model
type ChatModel = any;

export const createSession = (apiKey: string): ChatModel => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3-pro-preview",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      maxOutputTokens: 8192,
    },
  });
  
  // Tạo chat session
  const chat = model.startChat({
    history: [],
  });
  
  return chat;
};

// Bước 1: Sinh Đề 1 & Đáp án 1 (Có File gốc)
export const generateStep1 = async (
  chat: ChatModel,
  file: FileData,
  onChunk: (text: string) => void
): Promise<void> => {
  const prompt = `BƯỚC 1:
Dựa vào file đề gốc, hãy sinh ra **ĐỀ BIẾN THỂ SỐ 1**.
Ngay sau đó, viết **ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ 1**.

⚠️ QUAN TRỌNG NHẤT:
1. **ĐẾM SỐ CÂU HỎI TRONG ĐỀ GỐC (Ví dụ: 50 câu).**
2. **SINH RA ĐÚNG SỐ LƯỢNG CÂU ĐÓ KHÔNG ĐƯỢC THIẾU CÂU NÀO.**
3. Đảm bảo cấu trúc (Phần I, Phần II...) giống hệt đề gốc.

Yêu cầu:
- Đề thi: Giữ nguyên số lượng câu. Đầy đủ nội dung từng câu.
- Đáp án: Câu dễ chỉ cần đáp án (1.A). Câu khó phải có lời giải vắn tắt.`;

  try {
    // Chuyển đổi base64 data thành Part
    const imagePart = {
      inlineData: {
        data: file.data,
        mimeType: file.type,
      },
    };

    // Gửi message với file và prompt
    const result = await chat.sendMessageStream([imagePart, prompt]);

    // Xử lý stream response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        onChunk(chunkText);
      }
    }
  } catch (error: any) {
    console.error("Gemini Error Step 1:", error);
    throw new Error(error?.message || "Lỗi khi sinh đề bước 1");
  }
};

// Bước 2 & 3: Sinh Đề tiếp theo (Dựa trên ngữ cảnh cũ)
export const generateNextStep = async (
  chat: ChatModel,
  stepNumber: number,
  onChunk: (text: string) => void
): Promise<void> => {
  const prompt = `BƯỚC ${stepNumber}:
Tiếp tục sinh ra **ĐỀ BIẾN THỂ SỐ ${stepNumber}** (Khác số liệu/cách hỏi so với các đề trước).
Ngay sau đó, viết **ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ ${stepNumber}**.

⚠️ QUAN TRỌNG NHẤT:
1. **ĐẢM BẢO SỐ LƯỢNG CÂU HỎI PHẢI BẰNG ĐỀ GỐC**.
2. **KHÔNG ĐƯỢC TỰ Ý RÚT GỌN HAY LÀM MẪU.**
3. Phải sinh ra TOÀN BỘ đề thi.

Yêu cầu:
- Đề thi: Đủ số lượng câu.
- Đáp án: Câu dễ chỉ cần đáp án. Câu khó phải có lời giải vắn tắt.`;

  try {
    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        onChunk(chunkText);
      }
    }
  } catch (error: any) {
    console.error(`Gemini Error Step ${stepNumber}:`, error);
    throw new Error(error?.message || `Lỗi khi sinh đề bước ${stepNumber}`);
  }
};
