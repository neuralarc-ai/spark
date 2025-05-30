import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
async function generateImage(prompt: string, apiKey: string): Promise<{ image: string | null, caption: string }> {
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
                { text: prompt + '\nAlso provide a short caption for the image. Return both the image and the caption.' }
              ]
            }
          ]
        })
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image API error:', errorText);
      return { image: null, caption: '' };
    }
    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text);
    const imagePart = parts.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith('image/'));
    const caption = textPart?.text || '';
    const base64 = imagePart?.inlineData?.data;
    return { image: base64 ? `data:image/jpeg;base64,${base64}` : null, caption };
  } catch (err) {
    console.error('Image API error:', err);
    return { image: null, caption: '' };
  }
}

interface TrendingCard {
  title: string;
  bestTime: string;
  estimatedReach: string;
  category: string;
  twitterPrompt: string;
  linkedinPrompt: string;
}

const trendingCards: TrendingCard[] = [
  {
    title: "AI & Tech Trends",
    bestTime: "10:00 AM - 2:00 PM IST",
    estimatedReach: "5K-15K",
    category: "High Engagement",
    twitterPrompt: "Create a concise tweet about the latest AI and tech trends, focusing on practical applications and future implications. Include relevant hashtags.",
    linkedinPrompt: "Write a detailed LinkedIn post about emerging AI and tech trends, including industry insights, practical applications, and future implications. Make it professional and informative."
  },
  {
    title: "Industry Insights",
    bestTime: "9:00 AM - 11:00 AM IST",
    estimatedReach: "3K-10K",
    category: "Professional",
    twitterPrompt: "Create a concise tweet sharing valuable industry insights and professional observations. Include relevant hashtags.",
    linkedinPrompt: "Write a detailed LinkedIn post sharing in-depth industry insights, market analysis, and professional observations. Make it comprehensive and thought-provoking."
  },
  {
    title: "Success Stories",
    bestTime: "1:00 PM - 3:00 PM IST",
    estimatedReach: "4K-12K",
    category: "Inspirational",
    twitterPrompt: "Create an inspiring tweet about a success story or achievement. Make it motivational and include relevant hashtags.",
    linkedinPrompt: "Write a detailed LinkedIn post sharing an inspiring success story, including challenges overcome and lessons learned. Make it motivational and professional."
  },
  {
    title: "How-to Guides",
    bestTime: "11:00 AM - 1:00 PM IST",
    estimatedReach: "6K-18K",
    category: "Educational",
    twitterPrompt: "Create a concise tweet sharing a practical how-to tip or guide. Make it actionable and include relevant hashtags.",
    linkedinPrompt: "Write a detailed LinkedIn post providing a comprehensive how-to guide or tutorial. Include step-by-step instructions and practical tips."
  },
  {
    title: "Industry News",
    bestTime: "8:00 AM - 10:00 AM IST",
    estimatedReach: "7K-20K",
    category: "Breaking News",
    twitterPrompt: "Create a concise tweet about breaking industry news. Make it informative and include relevant hashtags.",
    linkedinPrompt: "Write a detailed LinkedIn post about breaking industry news, including analysis and implications. Make it professional and informative."
  }
];

const Index = () => {
  const [formData, setFormData] = useState({
    topic: '',
    tone: '',
    type: '',
    keyPoints: ''
  });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState<{twitter: boolean, linkedin: boolean}>({twitter: false, linkedin: false});
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState<TrendingCard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatedDialogContent, setGeneratedDialogContent] = useState<GeneratedContent | null>(null);
  const [isGeneratingDialog, setIsGeneratingDialog] = useState(false);

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
      Key points to include: ${formData.keyPoints || 'None specified'}
      
      Requirements:
      - Create TWO versions that are natural, conversational, and human-like:
        1. Twitter version (max 280 characters, concise, engaging, and authentic)
        2. LinkedIn version (detailed, at least 1000 characters, up to 3000 characters, professional but conversational)
      - Make the content feel natural and human-written
      - Add 3-5 relevant hashtags to both versions
      - For each version, also provide:
        - Best time to post (for maximum engagement, in IST - Indian Standard Time, UTC+5:30)
        - Expected reach (provide realistic estimates for small following accounts):
          Twitter: Base estimate 50-200 for small accounts (0-1K followers), scale up by 2-5x for larger accounts
          LinkedIn: Base estimate 100-500 for small accounts (0-500 connections), scale up by 2-5x for larger accounts
          Consider content type and engagement potential
          Format as: "X-Y (small accounts) to A-B (larger accounts)"
        - A detailed image prompt for an AI image generator
      - Format the response as:
        TWITTER: [Twitter post]
        IMAGE_PROMPT_TWITTER: [Image prompt for Twitter]
        BEST_TIME_TWITTER: [Best time to post on Twitter]
        EXPECTED_REACH_TWITTER: [Estimated reach with small to large account ranges]
        LINKEDIN: [LinkedIn post]
        IMAGE_PROMPT_LINKEDIN: [Image prompt for LinkedIn]
        BEST_TIME_LINKEDIN: [Best time to post on LinkedIn]
        EXPECTED_REACH_LINKEDIN: [Estimated reach with small to large account ranges]`;

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
            temperature: 0.8, // Increased temperature for more natural content
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
          const [twitterResult, linkedinResult] = await Promise.all([
            imagePromptTwitter ? generateImage(imagePromptTwitter, apiKey) : Promise.resolve({ image: null, caption: '' }),
            imagePromptLinkedin ? generateImage(imagePromptLinkedin, apiKey) : Promise.resolve({ image: null, caption: '' }),
          ]);
          setGeneratedContent(prev => prev && {
            ...prev,
            imageUrlTwitter: twitterResult.image || '',
            imageUrlLinkedin: linkedinResult.image || '',
            imageTwitter: twitterResult.caption,
            imageLinkedin: linkedinResult.caption,
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

  const handlePost = async (platform: 'twitter' | 'linkedin', account: 'aniket' | 'neuralArc', isDialog: boolean = false) => {
    try {
      const content = isDialog 
        ? (platform === 'twitter' ? generatedDialogContent?.twitter : generatedDialogContent?.linkedin)
        : (platform === 'twitter' ? generatedContent?.twitter : generatedContent?.linkedin);

      if (!content) {
        toast({
          title: "No Content",
          description: "Please generate content first before posting.",
          variant: "destructive",
        });
        return;
      }

      // Clean the content before posting
      const cleanContent = content.replace(/\*\*/g, '').replace(/\*/g, '');

      // Copy content to clipboard
      await navigator.clipboard.writeText(cleanContent);

      // Open the respective social media platform in a new window
      if (platform === 'twitter') {
        window.open('https://twitter.com/compose/tweet', '_blank');
      } else {
        window.open('https://www.linkedin.com/post/new', '_blank');
      }

      toast({
        title: "Content Copied!",
        description: `Content has been copied to clipboard. Please paste (Ctrl+V) in the ${platform === 'twitter' ? 'Twitter' : 'LinkedIn'} window that opened.`,
        duration: 5000,
      });

      // Optional: Try to post directly if the API is available
      try {
        if (platform === 'twitter') {
          await postToTwitter(cleanContent, account);
        } else {
          await postToLinkedIn(cleanContent, account);
        }
        toast({
          title: "Success",
          description: `Posted to ${platform === 'twitter' ? 'Twitter' : 'LinkedIn'} successfully!`,
        });
      } catch (apiError) {
        console.log('API posting failed, user can paste manually');
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to copy content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = async (card: TrendingCard) => {
    setSelectedCard(card);
    setIsDialogOpen(true);
    setIsGeneratingDialog(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        toast({
          title: "API Key Missing",
          description: "Please add your Google Gemini API key to the .env.local file.",
          variant: "destructive",
        });
        return;
      }

      const prompt = `Create two versions of a social media post based on this prompt:
        Twitter: ${card.twitterPrompt}
        LinkedIn: ${card.linkedinPrompt}
        
        Requirements:
        - Create TWO versions that are natural, conversational, and human-like:
          1. Twitter version (max 280 characters, concise, engaging, and authentic)
          2. LinkedIn version (detailed, at least 1000 characters, up to 3000 characters, professional but conversational)
        - Make the content feel natural and human-written
        - Add 3-5 relevant hashtags to both versions
        - For each version, also provide:
          - Best time to post (for maximum engagement, in IST - Indian Standard Time, UTC+5:30)
          - Expected reach (provide realistic estimates for small following accounts):
            Twitter: Base estimate 50-200 for small accounts (0-1K followers), scale up by 2-5x for larger accounts
            LinkedIn: Base estimate 100-500 for small accounts (0-500 connections), scale up by 2-5x for larger accounts
            Consider content type and engagement potential
            Format as: "X-Y (small accounts) to A-B (larger accounts)"
          - A detailed image prompt for an AI image generator
        - Format the response as:
          TWITTER: [Twitter post]
          IMAGE_PROMPT_TWITTER: [Image prompt for Twitter]
          BEST_TIME_TWITTER: [Best time to post on Twitter]
          EXPECTED_REACH_TWITTER: [Estimated reach with small to large account ranges]
          LINKEDIN: [LinkedIn post]
          IMAGE_PROMPT_LINKEDIN: [Image prompt for LinkedIn]
          BEST_TIME_LINKEDIN: [Best time to post on LinkedIn]
          EXPECTED_REACH_LINKEDIN: [Estimated reach with small to large account ranges]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      // Parse the content similar to the main generateContent function
      const twitterMatch = content.match(/TWITTER:([\s\S]*?)(?=IMAGE_PROMPT_TWITTER:|$)/);
      const imagePromptTwitterMatch = content.match(/IMAGE_PROMPT_TWITTER:([\s\S]*?)(?=BEST_TIME_TWITTER:|$)/);
      const bestTimeTwitterMatch = content.match(/BEST_TIME_TWITTER:([\s\S]*?)(?=EXPECTED_REACH_TWITTER:|$)/);
      const expectedReachTwitterMatch = content.match(/EXPECTED_REACH_TWITTER:([\s\S]*?)(?=LINKEDIN:|$)/);
      const linkedinMatch = content.match(/LINKEDIN:([\s\S]*?)(?=IMAGE_PROMPT_LINKEDIN:|$)/);
      const imagePromptLinkedinMatch = content.match(/IMAGE_PROMPT_LINKEDIN:([\s\S]*?)(?=BEST_TIME_LINKEDIN:|$)/);
      const bestTimeLinkedinMatch = content.match(/BEST_TIME_LINKEDIN:([\s\S]*?)(?=EXPECTED_REACH_LINKEDIN:|$)/);
      const expectedReachLinkedinMatch = content.match(/EXPECTED_REACH_LINKEDIN:([\s\S]*?)$/);

      // Update the trending card's estimated reach based on the generated content
      const twitterReach = expectedReachTwitterMatch ? expectedReachTwitterMatch[1].trim() : '';
      const linkedinReach = expectedReachLinkedinMatch ? expectedReachLinkedinMatch[1].trim() : '';
      
      // Update the card's estimated reach with the new values
      const updatedCard = {
        ...card,
        estimatedReach: `${twitterReach.split('(')[0].trim()} (Twitter) / ${linkedinReach.split('(')[0].trim()} (LinkedIn)`
      };

      setSelectedCard(updatedCard);
      setGeneratedDialogContent({
        twitter: twitterMatch ? twitterMatch[1].trim() : '',
        linkedin: linkedinMatch ? linkedinMatch[1].trim() : '',
        bestTimeTwitter: bestTimeTwitterMatch ? bestTimeTwitterMatch[1].trim() : '',
        expectedLikesTwitter: '',
        expectedReachTwitter: twitterReach,
        bestTimeLinkedin: bestTimeLinkedinMatch ? bestTimeLinkedinMatch[1].trim() : '',
        expectedLikesLinkedin: '',
        expectedReachLinkedin: linkedinReach,
        imageTwitter: '',
        imageLinkedin: '',
        svgTwitter: '',
        svgLinkedin: '',
        imagePromptTwitter: imagePromptTwitterMatch ? imagePromptTwitterMatch[1].trim() : '',
        imagePromptLinkedin: imagePromptLinkedinMatch ? imagePromptLinkedinMatch[1].trim() : '',
      });

      // Generate images
      const [twitterResult, linkedinResult] = await Promise.all([
        generateImage(imagePromptTwitterMatch ? imagePromptTwitterMatch[1].trim() : '', apiKey),
        generateImage(imagePromptLinkedinMatch ? imagePromptLinkedinMatch[1].trim() : '', apiKey),
      ]);

      setGeneratedDialogContent(prev => prev && {
        ...prev,
        imageUrlTwitter: twitterResult.image || '',
        imageUrlLinkedin: linkedinResult.image || '',
        imageTwitter: twitterResult.caption,
        imageLinkedin: linkedinResult.caption,
      });

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDialog(false);
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

        {/* Trending Cards Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Trending Content Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {trendingCards.map((card, index) => (
              <div 
                key={index}
                onClick={() => handleCardClick(card)}
                className="cursor-pointer"
              >
                <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 h-full">
                  <CardHeader className="pb-2 border-b border-gray-100">
                    <CardTitle className="text-base font-semibold text-gray-800">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Best time to post</p>
                          <p className="text-sm text-gray-700">{card.bestTime}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Estimated reach</p>
                          <p className="text-sm text-gray-700">{card.estimatedReach}</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-full justify-center bg-blue-50 text-blue-700 border border-blue-100">
                      {card.category}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Post Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Create Posts for {selectedCard?.title}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-2">
                    Generated content for Twitter and LinkedIn. You can edit and post directly from here.
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDialogOpen(false)}
                  className="hover:bg-gray-100 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              </div>
            </DialogHeader>

            {isGeneratingDialog ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600 text-lg">Generating content...</span>
              </div>
            ) : generatedDialogContent ? (
              <div className="space-y-8 py-4">
                {/* Twitter Card */}
                <Card className="border-2 border-blue-200 bg-white/50 backdrop-blur-sm">
                  <CardHeader className="pb-3 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Twitter className="w-5 h-5 text-blue-400" />
                        Twitter Version
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {generatedDialogContent.bestTimeTwitter.replace(/\*\*/g, '')}
                        </Badge>
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          {generatedDialogContent.expectedReachTwitter.replace(/\*\*/g, '')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {generatedDialogContent.imageUrlTwitter && (
                      <div className="w-full flex flex-col items-center mb-6">
                        <img 
                          src={generatedDialogContent.imageUrlTwitter} 
                          alt="Generated for Twitter" 
                          className="rounded-lg max-h-48 object-contain shadow-md" 
                        />
                        {generatedDialogContent.imageTwitter && (
                          <p className="text-sm text-gray-500 mt-2 italic">{generatedDialogContent.imageTwitter}</p>
                        )}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="relative">
                        <Textarea
                          value={generatedDialogContent.twitter.replace(/\*\*/g, '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 280) {
                              setGeneratedDialogContent(prev => prev ? {...prev, twitter: value} : null);
                            }
                          }}
                          className={`min-h-[120px] text-base leading-relaxed resize-none border-2 transition-colors ${
                            generatedDialogContent.twitter.length > 280 
                              ? 'border-red-300 focus:border-red-400' 
                              : 'border-blue-100 focus:border-blue-300'
                          }`}
                          placeholder="Your Twitter post will appear here..."
                        />
                        <div className={`absolute bottom-2 right-2 text-xs ${
                          generatedDialogContent.twitter.length > 280 ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {generatedDialogContent.twitter.length}/280
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Est. reach: {generatedDialogContent.expectedReachTwitter.replace(/\*\*/g, '')}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedDialogContent.twitter.replace(/\*\*/g, ''));
                              toast({
                                title: "Copied!",
                                description: "Twitter content copied to clipboard",
                              });
                            }}
                            variant="outline"
                            className="border-blue-200 hover:bg-blue-50"
                          >
                            Copy
                          </Button>
                          <Button 
                            onClick={() => handlePost('twitter', 'aniket', true)}
                            disabled={generatedDialogContent.twitter.length > 280}
                            className="bg-blue-400 hover:bg-blue-500 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Twitter className="w-4 h-4 mr-2" />
                            Post to Twitter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* LinkedIn Card */}
                <Card className="border-2 border-blue-700 bg-white/50 backdrop-blur-sm">
                  <CardHeader className="pb-3 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Linkedin className="w-5 h-5 text-blue-700" />
                        LinkedIn Version
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {generatedDialogContent.bestTimeLinkedin.replace(/\*\*/g, '')}
                        </Badge>
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          {generatedDialogContent.expectedReachLinkedin.replace(/\*\*/g, '')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {generatedDialogContent.imageUrlLinkedin && (
                      <div className="w-full flex flex-col items-center mb-6">
                        <img 
                          src={generatedDialogContent.imageUrlLinkedin} 
                          alt="Generated for LinkedIn" 
                          className="rounded-lg max-h-48 object-contain shadow-md" 
                        />
                        {generatedDialogContent.imageLinkedin && (
                          <p className="text-sm text-gray-500 mt-2 italic">{generatedDialogContent.imageLinkedin}</p>
                        )}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="relative">
                        <Textarea
                          value={generatedDialogContent.linkedin.replace(/\*\*/g, '').replace(/\*/g, '')}
                          onChange={(e) => setGeneratedDialogContent(prev => prev ? {...prev, linkedin: e.target.value} : null)}
                          className="min-h-[400px] text-base leading-relaxed resize-none border-2 border-blue-100 focus:border-blue-300 transition-colors"
                          placeholder="Your LinkedIn post will appear here..."
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {generatedDialogContent.linkedin.length} characters
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Est. reach: {generatedDialogContent.expectedReachLinkedin.replace(/\*\*/g, '')}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedDialogContent.linkedin.replace(/\*\*/g, '').replace(/\*/g, ''));
                              toast({
                                title: "Copied!",
                                description: "LinkedIn content copied to clipboard",
                              });
                            }}
                            variant="outline"
                            className="border-blue-200 hover:bg-blue-50"
                          >
                            Copy
                          </Button>
                          <Button 
                            onClick={() => handlePost('linkedin', 'aniket', true)}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-6"
                          >
                            <Linkedin className="w-4 h-4 mr-2" />
                            Post to LinkedIn
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

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
                    <SelectItem value="tutorial">Tutorial/How-to</SelectItem>
                    <SelectItem value="case-study">Case Study</SelectItem>
                    <SelectItem value="product-launch">Product Launch</SelectItem>
                    <SelectItem value="event">Event/Promotion</SelectItem>
                    <SelectItem value="industry-trend">Industry Trend</SelectItem>
                    <SelectItem value="behind-scenes">Behind the Scenes</SelectItem>
                    <SelectItem value="achievement">Achievement/Milestone</SelectItem>
                    <SelectItem value="poll">Poll/Survey</SelectItem>
                    <SelectItem value="infographic">Infographic/Stats</SelectItem>
                  </SelectContent>
                </Select>
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
                      ) : (generatedContent.imageUrlTwitter ? (
                        <div className="w-full flex flex-col items-center mb-2">
                          <img src={generatedContent.imageUrlTwitter} alt="Generated for Twitter" className="rounded-lg max-h-48 object-contain" />
                          {generatedContent.imageTwitter && (
                            <span className="block mt-2 text-xs text-gray-700 italic">{generatedContent.imageTwitter}</span>
                          )}
                        </div>
                      ) : null)}
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
                      ) : (generatedContent.imageUrlLinkedin ? (
                        <div className="w-full flex flex-col items-center mb-2">
                          <img src={generatedContent.imageUrlLinkedin} alt="Generated for LinkedIn" className="rounded-lg max-h-48 object-contain" />
                          {generatedContent.imageLinkedin && (
                            <span className="block mt-2 text-xs text-gray-700 italic">{generatedContent.imageLinkedin}</span>
                          )}
                        </div>
                      ) : null)}
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
                      onClick={generateContent}
                      disabled={isGenerating}
                      variant="outline"
                      className="border-2 border-blue-200 hover:bg-blue-50 transition-all duration-200"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </>
                      )}
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
