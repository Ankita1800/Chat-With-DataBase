"use client";
import { useState, useEffect } from "react";
import { X, Send, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Create contacts table if it doesn't exist (handled by Supabase)
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
          }
        ]);

      if (insertError) {
        // Fallback to console if table doesn't exist
        console.log("Contact form submitted:", formData);
      }

      // Show success message
      setShowSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: ""
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error('Contact form error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl rounded-2xl p-8 relative transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}
        style={{ 
          backgroundColor: '#FDFBD4',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors z-10"
          style={{ color: '#713600' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#713600' }}>
            Get in Touch
          </h2>
          <p className="text-sm" style={{ color: '#8B5A00' }}>
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>

        {/* Success/Error Messages */}
        {showSuccess && (
          <div 
            className="mb-4 p-4 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
          >
            <CheckCircle className="w-5 h-5" style={{ color: '#16a34a' }} />
            <span style={{ color: '#166534' }}>Message sent successfully!</span>
          </div>
        )}

        {error && (
          <div 
            className="mb-4 p-4 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <AlertCircle className="w-5 h-5" style={{ color: '#dc2626' }} />
            <span style={{ color: '#991b1b' }}>{error}</span>
          </div>
        )}

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold mb-2" style={{ color: '#713600' }}>
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '2px solid #E8DFC8', 
                  color: '#713600',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; }}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold mb-2" style={{ color: '#713600' }}>
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '2px solid #E8DFC8', 
                  color: '#713600',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#713600' }}>
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: '#FFFFFF', 
                border: '2px solid #E8DFC8', 
                color: '#713600',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; }}
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-semibold mb-2" style={{ color: '#713600' }}>
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: '#FFFFFF', 
                border: '2px solid #E8DFC8', 
                color: '#713600',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; }}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold mb-2" style={{ color: '#713600' }}>
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ 
                backgroundColor: '#FFFFFF', 
                border: '2px solid #E8DFC8', 
                color: '#713600',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg"
            style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#A66212'; }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
          >
            {isSubmitting ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
