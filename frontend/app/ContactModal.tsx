"use client";
import { useState } from "react";
import { X, Send, CheckCircle } from "lucide-react";

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Contact form submitted:", formData);

    // Show success message
    setShowSuccess(true);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: ""
    });

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 3000);

    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-2xl p-6 md:p-8 relative my-8 max-h-[90vh] overflow-y-auto" 
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

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#713600' }}>
            Get in Touch
          </h2>
          <p style={{ color: '#8B5A00' }}>
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>

        {/* Centered Content */}
        <div className="max-w-2xl mx-auto">
          {/* Info Box */}
          <div className="mb-6 p-6 rounded-xl" style={{ backgroundColor: 'rgba(193, 120, 23, 0.08)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
            <h4 className="font-semibold mb-2 text-center" style={{ color: '#713600' }}>Quick Response</h4>
            <p className="text-sm text-center" style={{ color: '#8B5A00' }}>
              We typically respond within 24 hours during business days.
            </p>
          </div>

          {/* Contact Form */}
          <div>
            {showSuccess && (
              <div 
                className="mb-6 p-4 rounded-lg flex items-center justify-center gap-3"
                style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.3)' }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: '#C17817' }} />
                <span style={{ color: '#713600' }}>Message sent successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2" style={{ color: '#713600' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2" style={{ color: '#713600' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#713600' }}>
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject" className="block text-sm font-medium mb-2" style={{ color: '#713600' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: '#713600' }}>
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 resize-vertical"
                  style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm"
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
      </div>
    </div>
  );
}
