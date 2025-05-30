import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Twitter, Linkedin, Wand2, SettingsIcon, Clock, Heart, Users, Search, ArrowUpRight, X } from "lucide-react";
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

interface InterestedContact {
  name: string;
  subtitle: string;
  match: number;
}

interface GeneratedPost {
  platform: 'LinkedIn' | 'Twitter';
  score: number;
  title: string;
  content: string;
  reach: string;
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  engagementPotential: number;
  bestTime: string;
  interestedContacts: InterestedContact[];
  created: string;
  targetArea: string;
  likePercentage: number;
  imageUrl?: string;
  imageCaption?: string;
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
              role: "user",
              parts: [
                { text: `Generate an image for: ${prompt}. Use only these colors : #161616, #1E342F, #2B2521, #3987BE, #495663, #97A487, #A8B0B8, #A9A9A9, #B7A694, #B7BEAE, #C6AEA3, #CFD2D4, #CFD4C9, #D0C3B5, #D48EA3, #E3E2DF, #F8F7F3.` }
              ]
            }
          ],
          generation_config: {
            // Corrected parameter name: response_modalities
            response_modalities: ["IMAGE", "TEXT"] // Request both image and text
          }
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

    // Use the actual mimeType from the response if available, or default to image/jpeg
    const mimeType = imagePart?.inlineData?.mimeType || 'image/jpeg'; 

    return { image: base64 ? `data:${mimeType};base64,${base64}` : null, caption };
  } catch (err) {
    console.error('Image API error:', err);
    return { image: null, caption: '' };
  }
}

// Example usage:
// (Remember to replace 'YOUR_API_KEY' with your actual API key)
// generateImage("A playful golden retriever puppy chasing a butterfly in a sunny meadow.", "YOUR_API_KEY")
//   .then(result => {
//     if (result.image) {
//       console.log('Image generated! Base64 data (first 50 chars):', result.image.substring(0, 50) + "...");
//       console.log('Caption:', result.caption);
//       // You can now use result.image in an <img> tag:
//       // document.getElementById('myImage').src = result.image;
//     } else {
//       console.log('Failed to generate image.');
//     }
//   })
//   .catch(error => console.error('Error in example usage:', error));

// Example usage (replace with your actual API key and desired prompt)
// generateImage("A majestic lion sitting on a rock at sunset.", "YOUR_API_KEY_HERE")
//   .then(result => {
//     if (result.image) {
//       console.log('Image generated:', result.image.substring(0, 50) + "..."); // Log first 50 chars of base64
//       console.log('Caption:', result.caption);
//       // You can then display this base64 image in an <img> tag:
//       // <img src={result.image} alt={result.caption} />
//     } else {
//       console.log('Image generation failed.');
//     }
//   })
//   .catch(error => console.error('Error in example usage:', error));
// Add TrendingUpIcon SVG component
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-trending-up">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M3 17l6 -6l4 4l8 -8" />
    <path d="M14 7l7 0l0 7" />
  </svg>
);

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
  const trendingTopicsSets = [
    [
      "Artificial Intelligence integration",
      "AI-driven personalization",
      "Generative AI tools", 
      "Machine Learning automation",
      "ChatGPT enterprise adoption",
      "AI content creation",
      "Neural networks advancement",
      "Robotics automation"
    ],
    [
      "AI ethics and governance",
      "Computer vision technology", 
      "Natural language processing",
      "AI in healthcare",
      "Autonomous vehicles",
      "Smart city technologies",
      "Quantum computing",
      "Blockchain innovations"
    ],
    [
      "Cryptocurrency trends",
      "NFT marketplace evolution",
      "Web3 development",
      "Metaverse platforms",
      "Remote work optimization",
      "Hybrid workplace strategies",
      "Digital nomad lifestyle",
      "Skills-based hiring"
    ],
    [
      "Career pivoting strategies",
      "Personal branding online",
      "LinkedIn networking tactics",
      "Professional mentorship",
      "Leadership development",
      "Emotional intelligence",
      "Work-life balance",
      "Employee wellness programs"
    ],
    [
      "Diversity and inclusion",
      "Gender pay gap discussions",
      "Quiet leadership trends",
      "Startup funding rounds",
      "Venture capital trends",
      "Business model innovation",
      "Digital transformation",
      "E-commerce growth"
    ],
    [
      "Subscription economy",
      "Creator economy expansion",
      "Influencer marketing ROI",
      "Social commerce",
      "B2B marketing automation",
      "Customer experience optimization",
      "Data-driven decision making",
      "Supply chain resilience"
    ],
    [
      "Sustainable business practices",
      "ESG investing",
      "Short-form video content",
      "Interactive content formats",
      "Live streaming engagement",
      "User-generated content",
      "Micro-influencer partnerships",
      "Authentic storytelling"
    ]
  ];
  const [trendingTopics, setTrendingTopics] = useState<string[]>(trendingTopicsSets[0]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHumanizingModal, setIsHumanizingModal] = useState(false);

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

  // Handler for Search button
  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setIsSearching(true);
    setGeneratedPosts([]);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const prompt = `Generate 4 social media posts (2 for LinkedIn, 2 for Twitter) for the topic: "${searchValue}". For each post, provide the following fields:
- platform: (LinkedIn or Twitter)
- title: (catchy, max 60 chars)
- content: (for LinkedIn: detailed, multi-paragraph, professional, 800-1500 characters, and must start with a heading in the format 'Heading: ...' on the first line, then a blank line, then the body; for Twitter: concise, max 280 characters)
- reach: (e.g. 3K - 11K)
- likes: (number)
- comments: (number)
- shares: (number)
- hashtags: (array of 2-4 relevant hashtags)
- score: (as a percentage, e.g. 94)
- engagementPotential: (as a percentage, e.g. 94)
- bestTime: (best time to post, e.g. 9:00 AM - 11:00 AM)
- targetArea: (the main area, industry, or audience this post targets)
- likePercentage: (estimated percentage of people who will like this post)
- interestedContacts: (array of 3 objects, each with name, subtitle, and match percentage)
- created: (date, format: DD/MM/YYYY)
- Do not use asterisks (*) anywhere in the content, including for bullet points, emphasis, or formatting.
Format the response as a JSON array of objects with these keys: platform, title, content, reach, likes, comments, shares, hashtags, score, engagementPotential, bestTime, targetArea, likePercentage, interestedContacts, created.`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
        })
      });
      if (!response.ok) throw new Error('Failed to generate posts');
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[.*\]/s);
      let posts: GeneratedPost[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // Generate images for each post
      posts = await Promise.all(posts.map(async (post) => {
        // Use hashtags or content as prompt
        let imagePrompt = post.hashtags && post.hashtags.length > 0
          ? `Create an image for a social media post about: ${post.hashtags.join(', ')}.`
          : `Create an image for this post: ${post.content}`;
        const imgResult = await generateImage(imagePrompt, apiKey);
        return {
          ...post,
          imageUrl: imgResult.image || '',
          imageCaption: imgResult.caption || '',
        };
      }));

      setGeneratedPosts(posts);
    } catch (err) {
      setGeneratedPosts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCardClick = (post: GeneratedPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleRefreshTrending = () => {
    let newSet;
    do {
      newSet = trendingTopicsSets[Math.floor(Math.random() * trendingTopicsSets.length)];
    } while (newSet === trendingTopics);
    setTrendingTopics(newSet);
    setSelectedTopic(null);
    setSearchValue("");
  };

  // Share post from modal
  const handleSharePost = async () => {
    if (!selectedPost) return;
    try {
      let account: 'aniket' | 'neuralArc' = 'aniket'; // Default or let user choose
      if (selectedPost.platform === 'Twitter') {
        await postToTwitter(selectedPost.content, account);
        toast({
          title: "Success",
          description: `Posted to Twitter successfully!`,
        });
      } else {
        await postToLinkedIn(selectedPost.content, account);
        toast({
          title: "Success",
          description: `Posted to LinkedIn successfully!`,
        });
      }
      setIsModalOpen(false);
      setSelectedPost(null);
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "Error",
        description: "Failed to post content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Humanize post from modal
  const handleHumanizeModal = async () => {
    if (!selectedPost) return;
    setIsHumanizingModal(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      let prompt, heading = '', body = '';
      if (selectedPost.platform === 'LinkedIn') {
        // Extract heading and body
        const match = selectedPost.content.match(/^Heading:\s*(.*)\n\n([\s\S]*)/);
        if (match) {
          heading = match[1];
          body = match[2];
        } else {
          body = selectedPost.content;
        }
        prompt = `Make this LinkedIn post more natural and conversational while keeping the same message. Return ONLY the improved body (not the heading), no explanations or formatting:\n\n${body}`;
      } else {
        prompt = `Make this social media post more natural and conversational while keeping the same message. Return ONLY the improved version, no explanations or formatting:\n\n${selectedPost.content}`;
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [ { parts: [ { text: prompt } ] } ],
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 }
        })
      });
      if (!response.ok) throw new Error('Failed to humanize content');
      const data = await response.json();
      const newBody = data.candidates[0].content.parts[0].text.trim();
      let newContent;
      if (selectedPost.platform === 'LinkedIn' && heading) {
        newContent = `Heading: ${heading}\n\n${newBody}`;
      } else {
        newContent = newBody;
      }
      setSelectedPost({ ...selectedPost, content: newContent });
      toast({
        title: "Content Humanized!",
        description: "Your post has been made more natural and engaging.",
      });
    } catch (error) {
      toast({
        title: "Humanization Failed",
        description: "Failed to humanize content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsHumanizingModal(false);
    }
  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-[1600px] w-full mx-auto px-2 sm:px-4">
        <div className="text-center mt-2 mt-9">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl font-bold bg-black bg-clip-text text-transparent">
              Social Spark
            </h1>
          </div>
          <p className="text-gray-400 mb-8 text-lg">
            AI-powered social media content generator
          </p>
        </div>
        {/* Trending Topics Section */}
        <div className="mb-8 bg-white rounded-2xl shadow p-6 border border-gray-100">
          <div className="mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-700" />
            <span className="text-xl font-semibold text-gray-900">Industry Trend Discovery</span>
          </div>
          <div className="flex gap-2 mb-2">
            <Input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="What are you looking for?"
              className="flex-1 rounded-lg border border-gray-200 focus:border-blue-500 px-4 py-2 text-base shadow-none"
              style={{ minHeight: 44 }}
            />
            <Button
              className="bg-black text-white rounded-lg px-6 text-base h-11"
              style={{ minHeight: 44 }}
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}Generate
            </Button>
            <Button
              variant="outline"
              className="border-2 border-gray-200 rounded-lg px-6 text-base h-11"
              style={{ minHeight: 44 }}
              onClick={handleRefreshTrending}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />Refresh
            </Button>
          </div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 mt-4">Trending Topics</div>
          <div className="flex flex-wrap gap-3">
            {trendingTopics.map(topic => (
              <button
                key={topic}
                type="button"
                onClick={() => { setSearchValue(topic); setSelectedTopic(topic); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-base font-medium transition-colors
                  ${selectedTopic === topic ? 'bg-black text-white border-black shadow' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}
                `}
                style={{ minWidth: 0 }}
              >
                <TrendingUpIcon />
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Render generated posts as cards below trending section */}
        {generatedPosts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-semibold text-black">Generated Posts for "{searchValue}"</span>
              <span className="text-gray-500 text-sm">{generatedPosts.length} posts created</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {generatedPosts.map((post, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow border border-gray-100 p-6 flex flex-col gap-2 min-h-[220px] max-w-[370px] mx-auto cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick(post)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${post.platform === 'LinkedIn' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-900'}`}>{post.platform}</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{post.score}% Score</span>
                  </div>
                  <div className="font-bold text-base text-gray-900 mb-1">{post.title}</div>
                  <div className="text-gray-700 text-sm mb-2 line-clamp-2">{post.content}</div>
                  <div className="flex items-center gap-4 text-xs mb-2">
                    <span className="flex items-center gap-1 text-blue-700 font-semibold"><span role="img" aria-label="reach">👁️</span>{post.reach}</span>
                    <span className="flex items-center gap-1 text-red-500 font-semibold"><span role="img" aria-label="likes">❤️</span>{post.likes}</span>
                    <span className="flex items-center gap-1 text-green-600 font-semibold"><span role="img" aria-label="comments">💬</span>{post.comments}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-auto">Created: {post.created}</div>
                </div>
              ))}
            </div>
          </div>
        )}


{/*  

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
         
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

         
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-black text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                
                Generated Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {generatedContent ? (
                <>
               
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
  */}




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

        {/* Modal for post details */}
        {isModalOpen && selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-2 p-0 relative flex flex-col">
              {/* Close button */}
              <button className="absolute top-4 right-4 text-gray-400 hover:text-black" onClick={handleCloseModal}><X className="w-6 h-6" /></button>
              {/* Header */}
              <div className="flex flex-row items-center gap-3 px-8 pt-8 pb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedPost.platform === 'LinkedIn' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-900'}`}>{selectedPost.platform}</span>
                <span className="font-bold text-xl text-gray-900">{selectedPost.title}</span>
              </div>
              <div className="flex flex-col md:flex-row gap-6 px-8 pb-6">
                {/* Left: Post Content & Metrics */}
                <div className="flex-1 min-w-[260px]">
                  <div className="font-semibold text-base text-gray-900 mb-2 mt-2">Post Content</div>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-800 text-sm mb-4 whitespace-pre-line h-64 overflow-y-auto">
                    {selectedPost.platform === 'LinkedIn' ? (
                      (() => {
                        // Expecting format: Heading: ...\n\nBody...
                        const match = selectedPost.content.match(/^Heading:\s*(.*)\n\n([\s\S]*)/);
                        if (match) {
                          return <>
                            <div className="font-bold text-base mb-2">{match[1]}</div>
                            <div>{match[2]}</div>
                          </>;
                        } else {
                          return <>{selectedPost.content}</>;
                        }
                      })()
                    ) : (
                      <>{selectedPost.content}</>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedPost.hashtags && selectedPost.hashtags.map((tag, i) => (
                        <span key={i} className="bg-white border border-gray-300 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="font-semibold text-base text-gray-900 mb-2">Performance Metrics</div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-start">
                      <span className="text-xs text-blue-700 font-semibold mb-1 flex items-center gap-1"><span role='img' aria-label='reach'>👁️</span> Reach</span>
                      <span className="text-xl font-bold text-blue-900">{selectedPost.reach}</span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 flex flex-col items-start">
                      <span className="text-xs text-green-700 font-semibold mb-1 flex items-center gap-1"><span role='img' aria-label='engagement'>↗️</span> Engagement</span>
                      <span className="text-xl font-bold text-green-900">{selectedPost.engagementPotential}%</span>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 flex flex-col items-start">
                      <span className="text-xs text-red-700 font-semibold mb-1 flex items-center gap-1"><span role='img' aria-label='likes'>❤️</span> Likes</span>
                      <span className="text-xl font-bold text-red-900">{selectedPost.likes}</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-start">
                      <span className="text-xs text-purple-700 font-semibold mb-1 flex items-center gap-1"><span role='img' aria-label='shares'>🔄</span> Shares</span>
                      <span className="text-xl font-bold text-purple-900">{selectedPost.shares}</span>
                    </div>
                  </div>
                </div>
                {/* Right: AI Insights & Contacts */}
                <div className="flex-1 min-w-[220px] flex flex-col gap-4 mt-2">
                  <div>
                    <div className="font-semibold text-base text-gray-900 mb-2">AI Insights</div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span>Engagement Potential</span>
                        <span className="font-bold">{selectedPost.engagementPotential}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                        <div className="h-2 bg-black rounded-full" style={{ width: `${selectedPost.engagementPotential}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-yellow-700" />
                      <span className="text-xs text-gray-900 font-semibold">Best Time to Post</span>
                      <span className="text-xs text-gray-700 ml-auto">{selectedPost.bestTime}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-base text-gray-900 mb-2">Interested Contacts</div>
                    <div className="flex flex-col gap-2">
                      <div className="bg-gray-50 rounded-lg px-3 py-3 border border-gray-200 flex flex-col gap-2 mb-2">
                        <div className="text-xs text-gray-500">Target Area</div>
                        <div className="font-semibold text-sm text-gray-900">{selectedPost.targetArea}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">% of people likely to like this post:</span>
                          <span className="bg-white border border-gray-300 text-gray-900 px-2 py-1 rounded-full text-xs font-semibold">{selectedPost.likePercentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Generated Image Section */}
                  {selectedPost.imageUrl && (
                    <div className="flex flex-col items-center mt-2 mb-4">
                      <img src={selectedPost.imageUrl} alt="Generated for this post" className="rounded-lg max-h-40 object-contain border border-gray-200" />
                      {selectedPost.imageCaption && (
                        <span className="block mt-2 text-xs text-gray-700 italic text-center">{selectedPost.imageCaption}</span>
                      )}
                      <button
                        className="mt-2 px-4 py-1 bg-black text-white rounded hover:bg-gray-800 text-xs"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedPost.imageUrl!;
                          link.download = 'generated-image.jpg';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Download Image (JPG)
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Footer */}
              <div className="flex justify-end gap-2 px-8 pb-6 pt-2">
                <Button variant="outline" onClick={handleCloseModal}>Close</Button>
                <Button onClick={handleHumanizeModal} disabled={isHumanizingModal} variant="secondary">
                  {isHumanizingModal ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Humanize
                </Button>
                <Button className="bg-black text-white" onClick={handleSharePost}>Share Post</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>




  );
};





export default Index;
