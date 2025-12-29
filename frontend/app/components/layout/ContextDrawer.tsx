"use client";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ContextDrawer({ isOpen, onClose, children }: ContextDrawerProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed md:sticky top-14 md:top-16 left-0
          h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]
          w-[300px] md:w-[320px]
          bg-[#F8F4E6] border-r border-[#E8DFC8]
          transform transition-transform duration-300 ease-in-out
          z-50 md:z-0
          flex flex-col overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Close button - mobile only */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#E8DFC8]">
          <span className="text-sm font-semibold text-[#713600]">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgba(193,120,23,0.1)] transition-colors"
          >
            <X className="w-5 h-5 text-[#713600]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </aside>
    </>
  );
}
