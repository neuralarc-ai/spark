import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Twitter, Linkedin, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Index = () => {
  const [formData, setFormData] = useState({
    topic: '',
    tone: '',
    type: '',
    audience: '',
    keyPoints: ''
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateContent = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Google Gemini API key to generate content.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.topic || !formData.tone) {
      toast({
        title: "Missing Information",
        description: "Please fill in topic and tone fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    console.log("Generating content with:", formData);

    try {
      const prompt = `Create a ${formData.type || 'social media'} post for social media with the following specifications:
      - Topic: ${formData.topic}
      - Tone: ${formData.tone}
      - Target Audience: ${formData.audience || 'General audience'}
      - Key Points: ${formData.keyPoints || 'None specified'}
      
      Make it engaging, authentic, and suitable for both Twitter and LinkedIn. Keep it concise but impactful.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      setGeneratedContent(content);
      
      toast({
        title: "Content Generated!",
        description: "Your social media post has been created successfully.",
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const humanizeContent = async () => {
    if (!generatedContent) {
      toast({
        title: "No Content",
        description: "Please generate content first before humanizing.",
        variant: "destructive",
      });
      return;
    }

    setIsHumanizing(true);
    console.log("Humanizing content:", generatedContent);

    try {
      const prompt = `Humanize and improve the following social media post. Make it more natural, conversational, and engaging while maintaining the core message. Add personality and make it feel authentic:

      ${generatedContent}
      
      Return only the improved version without any explanations.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to humanize content');
      }

      const data = await response.json();
      const humanizedContent = data.candidates[0].content.parts[0].text;
      setGeneratedContent(humanizedContent);
      
      toast({
        title: "Content Humanized!",
        description: "Your post has been made more natural and engaging.",
      });
    } catch (error) {
      console.error('Error humanizing content:', error);
      toast({
        title: "Humanization Failed",
        description: "Failed to humanize content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsHumanizing(false);
    }
  };

  const handlePost = (platform: 'twitter' | 'linkedin') => {
    if (!generatedContent) {
      toast({
        title: "No Content",
        description: "Please generate content first before posting.",
        variant: "destructive",
      });
      return;
    }

    // Since we can't actually post to social media without OAuth, we'll copy to clipboard
    navigator.clipboard.writeText(generatedContent);
    
    toast({
      title: `Ready for ${platform === 'twitter' ? 'Twitter' : 'LinkedIn'}!`,
      description: "Content copied to clipboard. You can now paste it on the platform.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tweet Spark
            </h1>
            <Link 
              to="/settings" 
              className="ml-4 text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Settings
            </Link>
          </div>
          <p className="text-gray-600 text-lg">
            AI-powered social media content generator
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Form */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-6 w-6" />
                Content Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">Google Gemini API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  placeholder="What do you want to post about?"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone *</Label>
                <Select onValueChange={(value) => handleInputChange('tone', value)}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Content Type</Label>
                <Select onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="tip">Tip/Advice</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="story">Personal Story</SelectItem>
                    <SelectItem value="quote">Quote/Inspiration</SelectItem>
                    <SelectItem value="news">Industry News</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="Who is your target audience?"
                  value={formData.audience}
                  onChange={(e) => handleInputChange('audience', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyPoints">Key Points</Label>
                <Textarea
                  id="keyPoints"
                  placeholder="Any specific points you want to include?"
                  value={formData.keyPoints}
                  onChange={(e) => handleInputChange('keyPoints', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500 transition-colors min-h-20"
                />
              </div>

              <Button 
                onClick={generateContent}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Content */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Generated Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {generatedContent ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {generatedContent}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={humanizeContent}
                      disabled={isHumanizing}
                      variant="outline"
                      className="flex-1 border-2 border-purple-200 hover:bg-purple-50 transition-all duration-200"
                    >
                      {isHumanizing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Humanizing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Humanize This
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={generateContent}
                      disabled={isGenerating}
                      variant="outline"
                      className="border-2 border-blue-200 hover:bg-blue-50 transition-all duration-200"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <Label className="text-lg font-semibold text-gray-700 mb-4 block">
                      Share Your Content
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={() => handlePost('twitter')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                      >
                        <Twitter className="mr-2 h-4 w-4" />
                        Post on Twitter
                      </Button>
                      
                      <Button 
                        onClick={() => handlePost('linkedin')}
                        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                      >
                        <Linkedin className="mr-2 h-4 w-4" />
                        Post on LinkedIn
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Generate your first piece of content to get started!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">AI-Powered</Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">Human-like</Badge>
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">Multi-Platform</Badge>
          </div>
          <p className="text-gray-600">
            Powered by Google Gemini AI • Built with love for content creators
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
