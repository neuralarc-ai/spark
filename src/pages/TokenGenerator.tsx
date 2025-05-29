import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TokenGenerator = () => {
  const [code, setCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const { toast } = useToast();

  const initiateAuth = () => {
    const clientId = '78ej3ud15itr4m';
    const redirectUri = 'http://localhost:8080/token-generator';
    const scope = 'w_member_social';
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    window.location.href = authUrl;
  };

  const getAccessToken = async () => {
    try {
      // Create the request body
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: '78ej3ud15itr4m',
        client_secret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET,
        redirect_uri: 'http://localhost:8080/token-generator',
      }).toString();

      // Use a different CORS proxy
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = encodeURIComponent('https://www.linkedin.com/oauth/v2/accessToken');
      
      const response = await fetch(proxyUrl + targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      toast({
        title: "Success",
        description: "Access token generated successfully!",
      });
    } catch (error) {
      console.error('Error getting access token:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get access token. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle>LinkedIn Token Generator</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <Button 
                onClick={initiateAuth}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Step 1: Get Authorization Code
              </Button>

              <div className="space-y-2">
                <Label htmlFor="code">Step 2: Paste the code from the redirect URL</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste the code here"
                />
              </div>

              <Button 
                onClick={getAccessToken}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Step 3: Generate Access Token
              </Button>

              {accessToken && (
                <div className="space-y-2">
                  <Label>Your Access Token:</Label>
                  <div className="bg-gray-100 p-4 rounded-lg break-all">
                    {accessToken}
                  </div>
                  <p className="text-sm text-gray-600">
                    Copy this token and replace it in the ACCOUNTS object in social-service.ts
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenGenerator; 