import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Twitter, Linkedin, Wand2, SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { initiateTwitterAuth, initiateLinkedInAuth, postToLinkedIn, postToTwitter, testLinkedInToken } from '@/lib/social-service';

interface GeneratedContent {
  twitter: string;
  linkedin: string;
}

const Index = () => {
  const [formData, setFormData] = useState({
    topic: '',
    tone: '',
    type: '',
    audience: '',
    keyPoints: ''
  });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateContent = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your Google Gemini API key to the .env.local file.",
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
      const prompt = `Create two versions of a social media post about ${formData.topic} with a ${formData.tone} tone. 
      Target audience: ${formData.audience || 'General audience'}
      Key points to include: ${formData.keyPoints || 'None specified'}
      
      Requirements:
      - Create TWO versions:
        1. Twitter version (max 280 characters)
        2. LinkedIn version (max 3000 characters)
      - Include relevant emojis in both versions
      - Add 3-5 relevant hashtags
      - Make both versions engaging and authentic
      - No bullet points, asterisks, or special formatting
      - No explanations or tips
      - Format the response as:
        TWITTER: [Twitter post]
        LINKEDIN: [LinkedIn post]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate content');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      // Split the content into Twitter and LinkedIn versions
      const twitterMatch = content.match(/TWITTER:([\s\S]*?)(?=LINKEDIN:|$)/);
      const linkedinMatch = content.match(/LINKEDIN:([\s\S]*?)$/);
      
      const twitterContent = twitterMatch ? twitterMatch[1].trim() : '';
      const linkedinContent = linkedinMatch ? linkedinMatch[1].trim() : '';
      
      setGeneratedContent({
        twitter: twitterContent,
        linkedin: linkedinContent
      });
      
      toast({
        title: "Content Generated!",
        description: "Your social media posts have been created successfully.",
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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

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
      const prompt = `Make these social media posts more natural and conversational while keeping the same message. Return ONLY the improved versions, no explanations or formatting:

        TWITTER: ${generatedContent.twitter}
        LINKEDIN: ${generatedContent.linkedin}
        
        Requirements:
        - Return ONLY the posts in the same format
        - Keep all emojis and hashtags
        - No explanations or tips
        - No special formatting
        - Format the response as:
          TWITTER: [Twitter post]
          LINKEDIN: [LinkedIn post]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to humanize content');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      // Split the content into Twitter and LinkedIn versions
      const twitterMatch = content.match(/TWITTER:([\s\S]*?)(?=LINKEDIN:|$)/);
      const linkedinMatch = content.match(/LINKEDIN:([\s\S]*?)$/);
      
      const twitterContent = twitterMatch ? twitterMatch[1].trim() : '';
      const linkedinContent = linkedinMatch ? linkedinMatch[1].trim() : '';
      
      setGeneratedContent({
        twitter: twitterContent,
        linkedin: linkedinContent
      });
      
      toast({
        title: "Content Humanized!",
        description: "Your posts have been made more natural and engaging.",
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

  const handlePost = async (platform: 'twitter' | 'linkedin', account: 'aniket' | 'neuralArc') => {
    try {
      if (!generatedContent) {
        toast({
          title: "No Content",
          description: "Please generate content first before posting.",
          variant: "destructive",
        });
        return;
      }

      const content = platform === 'twitter' ? generatedContent.twitter : generatedContent.linkedin;

      if (platform === 'twitter') {
        await postToTwitter(content, account);
      } else {
        await postToLinkedIn(content, account);
      }

      toast({
        title: "Success",
        description: `Posted to ${platform === 'twitter' ? 'Twitter' : 'LinkedIn'} successfully!`,
      });
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "Error",
        description: "Failed to post content. Please try again.",
        variant: "destructive",
      });
    }
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
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="ml-4 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                <SettingsIcon className="h-5 w-5" />
              </Button>
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
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Twitter Version</h3>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {generatedContent.twitter}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">LinkedIn Version</h3>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {generatedContent.linkedin}
                      </p>
                    </div>
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">Aniket's Accounts</h3>
                        <Button 
                          onClick={() => handlePost('linkedin', 'aniket')}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                        >
                          <Linkedin className="mr-2 h-4 w-4" /> Post (Aniket)
                        </Button>
                        <Button 
                          onClick={() => handlePost('twitter', 'aniket')}
                          className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                        >
                          <Twitter className="mr-2 h-4 w-4" /> Post (Aniket)
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">NeuralArc's Accounts</h3>
                        <Button 
                          onClick={() => handlePost('linkedin', 'neuralArc')}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                        >
                          <Linkedin className="mr-2 h-4 w-4" /> Post (NeuralArc)
                        </Button>
                        <Button 
                          onClick={() => handlePost('twitter', 'neuralArc')}
                          className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                        >
                          <Twitter className="mr-2 h-4 w-4" /> Post (NeuralArc)
                        </Button>
                      </div>
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
