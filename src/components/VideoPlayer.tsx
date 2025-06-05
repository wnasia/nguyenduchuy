
import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

const VideoPlayer = ({ src, poster, className = "" }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handlePlayPause = (video: HTMLVideoElement) => {
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('Error playing video:', error);
        setVideoError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = (video: HTMLVideoElement) => {
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVideoError = () => {
    setVideoError(true);
    console.error('Video failed to load:', src);
  };

  const isValidVideoUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const validExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
      const validHosts = ['youtube.com', 'youtu.be', 'vimeo.com'];
      
      return validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext)) ||
             validHosts.some(host => urlObj.hostname.includes(host));
    } catch {
      return false;
    }
  };

  // Handle YouTube and Vimeo URLs
  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = '';
        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        } else {
          videoId = urlObj.searchParams.get('v') || '';
        }
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Vimeo
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/').pop();
        if (videoId) {
          return `https://player.vimeo.com/video/${videoId}`;
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(src);

  if (videoError || !isValidVideoUrl(src)) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center text-gray-500">
          <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Video unavailable</p>
          <p className="text-xs mt-1">Please check the video URL</p>
        </div>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={embedUrl}
          className="w-full h-full min-h-[300px]"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video player"
        />
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden group ${className}`}>
      <video
        className="w-full h-auto"
        poster={poster || "/placeholder.svg"}
        onError={handleVideoError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
      
      {/* Custom controls overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center gap-4 bg-black/70 rounded-lg px-4 py-2">
          <button
            onClick={(e) => {
              const video = e.currentTarget.closest('div')?.querySelector('video');
              if (video) handlePlayPause(video);
            }}
            className="text-white hover:text-primary transition-colors"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          
          <button
            onClick={(e) => {
              const video = e.currentTarget.closest('div')?.querySelector('video');
              if (video) handleMuteToggle(video);
            }}
            className="text-white hover:text-primary transition-colors"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          
          <button
            onClick={(e) => {
              const video = e.currentTarget.closest('div')?.querySelector('video');
              if (video && video.requestFullscreen) {
                video.requestFullscreen();
              }
            }}
            className="text-white hover:text-primary transition-colors"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
