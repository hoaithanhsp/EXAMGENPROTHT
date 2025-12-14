import React, { useState } from 'react';
import { Key, Save, AlertTriangle } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
    const [inputKey, setInputKey] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputKey.trim()) {
            setError('Vui lòng nhập API Key');
            return;
        }
        onSave(inputKey.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <Key className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Cấu hình API Key</h3>
                            <p className="text-sm text-gray-500">Nhập Gemini API Key để tiếp tục</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                API Key
                            </label>
                            <input
                                type="password"
                                value={inputKey}
                                onChange={(e) => {
                                    setInputKey(e.target.value);
                                    setError('');
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="AIzaSy..."
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                <AlertTriangle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm"
                            >
                                <Save className="w-4 h-4" />
                                <span>Lưu & Tiếp tục</span>
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                            Chưa có key? Lấy tại Google AI Studio
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
