import { Facebook, Linkedin, Twitter, Send } from "lucide-react";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  compact?: boolean;
}

const SocialShareButtons = ({ url, title, compact = false }: SocialShareButtonsProps) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    tiktok: `https://www.tiktok.com/share?url=${encodedUrl}`,
    telegram: `https://t.me/tkwni`,
  };

  const handleShare = (e: React.MouseEvent, platform: keyof typeof shareLinks) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(shareLinks[platform], '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => handleShare(e, 'facebook')}
          className="p-1.5 rounded-full hover:bg-[#1877F2]/10 text-muted-foreground hover:text-[#1877F2] transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => handleShare(e, 'twitter')}
          className="p-1.5 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Share on X"
        >
          <Twitter className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => handleShare(e, 'linkedin')}
          className="p-1.5 rounded-full hover:bg-[#0A66C2]/10 text-muted-foreground hover:text-[#0A66C2] transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => handleShare(e, 'tiktok')}
          className="p-1.5 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Share on TikTok"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        </button>
        <button
          onClick={(e) => handleShare(e, 'telegram')}
          className="p-1.5 rounded-full hover:bg-[#0088cc]/10 text-muted-foreground hover:text-[#0088cc] transition-colors"
          aria-label="Telegram"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => handleShare(e, 'facebook')}
        className="p-2 rounded-lg bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-colors"
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => handleShare(e, 'twitter')}
        className="p-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
        aria-label="Share on X"
      >
        <Twitter className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => handleShare(e, 'linkedin')}
        className="p-2 rounded-lg bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90 transition-colors"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => handleShare(e, 'tiktok')}
        className="p-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
        aria-label="Share on TikTok"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      </button>
      <button
        onClick={(e) => handleShare(e, 'telegram')}
        className="p-2 rounded-lg bg-[#0088cc] text-white hover:bg-[#0088cc]/90 transition-colors"
        aria-label="Telegram"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};

export default SocialShareButtons;
