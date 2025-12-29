"use client";
import { Sparkles, ArrowRight } from "lucide-react";

interface UploadButtonProps {
  onClick: () => void;
}

export default function UploadButton({ onClick }: UploadButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-4 sm:mt-6 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-sm"
      style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A66212'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(113, 54, 0, 0.1), 0 2px 4px -1px rgba(113, 54, 0, 0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C17817'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(113, 54, 0, 0.05)'; }}
    >
      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="hidden sm:inline">Start Analyzing Your Data</span>
      <span className="sm:hidden">Analyze Data</span>
      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
    </button>
  );
}
