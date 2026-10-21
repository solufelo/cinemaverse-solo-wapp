import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Twitter, Facebook, Link as LinkIcon, X } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface ShareButtonProps {
  title: string;
  url: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function ShareButton({ 
  title, 
  url, 
  description = '', 
  className = '',
  variant = 'default',
  size = 'default'
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: title,
    text: description,
    url: url
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      setIsOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
    setIsOpen(false);
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
    setIsOpen(false);
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={handleNativeShare}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 top-full mt-2 w-64 bg-background rounded-lg border border-border shadow-lg z-50"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Share</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center w-full p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span className="text-sm">
                      {copied ? 'Copied!' : 'Copy Link'}
                    </span>
                  </button>

                  <button
                    onClick={handleTwitterShare}
                    className="flex items-center w-full p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Twitter className="h-4 w-4 mr-3 text-blue-400" />
                    <span className="text-sm">Share on Twitter</span>
                  </button>

                  <button
                    onClick={handleFacebookShare}
                    className="flex items-center w-full p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Facebook className="h-4 w-4 mr-3 text-blue-600" />
                    <span className="text-sm">Share on Facebook</span>
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center w-full p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-4 h-4 mr-3 bg-green-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">W</span>
                    </div>
                    <span className="text-sm">Share on WhatsApp</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                    <LinkIcon className="h-3 w-3" />
                    <span className="truncate">{url}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 