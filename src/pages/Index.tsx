import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Twitter, Linkedin, Wand2, SettingsIcon, Clock, Heart, Users, Search, ArrowUpRight, X, Lock } from "lucide-react";
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
                { text: `Read the following social media post content and generate a single, visually appealing image that perfectly represents the main idea, theme, or message of the post. The image must be in the style of Studio Ghibli (soft, whimsical, detailed, and storybook-like). Use only these colors (with different opacities): #161616, #1E342F, #2B2521, #495663, #97A487, #A8B0B8, #A9A9A9, #B7A694, #B7BEAE, #C6AEA3, #CFD2D4, #CFD4C9, #D0C3B5, #E3E2DF, #F8F7F3. The image should be highly relevant and suitable for sharing with the post on social media. Also provide a very short caption for the image (5 words or less).\n\nPost content:\n${prompt}` }
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

// Add these styles at the top of the file, after imports
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .pin-modal {
    animation: fadeIn 0.3s ease-out;
  }
  .pin-modal.shake {
    animation: shake 0.5s ease-in-out;
  }
  .lock-icon {
    animation: pulse 2s infinite;
  }
  .pin-input {
    transition: all 0.2s ease;
  }
  .pin-input:focus {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .pin-input.filled {
    background: linear-gradient(145deg, #ffffff, #f3f4f6);
  }
  .pin-input.error {
    border-color: #ef4444;
    background: #fef2f2;
  }
`;

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
  const [expectedPosts, setExpectedPosts] = useState(0);
  const [customImagePrompt, setCustomImagePrompt] = useState("");
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [showPinModal, setShowPinModal] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [shakeModal, setShakeModal] = useState(false);
  const [filledInputs, setFilledInputs] = useState<boolean[]>([false, false, false, false]);

  // For 4-digit PIN input
  const pinDigits = [0, 1, 2, 3];
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handlePinDigitChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newPin = pinInput.split("");
    newPin[idx] = val;
    const pinStr = newPin.join("").padEnd(4, "");
    setPinInput(pinStr);
    setPinError("");
    
    // Update filled state
    const newFilledInputs = [...filledInputs];
    newFilledInputs[idx] = !!val;
    setFilledInputs(newFilledInputs);
    
    if (val && idx < 3) {
      pinRefs[idx + 1].current?.focus();
    }
  };
  const handlePinBoxKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinInput[idx] && idx > 0) {
      pinRefs[idx - 1].current?.focus();
    }
  };

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
        - A detailed image prompt for an AI image generator. The image should be visually appealing, relevant to the post, and suitable for direct posting on LinkedIn or Twitter.
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
    setExpectedPosts(4); // We always generate 4 posts
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const prompt = `Generate 4 social media posts (2 for LinkedIn, 2 for Twitter) for the topic: "${searchValue}". For each post, provide the following fields:
- platform: (LinkedIn or Twitter)
- title: (catchy, max 60 chars)
- content: (for LinkedIn: detailed, multi-paragraph, professional, 800-1500 characters, and must start with a heading in the format 'Heading: ...' on the first line, then a blank line, then the body; for Twitter: concise, max 280 characters)
- reach: (a number between 300 and 500)
- likes: (a number between 20 and 45)
- comments: (a number between 5 and 10)
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

      // Generate images for each post and display them one by one
      for (const post of posts) {
        let imagePrompt = post.content;
        let imgResult = await generateImage(imagePrompt, apiKey);
        // Retry once with a fallback prompt if image generation fails
        if (!imgResult.image) {
          imgResult = await generateImage('Create a visually appealing image for a social media post. ' + post.content, apiKey);
        }
        // Use a placeholder if still no image
        const placeholder =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20">No Image</text></svg>';
        const newPost = {
          ...post,
          imageUrl: imgResult.image || placeholder,
          imageCaption: imgResult.caption || '',
        };
        setGeneratedPosts(prev => [...prev, newPost]);
      }
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
        // For LinkedIn, append hashtags
        let contentToShare = selectedPost.content;
        if (selectedPost.hashtags && selectedPost.hashtags.length > 0) {
          contentToShare += '\n\n' + selectedPost.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`).join(' ');
        }
        await postToLinkedIn(contentToShare, account);
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

  // Clear all generated posts
  const handleClearPosts = () => {
    setGeneratedPosts([]);
    setExpectedPosts(0);
  };

  // Refresh posts for the current search value
  const handleRefreshPosts = () => {
    if (searchValue.trim()) {
      handleSearch();
    }
  };

  // Copy LinkedIn post content and hashtags to clipboard
  const handleCopyLinkedIn = () => {
    if (!selectedPost || selectedPost.platform !== 'LinkedIn') return;
    // Extract heading/body for LinkedIn
    let contentToCopy = '';
    const match = selectedPost.content.match(/^Heading:\s*(.*)\n\n([\s\S]*)/);
    if (match) {
      contentToCopy = `${match[1]}\n\n${match[2]}`;
    } else {
      contentToCopy = selectedPost.content;
    }
    // Add hashtags
    if (selectedPost.hashtags && selectedPost.hashtags.length > 0) {
      contentToCopy += '\n\n' + selectedPost.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`).join(' ');
    }
    navigator.clipboard.writeText(contentToCopy);
    toast({
      title: "Copied!",
      description: "LinkedIn post and hashtags copied to clipboard.",
    });
  };

  // Regenerate image for the selected post in the modal
  const handleRegenerateImage = async () => {
    if (!selectedPost) return;
    setIsRegeneratingImage(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      let prompt = customImagePrompt.trim() ? customImagePrompt : selectedPost.content;
      if (selectedPost.platform === 'Twitter') {
        prompt += '\nThe image must be square (1:1 aspect ratio).';
      } else if (selectedPost.platform === 'LinkedIn') {
        prompt += '\nThe image must be portrait (3:4 aspect ratio).';
      }
      const imgResult = await generateImage(prompt, apiKey);
      setSelectedPost({ ...selectedPost, imageUrl: imgResult.image || '', imageCaption: imgResult.caption || '' });
      toast({
        title: "Image Regenerated!",
        description: "A new image has been generated for this post.",
      });
    } catch (error) {
      toast({
        title: "Image Generation Failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === "1111") {
      setShowPinModal(false);
      setPinError("");
      setShakeModal(false);
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setShakeModal(true);
      setTimeout(() => setShakeModal(false), 500);
    }
  };

  return (
    <>
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/70 to-black/50 backdrop-blur-sm">
          <style>{styles}</style>
          <form 
            onSubmit={handlePinSubmit} 
            className={`pin-modal bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 flex flex-col items-center min-w-[360px] ${shakeModal ? 'shake' : ''}`}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl"></div>
              <Lock className="lock-icon w-10 h-10 text-blue-600 relative z-10" />
            </div>
            
            <h2 className="text-2xl font-bold mb-6 tracking-wide bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Enter Security PIN
            </h2>
            
            <div className="flex gap-4 mb-6">
              {pinDigits.map((_, idx) => (
                <input
                  key={idx}
                  ref={pinRefs[idx]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  className={`pin-input w-14 h-16 text-center text-3xl border-2 rounded-xl outline-none transition-all duration-200
                    ${pinError ? 'error' : 'border-gray-200 hover:border-blue-300'}
                    ${filledInputs[idx] ? 'filled' : ''}
                    focus:border-blue-500 bg-white font-mono shadow-sm`}
                  value={pinInput[idx] || ""}
                  onChange={e => handlePinDigitChange(idx, e.target.value)}
                  onKeyDown={e => handlePinBoxKeyDown(idx, e)}
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            
            {pinError && (
              <div className="text-red-500 text-sm mb-4 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pinError}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full mt-2 text-lg py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Verify PIN
            </Button>
            
            <p className="text-xs text-gray-500 mt-4">
              Enter the 4-digit PIN to access the application
            </p>
          </form>
        </div>
      )}
      {!showPinModal && (
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
            {(generatedPosts.length > 0 || expectedPosts > 0) && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-semibold text-black">Generated Posts for "{searchValue}"</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-sm">{generatedPosts.length} posts created</span>
                    <Button variant="outline" size="sm" onClick={handleRefreshPosts} disabled={isSearching}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearPosts}>
                      Clear
                    </Button>
                  </div>
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
                  {/* Skeleton cards for posts still processing */}
                  {Array.from({ length: Math.max(0, expectedPosts - generatedPosts.length) }).map((_, idx) => (
                    <div key={`skeleton-${idx}`} className="bg-gray-100 rounded-xl shadow border border-gray-200 p-6 flex flex-col gap-2 min-h-[220px] max-w-[370px] mx-auto animate-pulse">
                      <div className="flex items-center justify-between mb-1">
                        <div className="h-5 w-20 bg-gray-300 rounded-full" />
                        <div className="h-5 w-16 bg-gray-300 rounded-full" />
                      </div>
                      <div className="h-6 w-3/4 bg-gray-300 rounded mb-1" />
                      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                      <div className="flex items-center gap-4 text-xs mb-2">
                        <div className="h-4 w-12 bg-gray-200 rounded-full" />
                        <div className="h-4 w-10 bg-gray-200 rounded-full" />
                        <div className="h-4 w-10 bg-gray-200 rounded-full" />
                      </div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded mt-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    </div>
                    {/* Generated Image Section */}
                    <div className="flex flex-col items-center mt-2 mb-4">
                      <div
                        className={
                          selectedPost.platform === 'Twitter'
                            ? 'w-40 h-40 flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200'
                            : 'w-36 h-48 flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200'
                        }
                      >
                        <img
                          src={selectedPost.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'><rect width=\'200\' height=\'200\' fill=\'%23e5e7eb\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%239ca3af\' font-size=\'20\'>No Image</text></svg>'}
                          alt="Generated for this post"
                          className="object-cover w-full h-full"
                        />
                      </div>
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
                      <div className="flex flex-col items-center gap-2 mt-3 w-full">
                        <input
                          type="text"
                          className="w-full px-3 py-1 border border-gray-300 rounded text-xs"
                          placeholder="Enter custom prompt for image..."
                          value={customImagePrompt}
                          onChange={e => setCustomImagePrompt(e.target.value)}
                          disabled={isRegeneratingImage}
                        />
                        <Button
                          size="sm"
                          className="mt-1"
                          onClick={handleRegenerateImage}
                          disabled={isRegeneratingImage}
                        >
                          {isRegeneratingImage ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Regenerate Image
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
