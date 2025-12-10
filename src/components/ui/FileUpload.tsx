'use client';

import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';

interface FileUploadProps {
  label?: string;
  error?: string;
  hint?: string;
  accept?: string;
  maxSize?: number; // in MB
  onChange: (file: File | null) => void;
  required?: boolean;
}

export function FileUpload({
  label,
  error,
  hint,
  accept = 'image/*',
  maxSize = 10,
  onChange,
  required,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    setLocalError(null);
    
    if (!file) {
      setFileName(null);
      onChange(null);
      return;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setLocalError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setFileName(file.name);
    onChange(file);
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

  const displayError = error || localError;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer',
          'transition-all duration-300',
          isDragging
            ? 'border-primary-500 bg-primary-100/50'
            : displayError
            ? 'border-error bg-error/5'
            : 'border-primary-200 hover:border-primary-400 bg-white/50',
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
          {fileName ? (
            <>
              <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFile(null);
                }}
                className="text-xs text-error hover:underline"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-muted">
                <span className="font-medium text-primary-700">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG up to {maxSize}MB
              </p>
            </>
          )}
        </div>
      </div>
      {hint && !displayError && (
        <p className="mt-1.5 text-sm text-muted">{hint}</p>
      )}
      {displayError && (
        <p className="mt-1.5 text-sm text-error">{displayError}</p>
      )}
    </div>
  );
}

