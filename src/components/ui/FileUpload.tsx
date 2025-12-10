'use client';

import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';

interface FileUploadProps {
  label?: string;
  error?: string;
  hint?: string;
  accept?: string;
  maxSize?: number; // in bytes
  onFileSelect?: (file: File | null) => void;
  onChange?: (file: File | null) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  required?: boolean;
}

export function FileUpload({
  label,
  error,
  hint,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  onFileSelect,
  onChange,
  selectedFile,
  onClear,
  required,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Use selectedFile prop if provided, otherwise use internal state
  const currentFile = selectedFile !== undefined ? selectedFile : internalFile;

  const handleFile = (file: File | null) => {
    setLocalError(null);
    
    if (!file) {
      setInternalFile(null);
      onFileSelect?.(null);
      onChange?.(null);
      onClear?.();
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      setLocalError(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    // Check file type
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExt === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', '/'));
        }
        return fileType === type;
      });

      if (!isAccepted) {
        setLocalError('File type not accepted');
        return;
      }
    }

    setInternalFile(file);
    onFileSelect?.(file);
    onChange?.(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFile(null);
  };

  const displayError = error || localError;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer',
          'transition-all duration-300',
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : displayError
            ? 'border-red-300 bg-red-50'
            : currentFile
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-slate-200 hover:border-primary-300 bg-white/50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        
        <div className="flex flex-col items-center gap-2">
          {currentFile ? (
            <>
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-slate-900">{currentFile.name}</p>
              <p className="text-xs text-slate-500">{(currentFile.size / 1024).toFixed(1)} KB</p>
              <button
                type="button"
                onClick={clearFile}
                className="text-xs text-red-600 hover:text-red-800 font-medium mt-1"
              >
                Remove file
              </button>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">
                PNG, JPG, JPEG up to {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </>
          )}
        </div>
      </div>
      {hint && !displayError && (
        <p className="mt-2 text-sm text-slate-500">{hint}</p>
      )}
      {displayError && (
        <p className="mt-2 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
}
