"use client";
import { Database, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import ContextDrawer from "./ContextDrawer";
import Footer from "./Footer";

interface AppShellProps {
  user: User | null;
  onLogout: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onDocsOpen: () => void;
  onContactOpen: () => void;
  drawerContent: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({
  user,
  onLogout,
  onSignIn,
  onSignUp,
  onDocsOpen,
  onContactOpen,
  drawerContent,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBD4]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FDFBD4] border-b border-[#E8DFC8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Drawer Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(193,120,23,0.1)] transition-colors"
            >
              <Menu className="w-5 h-5 text-[#713600]" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-[#C17817]">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-[#FDFBD4]" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-[#713600]">ChatWithDB</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-[rgba(193,120,23,0.1)]">
                  <UserIcon className="w-4 h-4 text-[#713600]" />
                  <span className="text-sm font-medium text-[#713600]">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-[#C17817] text-[#FDFBD4] hover:bg-[#A66212] transition-all shadow-sm flex items-center gap-1.5 sm:gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#C17817] text-[#FDFBD4] hover:bg-[#A66212] transition-all shadow-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignUp}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#C17817] text-[#FDFBD4] hover:bg-[#A66212] transition-all shadow-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Layout: Drawer + Main */}
      <div className="flex flex-1 relative">
        <ContextDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
          {drawerContent}
        </ContextDrawer>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer onDocsOpen={onDocsOpen} onContactOpen={onContactOpen} />
    </div>
  );
}
