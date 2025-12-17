import React, { useState, useEffect, useRef } from 'react';
import { Download, Play, RefreshCw, AlertCircle, Calculator, Loader2, FileCheck, ArrowRight, Settings } from 'lucide-react';
import { Chat } from "@google/genai";
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import ApiKeyModal from './components/ApiKeyModal';
import { createSession, generateStep1, generateNextStep, cloneSession, MODELS } from './services/geminiService';
import { exportToDoc } from './utils/exportUtils';
import { FileData, AppState } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY || '';
  });
  const [file, setFile] = useState<FileData | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Content for each column
  const [col1, setCol1] = useState<string>('');
  const [col2, setCol2] = useState<string>('');
  const [col3, setCol3] = useState<string>('');

  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const currentModelIndexRef = useRef<number>(0);

  useEffect(() => {
    if (!apiKey) {
      setShowApiKeyModal(true);
    } else {
      setShowApiKeyModal(false);
    }
  }, [apiKey]);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  /**
   * Helper to execute a step with model fallback.
   */
  const executeStepWithRetry = async (
    stepName: string,
    executeFn: (chat: Chat) => Promise<void>,
    resetOutput: () => void
  ) => {
    let lastError: any = null;

    // Attempt with current model, then valid backups
    // We start from currentModelIndexRef.current to avoid resetting to primary if we already switched
    for (let i = currentModelIndexRef.current; i < MODELS.length; i++) {
      try {
        await executeFn(chatSessionRef.current!);
        // Success
        currentModelIndexRef.current = i; // Upkeep the working model
        return;
      } catch (err: any) {
        console.warn(`Step '${stepName}' failed with model ${MODELS[i].id}:`, err);
        lastError = err;

        const isLastModel = i === MODELS.length - 1;
        if (!isLastModel) {
          // Prepare for fallback
          resetOutput();
          const nextModel = MODELS[i + 1].id;
          console.log(`Switching to fallback model: ${nextModel}`);

          // Reconstruct session with new model
          if (chatSessionRef.current) {
            // If we are deep in the process (Step 2 or 3), we need to preserve history
            // If we are at Step 1, createSession is fine, but cloneSession handles empty history too (mostly).
            // Ideally for Step 1 we might want fresh session, but cloneSession is safer if we just want to swap model on existing object concept

            // However, if Step 1 failed, history is likely empty or broken.
            // If Step 2 failed, we need Step 1's context.
            chatSessionRef.current = await cloneSession(apiKey, chatSessionRef.current, nextModel);
          }
        }
      }
    }

    throw lastError;
  };

  // Orchestrator for the 3 steps
  const runProcess = async () => {
    if (!file || !apiKey) {
      if (!apiKey) setShowApiKeyModal(true);
      return;
    }

    // Reset model preference to default (0) on new run
    currentModelIndexRef.current = 0;

    // --- STEP 1 ---
    setState(AppState.PROCESSING_STEP_1);
    setCol1(''); setCol2(''); setCol3('');
    setError(null);

    // Initial Session
    chatSessionRef.current = createSession(apiKey, MODELS[0].id);

    try {
      await executeStepWithRetry(
        "Step 1",
        async (chat) => {
          await generateStep1(chat, file, (chunk) => setCol1(prev => prev + chunk));
        },
        () => setCol1('') // Reset if retrying
      );
    } catch (err: any) {
      handleError(err);
      return;
    }

    // --- STEP 2 ---
    setState(AppState.PROCESSING_STEP_2);
    try {
      await executeStepWithRetry(
        "Step 2",
        async (chat) => {
          await generateNextStep(chat, 2, (chunk) => setCol2(prev => prev + chunk));
        },
        () => setCol2('')
      );
    } catch (err: any) {
      handleError(err);
      return;
    }

    // --- STEP 3 ---
    setState(AppState.PROCESSING_STEP_3);
    try {
      await executeStepWithRetry(
        "Step 3",
        async (chat) => {
          await generateNextStep(chat, 3, (chunk) => setCol3(prev => prev + chunk));
        },
        () => setCol3('')
      );
      setState(AppState.COMPLETE);
    } catch (err: any) {
      handleError(err);
      return;
    }
  };

  const handleError = (err: any) => {
    setState(AppState.ERROR);
    // Display raw error message
    const message = err.message || JSON.stringify(err);
    setError(message);
    console.error("Full Error Object:", err);
  };

  const handleExport = () => {
    if (!col1 && !col2 && !col3) return;
    const fullContent = `${col1}\n\n***\n\n${col2}\n\n***\n\n${col3}`;
    const fileName = file ? `Bo_3_De_Thi_${file.name.split('.')[0]}` : 'ExamGen_Output';
    exportToDoc(fullContent, fileName);
  };

  const reset = () => {
    setFile(null);
    setCol1(''); setCol2(''); setCol3('');
    setState(AppState.IDLE);
    setError(null);
    chatSessionRef.current = null;
    currentModelIndexRef.current = 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col">
      <ApiKeyModal isOpen={showApiKeyModal} onSave={handleSaveApiKey} />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">EXAMGEN PRO</h1>
              <p className="text-xs text-gray-500 font-medium mt-1">Phát triển bởi Trần Hoài Thanh</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              title="Cài đặt API Key"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">API Key</span>
            </button>

            <button
              onClick={handleExport}
              disabled={!col1}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Tải Word (.docx)</span>
            </button>
            {state === AppState.COMPLETE && (
              <button
                onClick={reset}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                title="Làm mới"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col">
        {state === AppState.IDLE ? (
          // --- IDLE STATE: UPLOAD ---
          <div className="max-w-2xl mx-auto mt-10 space-y-8 w-full">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tải đề gốc lên</h2>
              <p className="text-lg text-gray-600">Hệ thống sẽ tự động thực hiện quy trình 3 bước: Sinh Đề 1, Đề 2, Đề 3 kèm đáp án chi tiết.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <FileUpload
                selectedFile={file}
                onFileSelect={setFile}
                onClear={reset}
              />

              <button
                onClick={runProcess}
                disabled={!file}
                className="w-full mt-6 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
              >
                <Play className="w-6 h-6" />
                <span>BẮT ĐẦU QUY TRÌNH 3 BƯỚC</span>
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="break-all">{error}</span>
              </div>
            )}
          </div>
        ) : (
          // --- PROCESSING/RESULT STATE: 3 COLUMNS ---
          <div className="flex-1 max-w-[1920px] mx-auto w-full flex flex-col">

            {/* Progress Bar / Status */}
            <div className="mb-6 flex justify-center">
              <div className="bg-white rounded-full shadow-sm border border-gray-200 px-6 py-2 flex items-center space-x-4 text-sm font-medium">
                {/* Step 1 Indicator */}
                <div className={`flex items-center ${state === AppState.PROCESSING_STEP_1 ? 'text-indigo-600 animate-pulse' :
                    state > AppState.PROCESSING_STEP_1 && state !== AppState.ERROR ? 'text-green-600' :
                      'text-gray-400'
                  }`}>
                  {state > AppState.PROCESSING_STEP_1 && state !== AppState.ERROR ? (
                    <FileCheck className="w-5 h-5 mr-2" />
                  ) : (
                    <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2 text-xs border-current">1</span>
                  )}
                  Bước 1
                </div>

                <ArrowRight className="w-4 h-4 text-gray-300" />

                {/* Step 2 Indicator */}
                <div className={`flex items-center ${state === AppState.PROCESSING_STEP_2 ? 'text-indigo-600 animate-pulse' :
                    state > AppState.PROCESSING_STEP_2 && state !== AppState.ERROR ? 'text-green-600' :
                      'text-gray-400'
                  }`}>
                  {state > AppState.PROCESSING_STEP_2 && state !== AppState.ERROR ? (
                    <FileCheck className="w-5 h-5 mr-2" />
                  ) : (
                    <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2 text-xs border-current">2</span>
                  )}
                  Bước 2
                </div>

                <ArrowRight className="w-4 h-4 text-gray-300" />

                {/* Step 3 Indicator */}
                <div className={`flex items-center ${state === AppState.PROCESSING_STEP_3 ? 'text-indigo-600 animate-pulse' :
                    state === AppState.COMPLETE ? 'text-green-600' :
                      'text-gray-400'
                  }`}>
                  {state === AppState.COMPLETE ? (
                    <FileCheck className="w-5 h-5 mr-2" />
                  ) : (
                    <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2 text-xs border-current">3</span>
                  )}
                  Bước 3
                </div>
              </div>
            </div>

            {/* Error Banner if any during processing */}
            {error && (
              <div className="mb-6 mx-auto max-w-2xl w-full p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="break-all">{error}</span>
                <button onClick={reset} className="underline font-bold ml-auto pl-4">Thử lại</button>
              </div>
            )}

            {/* 3 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">

              {/* COL 1 */}
              <div className="flex flex-col bg-white rounded-xl shadow border border-gray-200 overflow-hidden h-full">
                <div className="p-3 bg-gray-50 border-b border-gray-200 text-center font-bold text-gray-700 uppercase text-sm tracking-wide">
                  Bước 1: Sinh Đề & Đáp Án Đề 1
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {col1 ? <ResultDisplay content={col1} /> : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      {state === AppState.PROCESSING_STEP_1 ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          <span>Đang xử lý Bước 1...</span>
                        </div>
                      ) : state === AppState.ERROR ? "Đã dừng do lỗi" : "Chờ xử lý..."}
                    </div>
                  )}
                </div>
              </div>

              {/* COL 2 */}
              <div className="flex flex-col bg-white rounded-xl shadow border border-gray-200 overflow-hidden h-full">
                <div className="p-3 bg-gray-50 border-b border-gray-200 text-center font-bold text-gray-700 uppercase text-sm tracking-wide">
                  Bước 2: Sinh Đề & Đáp Án Đề 2
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {col2 ? <ResultDisplay content={col2} /> : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      {state === AppState.PROCESSING_STEP_2 ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          <span>Đang xử lý Bước 2...</span>
                        </div>
                      ) : (state > AppState.PROCESSING_STEP_2 && state !== AppState.ERROR) ? "Hoàn tất" :
                        state === AppState.ERROR ? "Đã dừng do lỗi" : "Chờ Bước 1..."}
                    </div>
                  )}
                </div>
              </div>

              {/* COL 3 */}
              <div className="flex flex-col bg-white rounded-xl shadow border border-gray-200 overflow-hidden h-full">
                <div className="p-3 bg-gray-50 border-b border-gray-200 text-center font-bold text-gray-700 uppercase text-sm tracking-wide">
                  Bước 3: Sinh Đề & Đáp Án Đề 3
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {col3 ? <ResultDisplay content={col3} /> : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      {state === AppState.PROCESSING_STEP_3 ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          <span>Đang xử lý Bước 3...</span>
                        </div>
                      ) : state === AppState.COMPLETE ? "Hoàn tất" :
                        state === AppState.ERROR ? "Đã dừng do lỗi" : "Chờ Bước 2..."}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
