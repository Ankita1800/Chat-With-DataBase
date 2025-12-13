"use client";
import { useState } from "react";
import { X, Book, FileText, Database, Clock, Zap, Upload, MessageSquare, Shield, Cloud, Mail } from "lucide-react";

interface DocsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocSection = {
  id: string;
  title: string;
  icon: any;
  content: JSX.Element;
};

export default function DocsSidebar({ isOpen, onClose }: DocsSidebarProps) {
  const [activeSection, setActiveSection] = useState("introduction");

  if (!isOpen) return null;

  const sections: DocSection[] = [
    {
      id: "introduction",
      title: "Introduction",
      icon: Book,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Introduction</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            ChatWithDB is an AI-powered application that allows you to interact with your database using plain English instead of SQL queries.
          </p>
          <p className="mb-4" style={{ color: '#713600' }}>
            You can upload a CSV file, ask questions naturally, and get instant insights from your data — all from a simple, clean interface.
          </p>
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>This tool is designed for:</p>
            <ul className="list-disc list-inside space-y-1" style={{ color: '#713600' }}>
              <li>Beginners</li>
              <li>Students</li>
              <li>Non-technical users</li>
              <li>Anyone who wants quick answers from data</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "interface",
      title: "Interface Overview",
      icon: FileText,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Interface Overview</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            The interface is divided into three main areas:
          </p>
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
              <h3 className="font-semibold mb-2" style={{ color: '#713600' }}>Top Navigation Bar</h3>
              <p style={{ color: '#8B5A00' }}>Located at the top of the page with options for Blog, Docs, Contact, Sign In, and Sign Up.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
              <h3 className="font-semibold mb-2" style={{ color: '#713600' }}>Left Sidebar</h3>
              <p style={{ color: '#8B5A00' }}>Helps you manage data connections, view chat history, and access quick actions.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
              <h3 className="font-semibold mb-2" style={{ color: '#713600' }}>Main Workspace</h3>
              <p style={{ color: '#8B5A00' }}>Where you upload files, ask questions, and view results.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "database",
      title: "Database Connections",
      icon: Database,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Database Connections</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            This section shows the status of your connected dataset in the left sidebar.
          </p>
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>What you can do:</p>
            <ul className="list-disc list-inside space-y-2" style={{ color: '#713600' }}>
              <li>Click <strong>Add Database</strong> to upload a new CSV file</li>
              <li>View whether a database is connected</li>
              <li>See the column names of the uploaded dataset as badges</li>
            </ul>
          </div>
          <p style={{ color: '#8B5A00' }}>
            This section helps you understand the structure of your data before asking questions.
          </p>
        </div>
      ),
    },
    {
      id: "history",
      title: "Chat History",
      icon: Clock,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Chat History</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            This section stores your previous questions in the left sidebar.
          </p>
          <div className="space-y-3 mb-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
              <p className="font-semibold" style={{ color: '#713600' }}>Search</p>
              <p className="text-sm" style={{ color: '#8B5A00' }}>Find past questions using the search bar</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
              <p className="font-semibold" style={{ color: '#713600' }}>Timestamps</p>
              <p className="text-sm" style={{ color: '#8B5A00' }}>View previously asked queries with date/time</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
              <p className="font-semibold" style={{ color: '#713600' }}>Clear History</p>
              <p className="text-sm" style={{ color: '#8B5A00' }}>Remove all chat history if needed</p>
            </div>
          </div>
          <p style={{ color: '#8B5A00' }}>
            Chat history helps you revisit earlier insights without re-asking questions.
          </p>
        </div>
      ),
    },
    {
      id: "actions",
      title: "Quick Actions",
      icon: Zap,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Quick Actions</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            This section provides quick utilities for your dataset.
          </p>
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
              <h3 className="font-bold mb-2" style={{ color: '#713600' }}>Export Data</h3>
              <ul className="list-disc list-inside space-y-1" style={{ color: '#8B5A00' }}>
                <li>Downloads the connected dataset</li>
                <li>Useful for offline analysis or sharing</li>
                <li>Works on currently connected dataset</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "upload",
      title: "Uploading Data",
      icon: Upload,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Upload CSV File</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            You can upload your dataset using the upload box in the main workspace.
          </p>
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>Supported Format:</p>
            <p style={{ color: '#713600' }}>CSV only</p>
          </div>
          <div className="mb-4">
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>Upload Options:</p>
            <ul className="list-disc list-inside space-y-2" style={{ color: '#8B5A00' }}>
              <li>Drag and drop the file into the upload area</li>
              <li>Click to browse from your computer</li>
            </ul>
          </div>
          <p style={{ color: '#8B5A00' }}>
            Once uploaded, the system automatically reads the dataset structure and displays column names as badges.
          </p>
        </div>
      ),
    },
    {
      id: "questions",
      title: "Asking Questions",
      icon: MessageSquare,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Asking Questions</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            The AI understands your intent and fetches accurate results. No SQL knowledge required!
          </p>
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
            <p className="font-semibold mb-3" style={{ color: '#713600' }}>Example Questions:</p>
            <div className="space-y-2">
              <div className="p-2 rounded" style={{ backgroundColor: '#FDFBD4', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
                <code style={{ color: '#713600' }}>"How many rows are in the table?"</code>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: '#FDFBD4', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
                <code style={{ color: '#713600' }}>"Show all countries"</code>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: '#FDFBD4', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
                <code style={{ color: '#713600' }}>"List employee values"</code>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: '#FDFBD4', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
                <code style={{ color: '#713600' }}>"What is the average salary?"</code>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>How it works:</p>
            <ol className="list-decimal list-inside space-y-2" style={{ color: '#8B5A00' }}>
              <li>Upload a CSV file</li>
              <li>Ask questions in plain English</li>
              <li>AI processes the question</li>
              <li>Results are shown instantly</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "auth",
      title: "Authentication",
      icon: Shield,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Authentication</h2>
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', border: '1px solid rgba(40, 167, 69, 0.3)' }}>
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>Now Available!</p>
            <p style={{ color: '#713600' }}>Full authentication system is now implemented</p>
          </div>
          <div className="mb-4">
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>Authentication Features:</p>
            <ul className="list-disc list-inside space-y-2" style={{ color: '#713600' }}>
              <li><strong>Google Sign-In</strong> - One-click authentication with Google</li>
              <li><strong>GitHub Sign-In</strong> - Sign in with your GitHub account</li>
              <li><strong>Email/Password</strong> - Create accounts with email and password</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>Benefits for logged-in users:</p>
            <ul className="list-disc list-inside space-y-2" style={{ color: '#8B5A00' }}>
              <li>Save datasets across sessions</li>
              <li>Maintain chat history permanently</li>
              <li>Access analytics securely</li>
              <li>Personalized experience</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "storage",
      title: "Storage Information",
      icon: Cloud,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Storage Information</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            Currently, files are stored locally in SQLite database.
          </p>
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>Current Storage:</p>
            <p style={{ color: '#713600' }}>Files stored at <code className="px-2 py-1 rounded" style={{ backgroundColor: '#FDFBD4' }}>./dynamic.db</code></p>
          </div>
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
            <p className="font-semibold mb-2" style={{ color: '#713600' }}>For Production Use:</p>
            <ul className="list-disc list-inside space-y-2" style={{ color: '#8B5A00' }}>
              <li>Cloud storage recommended (AWS S3 or Azure Blob)</li>
              <li>Improves scalability and reliability</li>
              <li>Better for handling large datasets</li>
              <li>Automatic backups and redundancy</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "future",
      title: "Future Enhancements",
      icon: Zap,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Future Enhancements</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            Planned improvements to make ChatWithDB even better:
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', border: '1px solid rgba(40, 167, 69, 0.3)' }}>
              <p style={{ color: '#713600' }}><strong>Authentication</strong> (Google, GitHub, Email) - <em>Completed!</em></p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
              <p style={{ color: '#713600' }}><strong>Cloud Database Support</strong> - Coming soon</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
              <p style={{ color: '#713600' }}><strong>Advanced Analytics Dashboards</strong> - In development</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
              <p style={{ color: '#713600' }}><strong>Role-Based Access Control</strong> - Planned</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
              <p style={{ color: '#713600' }}><strong>Multi-File Support</strong> - Under consideration</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
              <p style={{ color: '#713600' }}><strong>Support for Larger Datasets</strong> - Optimization ongoing</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      title: "Contact & Support",
      icon: Mail,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#713600' }}>Contact & Support</h2>
          <p className="mb-4" style={{ color: '#713600' }}>
            For questions, feedback, or support:
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
              <p className="font-semibold mb-2" style={{ color: '#713600' }}>Contact Options:</p>
              <ul className="list-disc list-inside space-y-2" style={{ color: '#8B5A00' }}>
                <li>Use the <strong>Contact</strong> option in the navigation bar</li>
                <li>Visit our <a href="https://chatwithdb.blogspot.com" target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: '#C17817' }}>Blog</a> for updates</li>
                <li>Report issues through the feedback form</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
              <p className="font-semibold mb-2" style={{ color: '#713600' }}>Additional Resources:</p>
              <ul className="list-disc list-inside space-y-2" style={{ color: '#8B5A00' }}>
                <li>Check the blog for tutorials and guides</li>
                <li>Review this documentation for common questions</li>
                <li>Explore example queries to learn best practices</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find(s => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 flex" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      {/* Sidebar */}
      <div className="w-80 h-full overflow-y-auto" style={{ backgroundColor: '#FDFBD4', borderRight: '2px solid rgba(193, 120, 23, 0.2)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#713600' }}>Documentation</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#713600' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: isActive ? 'rgba(193, 120, 23, 0.15)' : 'transparent',
                    color: isActive ? '#713600' : '#8B5A00',
                    borderLeft: isActive ? '3px solid #C17817' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 h-full overflow-y-auto" style={{ backgroundColor: '#F8F4E6' }}>
        <div className="max-w-4xl mx-auto p-8">
          {activeContent?.content}
        </div>
      </div>
    </div>
  );
}
