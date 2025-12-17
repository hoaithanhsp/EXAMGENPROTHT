import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  isOpen: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, isOpen }) => {
  const [key, setKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Key className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Thiết lập API Key</h2>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          Vui lòng nhập Google Gemini API Key của bạn để tiếp tục sử dụng ứng dụng.
          Key của bạn sẽ được lưu cục bộ trên trình duyệt.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
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
