export const TWITTER_CLIENT_ID = import.meta.env.VITE_TWITTER_CLIENT_ID;
export const TWITTER_REDIRECT_URI = import.meta.env.VITE_TWITTER_REDIRECT_URI;
export const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
export const LINKEDIN_REDIRECT_URI = 'http://localhost:5173/auth/callback';

export const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize?response_type=code&client_id=YOUR_TWITTER_CLIENT_ID&redirect_uri=http://localhost:5173/auth/callback&scope=tweet.write&state=twitter';

export const LINKEDIN_AUTH_URL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=w_member_social&state=linkedin_${Date.now()}`; 