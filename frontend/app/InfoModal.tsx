"use client";
import { X, AlertCircle, Info } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "error" | "info";
}

export default function InfoModal({ isOpen, onClose, title, message, type = "info" }: InfoModalProps) {
  const isError = type === "error";

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md rounded-2xl p-6 relative transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}
        style={{ backgroundColor: '#FDFBD4' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
          style={{ color: '#713600' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: isError ? 'rgba(220, 38, 38, 0.1)' : 'rgba(193, 120, 23, 0.1)' }}>
          {isError ? (
            <AlertCircle className="w-8 h-8" style={{ color: '#dc2626' }} />
          ) : (
            <Info className="w-8 h-8" style={{ color: '#C17817' }} />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-3" style={{ color: '#713600' }}>
          {title}
        </h2>

        {/* Message */}
        <p className="text-center mb-6" style={{ color: '#8B5A00', whiteSpace: 'pre-wrap' }}>
          {message}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold transition-all shadow-sm"
          style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
        >
          OK
        </button>
      </div>
    </div>
  );
}
