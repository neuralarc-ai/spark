import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Twitter, Linkedin, Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Settings = () => {
  const [credentials, setCredentials] = useState({
    twitterUsername: '',
    twitterApiKey: '',
    linkedinProfile: '',
    linkedinAccessToken: '',
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save to localStorage for now
    localStorage.setItem('socialCredentials', JSON.stringify(credentials));
    toast({
      title: "Settings Saved",
      description: "Your social media credentials have been saved.",
    });
  };

  const loadSavedCredentials = () => {
    const saved = localStorage.getItem('socialCredentials');
    if (saved) {
      setCredentials(JSON.parse(saved));
    }
  };

  React.useEffect(() => {
    loadSavedCredentials();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <SettingsIcon className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Social Media Settings
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Connect your social media accounts to enable direct posting
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Twitter Settings */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Twitter className="w-6 h-6 mr-2" />
                Twitter Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitterUsername">Username</Label>
                <Input
                  id="twitterUsername"
                  placeholder="@yourusername"
                  value={credentials.twitterUsername}
                  onChange={(e) => handleInputChange('twitterUsername', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterApiKey">API Key (Optional)</Label>
                <Input
                  id="twitterApiKey"
                  type="password"
                  placeholder="Your Twitter API key"
                  value={credentials.twitterApiKey}
                  onChange={(e) => handleInputChange('twitterApiKey', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500">
                  Required for direct posting. Get it from Twitter Developer Portal.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Settings */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Linkedin className="w-6 h-6 mr-2" />
                LinkedIn Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinProfile">Profile URL</Label>
                <Input
                  id="linkedinProfile"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={credentials.linkedinProfile}
                  onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinAccessToken">Access Token (Optional)</Label>
                <Input
                  id="linkedinAccessToken"
                  type="password"
                  placeholder="Your LinkedIn access token"
                  value={credentials.linkedinAccessToken}
                  onChange={(e) => handleInputChange('linkedinAccessToken', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500">
                  Required for direct posting. Get it from LinkedIn Developer Portal.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="text-center mt-8">
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Settings
          </Button>
        </div>

        {/* Instructions */}
        <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-600 mb-2">Twitter Setup:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Visit Twitter Developer Portal</li>
                  <li>Create a new app or use existing</li>
                  <li>Generate API keys and tokens</li>
                  <li>Enter your credentials above</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-blue-600 mb-2">LinkedIn Setup:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Visit LinkedIn Developer Portal</li>
                  <li>Create a LinkedIn app</li>
                  <li>Request necessary permissions</li>
                  <li>Generate access token</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

