"use client";

interface FooterProps {
  onDocsOpen: () => void;
  onContactOpen: () => void;
}

export default function Footer({ onDocsOpen, onContactOpen }: FooterProps) {
  return (
    <footer className="bg-[#F8F4E6] border-t border-[#E8DFC8] py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Links */}
          <nav className="flex items-center gap-6">
            <a
              href="https://ankitaatech700.blogspot.com/2025/12/chat-with-database-ai-powered-natural.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#8B5A00] hover:text-[#713600] transition-colors"
            >
              Blog
            </a>
            <button
              onClick={onDocsOpen}
              className="text-sm font-medium text-[#8B5A00] hover:text-[#713600] transition-colors"
            >
              Docs
            </button>
            <button
              onClick={onContactOpen}
              className="text-sm font-medium text-[#8B5A00] hover:text-[#713600] transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-[#8B5A00]">
            © 2025 ChatWithDB. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
