"use client";
import { FileUp, CheckCircle } from "lucide-react";

interface UploadAreaProps {
  file: File | null;
  isDragOver: boolean;
  onFileChange: (file: File | null) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}

export default function UploadArea({
  file,
  isDragOver,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick
}: UploadAreaProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        className="upload-area border-2 border-dashed rounded-xl p-6 sm:p-8 lg:p-12 text-center cursor-pointer transition-all"
        style={{
          borderColor: isDragOver ? '#C17817' : '#E8DFC8',
          backgroundColor: isDragOver ? 'rgba(193, 120, 23, 0.05)' : 'rgba(248, 244, 230, 0.5)'
        }}
        onMouseEnter={(e) => { if (!isDragOver) { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.05)'; } }}
        onMouseLeave={(e) => { if (!isDragOver) { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = 'rgba(248, 244, 230, 0.5)'; } }}
      >

        {file ? (
          <div className="fade-in">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#C17817' }} />
            </div>
            <p className="text-base sm:text-lg font-semibold break-all px-2" style={{ color: '#713600' }}>{file.name}</p>
            <p className="mt-1 text-sm sm:text-base" style={{ color: '#8B5A00' }}>
              {(file.size / 1024).toFixed(2)} KB • Ready to upload
            </p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
              <FileUp className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#C17817' }} />
            </div>
            <p className="text-base sm:text-lg font-semibold mb-2" style={{ color: '#713600' }}>
              Drop your CSV file here
            </p>
            <p className="text-sm sm:text-base" style={{ color: '#8B5A00' }}>or click to browse from your computer</p>
          </>
        )}
      </div>
    </div>
  );
}
