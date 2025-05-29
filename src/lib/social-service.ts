import { TWITTER_AUTH_URL, LINKEDIN_AUTH_URL } from './api-config';

declare global {
  interface Window {
    IN: any;
  }
}

// Hardcoded account credentials
const ACCOUNTS = {
  aniket: {
    linkedin: {
      accessToken: 'YOUR_ANIKET_LINKEDIN_ACCESS_TOKEN',
      refreshToken: 'YOUR_ANIKET_LINKEDIN_REFRESH_TOKEN',
      clientId: '78ej3ud15itr4m',
      clientSecret: 'WPL_AP1.OpCMPwZLngMvcQGO.NwIzrg=='
    },
    twitter: {
      accessToken: 'YOUR_ANIKET_TWITTER_ACCESS_TOKEN',
      refreshToken: 'YOUR_ANIKET_TWITTER_REFRESH_TOKEN',
      clientId: 'YOUR_TWITTER_CLIENT_ID',
      clientSecret: 'YOUR_TWITTER_CLIENT_SECRET'
    }
  },
  neuralArc: {
    linkedin: {
      accessToken: 'AQQBwBPyRnPGxvp8uwcuCXIrx_XAeBqLRdw0iWVD35Kx5dlugSPKmy2j_y8vh8wgTJstsKVZFgclVCe1TR-h_bN1hQiMCHT5_8htHg5zLTyhWZiMp-IvkkSuMq71I7Hfa9VTSXFvZK83zZK8Ktm6-uz88Rls6HZtUwXjlmeKDgjQb-UcDxE5L4WFHY3DKSXvRhQiv0gAc2yjkWmuhRY',
      refreshToken: 'YOUR_NEURALARC_LINKEDIN_REFRESH_TOKEN',
      clientId: '78ej3ud15itr4m',
      clientSecret: 'WPL_AP1.OpCMPwZLngMvcQGO.NwIzrg=='
    },
    twitter: {
      accessToken: 'YOUR_NEURALARC_TWITTER_ACCESS_TOKEN',
      refreshToken: 'YOUR_NEURALARC_TWITTER_REFRESH_TOKEN',
      clientId: 'YOUR_TWITTER_CLIENT_ID',
      clientSecret: 'YOUR_TWITTER_CLIENT_SECRET'
    }
  }
};

// Initialize LinkedIn SDK
const initLinkedInSDK = () => {
  return new Promise<void>((resolve, reject) => {
    if (!window.IN) {
      reject(new Error('LinkedIn SDK not loaded'));
      return;
    }

    // Check if already initialized
    if (window.IN.User.isAuthorized()) {
      resolve();
      return;
    }

    // If not authorized, trigger login
    window.IN.User.authorize(function() {
      resolve();
    }, function(error) {
      reject(error);
    });
  });
};

export const initiateTwitterAuth = () => {
  const currentContent = document.querySelector('.generated-content')?.textContent;
  if (currentContent) {
    localStorage.setItem('pendingTwitterPost', currentContent);
  }
  window.location.href = TWITTER_AUTH_URL;
};

export const initiateLinkedInAuth = () => {
  const currentContent = document.querySelector('.generated-content')?.textContent;
  if (currentContent) {
    localStorage.setItem('pendingLinkedInPost', currentContent);
  }
  window.location.href = LINKEDIN_AUTH_URL;
};

export const postToTwitter = async (content: string, account: 'aniket' | 'neuralArc') => {
  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCOUNTS[account].twitter.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content
      })
    });

    if (!response.ok) {
      throw new Error('Failed to post to Twitter');
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting to Twitter:', error);
    throw error;
  }
};

// Function to test LinkedIn token
export const testLinkedInToken = async (account: 'aniket' | 'neuralArc') => {
  try {
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${ACCOUNTS[account].linkedin.accessToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Token test failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`LinkedIn token test successful for ${account}:`, data);
    return data;
  } catch (error) {
    console.error(`LinkedIn token test failed for ${account}:`, error);
    throw error;
  }
};

export const postToLinkedIn = async (content: string, account: 'aniket' | 'neuralArc') => {
  try {
    // Copy content to clipboard
    await navigator.clipboard.writeText(content);
    
    // Create a share URL with the content
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodeURIComponent(content)}`;
    
    // Open in a new window
    const width = 600;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      shareUrl,
      'linkedin-share',
      `width=${width},height=${height},top=${top},left=${left},location=yes,status=yes,scrollbars=yes`
    );

    return { success: true, message: 'Content copied to clipboard and LinkedIn share window opened' };
  } catch (error) {
    console.error('Error posting to LinkedIn:', error);
    throw error;
  }
}; 