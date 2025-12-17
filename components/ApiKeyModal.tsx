import React, { useState, useEffect } from 'react';
import { Key, Brain, Cpu, Zap, CheckCircle2, Circle } from 'lucide-react';
import { MODELS } from '../services/geminiService';

interface ApiKeyModalProps {
  onSave: (key: string, model: string) => void;
  isOpen: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, isOpen }) => {
  const [key, setKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('GEMINI_MODEL') || MODELS[0].id);

  useEffect(() => {
    if (isOpen) {
      setKey(localStorage.getItem('GEMINI_API_KEY') || '');
      setSelectedModel(localStorage.getItem('GEMINI_MODEL') || MODELS[0].id);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      localStorage.setItem('GEMINI_MODEL', selectedModel);
      onSave(key.trim(), selectedModel);
    }
  };

  const getModelIcon = (id: string) => {
    if (id.includes('flash')) return <Zap className="w-5 h-5" />;
    if (id.includes('pro') && !id.includes('2.0')) return <Cpu className="w-5 h-5" />;
    return <Brain className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Key className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Thiết lập AI & API Key</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Chọn Mô hình AI (Model) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`relative cursor-pointer border rounded-xl p-4 transition-all hover:shadow-md ${isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`p-2 rounded-lg inline-flex mb-3 ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {getModelIcon(model.id)}
                    </div>
                    <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>{model.name.split('(')[0]}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{model.name.match(/\((.*?)\)/)?.[1] || model.name}</p>

                    <div className="absolute top-4 right-4">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center"
          >
            Lưu & Bắt đầu
          </button>
        </form>

        <p className="mt-4 text-xs text-center text-gray-400">
          Nếu chưa có key, bạn có thể lấy tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;
