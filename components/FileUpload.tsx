import React, { useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  onFileSelect: (file: FileData) => void;
  selectedFile: FileData | null;
  onClear: () => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, onClear, disabled }) => {
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("File size must be under 20MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = (e.target?.result as string).split(',')[1];
      onFileSelect({
        name: file.name,
        type: file.type,
        data: base64Data
      });
    };
    reader.readAsDataURL(file);
  }, [onFileSelect]);

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
        <div className="flex items-center space-x-3">
          {selectedFile.type.includes('pdf') ? (
            <FileText className="w-8 h-8 text-red-500" />
          ) : (
            <ImageIcon className="w-8 h-8 text-blue-500" />
          )}
          <div>
            <p className="font-medium text-gray-800 truncate max-w-xs">{selectedFile.name}</p>
            <p className="text-xs text-gray-500 uppercase">{selectedFile.type.split('/')[1]}</p>
          </div>
        </div>
        <button
          onClick={onClear}
          disabled={disabled}
          className="p-1 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 border-gray-300 hover:border-blue-400'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">PDF, PNG, JPG (Max 20MB)</p>
        </div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".pdf,image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
};

export default FileUpload;
