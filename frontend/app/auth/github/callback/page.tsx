'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication was cancelled or failed');
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    // Exchange code for token
    const exchangeCode = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/auth/github/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to authenticate with GitHub');
        }

        const data = await response.json();
        
        // Store token and user data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to home page
        router.push('/');
      } catch (err) {
        console.error('GitHub OAuth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBD4]">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 mb-4 text-lg">{error}</div>
            <div className="text-[#713600]">Redirecting to home page...</div>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-[#C17817] animate-spin mx-auto mb-4" />
            <div className="text-[#713600] text-lg">Completing GitHub sign in...</div>
          </>
        )}
      </div>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBD4]">
        <Loader2 className="w-12 h-12 text-[#C17817] animate-spin" />
      </div>
    }>
      <GitHubCallbackContent />
    </Suspense>
  );
}
