import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { postToLinkedIn } from '@/lib/social-service';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const platform = state?.split('_')[0];

      if (!code) {
        toast({
          title: "Authentication Failed",
          description: "No authorization code received.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        if (platform === 'linkedin') {
          // Exchange code for access token
          const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
              client_secret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET,
              redirect_uri: 'http://localhost:5173/auth/callback',
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error('Failed to get access token');
          }

          const { access_token } = await tokenResponse.json();
          const content = localStorage.getItem('pendingLinkedInPost');

          if (content) {
            await postToLinkedIn(content, access_token);
            toast({
              title: "Success",
              description: "Posted to LinkedIn successfully!",
            });
          }
        }

        // Clear stored content
        localStorage.removeItem('pendingLinkedInPost');
        localStorage.removeItem('pendingTwitterPost');

        // Redirect back to home
        navigate('/');
      } catch (error) {
        console.error('Error handling callback:', error);
        toast({
          title: "Error",
          description: "Failed to complete authentication. Please try again.",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing Authentication...</h2>
        <p className="text-gray-600">Please wait while we complete the process.</p>
      </div>
    </div>
  );
};

export default AuthCallback; 