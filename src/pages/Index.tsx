import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Twitter, Linkedin, Wand2, SettingsIcon, Clock, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { initiateTwitterAuth, initiateLinkedInAuth, postToLinkedIn, postToTwitter, testLinkedInToken } from '@/lib/social-service';

interface GeneratedContent {
  twitter: string;
  linkedin: string;
  bestTimeTwitter: string;
  expectedLikesTwitter: string;
  expectedReachTwitter: string;
  bestTimeLinkedin: string;
  expectedLikesLinkedin: string;
  expectedReachLinkedin: string;
  imageTwitter: string;
  imageLinkedin: string;
  svgTwitter: string;
  svgLinkedin: string;
  imagePromptTwitter: string;
  imagePromptLinkedin: string;
  imageUrlTwitter?: string;
  imageUrlLinkedin?: string;
}

// Helper function to call Google Image API
async function generateImage(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          response_mime_type: ["text/plain", "image/jpeg"]
        })
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image API error:', errorText);
      return null;
    }
    const data = await response.json();
    const base64 = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith('image/'))?.inlineData?.data;
    if (base64) return `data:image/jpeg;base64,${base64}`;
    return null;
  } catch (err) {
    console.error('Image API error:', err);
    return null;
  }
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
  const [isImageLoading, setIsImageLoading] = useState<{twitter: boolean, linkedin: boolean}>({twitter: false, linkedin: false});
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
        1. Twitter version (max 280 characters, concise, no emojis)
        2. LinkedIn version (detailed, at least 1000 characters, up to 3000 characters, no emojis, in-depth, professional, and comprehensive; use multiple paragraphs, include an introduction, main points, and a conclusion)
      - Add 3-5 relevant hashtags to both versions
      - For each version, also provide:
        - Best time to post (for maximum engagement, in IST - Indian Standard Time, UTC+5:30)
        - Expected reach (a rough estimate)
        - A detailed image prompt for an AI image generator, using only these colors: #161616, #1E342F, #2B2521, #3987BE, #495663, #97A487, #A8B0B8, #A9A9A9, #B7A694, #B7BEAE, #C6AEA3, #CFD2D4, #CFD4C9, #D0C3B5, #D48EA3, #E3E2DF, #F8F7F3. The image should be visually appealing, relevant to the post, and suitable for direct posting on LinkedIn or Twitter.
      - Make both versions engaging and authentic
      - No bullet points, asterisks, or special formatting
      - No explanations or tips
      - Format the response as:
        TWITTER: [Twitter post]
        IMAGE_PROMPT_TWITTER: [Image prompt for Twitter]
        BEST_TIME_TWITTER: [Best time to post on Twitter]
        EXPECTED_REACH_TWITTER: [Estimated reach]
        LINKEDIN: [LinkedIn post]
        IMAGE_PROMPT_LINKEDIN: [Image prompt for LinkedIn]
        BEST_TIME_LINKEDIN: [Best time to post on LinkedIn]
        EXPECTED_REACH_LINKEDIN: [Estimated reach]`;

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
      
      // Split the content into Twitter and LinkedIn versions and extract extra info
      const twitterMatch = content.match(/TWITTER:([\s\S]*?)(?=IMAGE_PROMPT_TWITTER:|$)/);
      const imagePromptTwitterMatch = content.match(/IMAGE_PROMPT_TWITTER:([\s\S]*?)(?=BEST_TIME_TWITTER:|$)/);
      const bestTimeTwitterMatch = content.match(/BEST_TIME_TWITTER:([\s\S]*?)(?=EXPECTED_REACH_TWITTER:|$)/);
      const expectedReachTwitterMatch = content.match(/EXPECTED_REACH_TWITTER:([\s\S]*?)(?=LINKEDIN:|$)/);
      const linkedinMatch = content.match(/LINKEDIN:([\s\S]*?)(?=IMAGE_PROMPT_LINKEDIN:|$)/);
      const imagePromptLinkedinMatch = content.match(/IMAGE_PROMPT_LINKEDIN:([\s\S]*?)(?=BEST_TIME_LINKEDIN:|$)/);
      const bestTimeLinkedinMatch = content.match(/BEST_TIME_LINKEDIN:([\s\S]*?)(?=EXPECTED_REACH_LINKEDIN:|$)/);
      const expectedReachLinkedinMatch = content.match(/EXPECTED_REACH_LINKEDIN:([\s\S]*?)$/);

      setGeneratedContent({
        twitter: twitterMatch ? twitterMatch[1].trim() : '',
        linkedin: linkedinMatch ? linkedinMatch[1].trim() : '',
        bestTimeTwitter: bestTimeTwitterMatch ? bestTimeTwitterMatch[1].trim() : '',
        expectedLikesTwitter: '',
        expectedReachTwitter: expectedReachTwitterMatch ? expectedReachTwitterMatch[1].trim() : '',
        bestTimeLinkedin: bestTimeLinkedinMatch ? bestTimeLinkedinMatch[1].trim() : '',
        expectedLikesLinkedin: '',
        expectedReachLinkedin: expectedReachLinkedinMatch ? expectedReachLinkedinMatch[1].trim() : '',
        imageTwitter: '',
        imageLinkedin: '',
        svgTwitter: '',
        svgLinkedin: '',
        imagePromptTwitter: imagePromptTwitterMatch ? imagePromptTwitterMatch[1].trim() : '',
        imagePromptLinkedin: imagePromptLinkedinMatch ? imagePromptLinkedinMatch[1].trim() : '',
        imageUrlTwitter: '',
        imageUrlLinkedin: '',
      });
      
      // Generate images for both prompts
      const imagePromptTwitter = imagePromptTwitterMatch ? imagePromptTwitterMatch[1].trim() : '';
      const imagePromptLinkedin = imagePromptLinkedinMatch ? imagePromptLinkedinMatch[1].trim() : '';
      if (imagePromptTwitter || imagePromptLinkedin) {
        setIsImageLoading({twitter: !!imagePromptTwitter, linkedin: !!imagePromptLinkedin});
        setTimeout(async () => {
          const [twitterImg, linkedinImg] = await Promise.all([
            imagePromptTwitter ? generateImage(imagePromptTwitter, apiKey) : Promise.resolve(null),
            imagePromptLinkedin ? generateImage(imagePromptLinkedin, apiKey) : Promise.resolve(null),
          ]);
          setGeneratedContent(prev => prev && {
            ...prev,
            imageUrlTwitter: twitterImg || '',
            imageUrlLinkedin: linkedinImg || '',
          });
          setIsImageLoading({twitter: false, linkedin: false});
        }, 100);
      }
      
      toast({
        title: "Content Generated!",
        description: "Your social media posts have been created successfully.",
      });
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent({
        twitter: '',
        linkedin: '',
        bestTimeTwitter: '',
        expectedLikesTwitter: '',
        expectedReachTwitter: '',
        bestTimeLinkedin: '',
        expectedLikesLinkedin: '',
        expectedReachLinkedin: '',
        imageTwitter: '',
        imageLinkedin: '',
        svgTwitter: '',
        svgLinkedin: '',
        imagePromptTwitter: '',
        imagePromptLinkedin: '',
        imageUrlTwitter: '',
        imageUrlLinkedin: '',
      });
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
        linkedin: linkedinContent,
        bestTimeTwitter: '',
        expectedLikesTwitter: '',
        expectedReachTwitter: '',
        bestTimeLinkedin: '',
        expectedLikesLinkedin: '',
        expectedReachLinkedin: '',
        imageTwitter: '',
        imageLinkedin: '',
        svgTwitter: '',
        svgLinkedin: '',
        imagePromptTwitter: '',
        imagePromptLinkedin: '',
      });
      
      toast({
        title: "Content Humanized!",
        description: "Your posts have been made more natural and engaging.",
      });
    } catch (error) {
      console.error('Error humanizing content:', error);
      setGeneratedContent({
        twitter: '',
        linkedin: '',
        bestTimeTwitter: '',
        expectedLikesTwitter: '',
        expectedReachTwitter: '',
        bestTimeLinkedin: '',
        expectedLikesLinkedin: '',
        expectedReachLinkedin: '',
        imageTwitter: '',
        imageLinkedin: '',
        svgTwitter: '',
        svgLinkedin: '',
        imagePromptTwitter: '',
        imagePromptLinkedin: '',
      });
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
        <div className="text-center mt-2 mt-3">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl font-bold bg-black bg-clip-text text-transparent">
              Social Spark
            </h1>
          </div>
          <p className="text-gray-400 mb-8 text-lg">
            AI-powered social media content generator
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Form */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-black text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
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
                className="w-full bg-black text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
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
            <CardHeader className="bg-black text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                
                Generated Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {generatedContent ? (
                <>
                  {/* Twitter Card */}
                  <Card className="shadow-md border-2 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-700">Twitter Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isImageLoading.twitter ? (
                        <div className="w-full flex justify-center mb-2">
                          <RefreshCw className="animate-spin w-8 h-8 text-blue-400" />
                        </div>
                      ) : generatedContent.imageUrlTwitter && (
                        <div className="w-full flex justify-center mb-2">
                          <img src={generatedContent.imageUrlTwitter} alt="Generated for Twitter" className="rounded-lg max-h-48 object-contain" />
                        </div>
                      )}
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {generatedContent.twitter}
                      </p>
                      <div className="mt-2 mb-2">
                        <span className="text-xs text-teal-700 font-semibold">Suggested Image:</span>
                        <span className="ml-2 text-xs text-gray-700">{generatedContent.imageTwitter}</span>
                      </div>
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>Best time to post:</span>
                          <span className="font-bold text-gray-800 ml-1">{generatedContent.bestTimeTwitter}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                          <Users className="w-4 h-4" />
                          <span>Estimated reach:</span>
                          <span className="font-bold text-gray-800 ml-1">{generatedContent.expectedReachTwitter}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* LinkedIn Card */}
                  <Card className="shadow-md border-2 border-blue-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-700">LinkedIn Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isImageLoading.linkedin ? (
                        <div className="w-full flex justify-center mb-2">
                          <RefreshCw className="animate-spin w-8 h-8 text-blue-700" />
                        </div>
                      ) : generatedContent.imageUrlLinkedin && (
                        <div className="w-full flex justify-center mb-2">
                          <img src={generatedContent.imageUrlLinkedin} alt="Generated for LinkedIn" className="rounded-lg max-h-48 object-contain" />
                        </div>
                      )}
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {generatedContent.linkedin}
                      </p>
                      <div className="mt-2 mb-2">
                        <span className="text-xs text-teal-700 font-semibold">Suggested Image:</span>
                        <span className="ml-2 text-xs text-gray-700">{generatedContent.imageLinkedin}</span>
                      </div>
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>Best time to post:</span>
                          <span className="font-bold text-gray-800 ml-1">{generatedContent.bestTimeLinkedin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                          <Users className="w-4 h-4" />
                          <span>Estimated reach:</span>
                          <span className="font-bold text-gray-800 ml-1">{generatedContent.expectedReachLinkedin}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
                    <div className="flex flex-col gap-4">
                      <div className="space-y-4">
                        <Button 
                          onClick={() => handlePost('linkedin', 'aniket')}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                        >
                          <Linkedin className="mr-2 h-4 w-4" /> Post on LinkedIn
                        </Button>
                        <Button 
                          onClick={() => handlePost('twitter', 'aniket')}
                          className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105"
                        >
                          <Twitter className="mr-2 h-4 w-4" /> Post on Twitter
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
            <Badge variant="secondary" className="bg-black text-white">AI-Powered</Badge>
            <Badge variant="secondary" className="bg-black text-white">Human-like</Badge>
            <Badge variant="secondary" className="bg-black text-white">Multi-Platform</Badge>
          </div>
          <p className="text-gray-600">
            Powered by NeuralArc AI • Built for content creators
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
