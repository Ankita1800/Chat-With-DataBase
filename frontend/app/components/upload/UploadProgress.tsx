"use client";

interface UploadProgressProps {
  uploadProgress: number;
}

export default function UploadProgress({ uploadProgress }: UploadProgressProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium" style={{ color: '#8B5A00' }}>Uploading...</span>
        <span className="font-semibold" style={{ color: '#C17817' }}>{uploadProgress}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFC8' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${uploadProgress}%`, backgroundColor: '#C17817' }}
        />
      </div>
    </div>
  );
}
