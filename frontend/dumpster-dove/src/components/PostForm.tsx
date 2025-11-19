import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Image as ImageIcon, X, Upload, Camera, FileVideo } from "lucide-react";
import { apiService } from "@/services/api";
import { trackPostCreated } from "@/lib/analytics";
import { GifPicker } from "./GifPicker";
import imageCompression from 'browser-image-compression';

interface PostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string, author: string, isAnonymous: boolean, hashtags: string[], image?: string) => void;
  editMode?: boolean;
  initialContent?: string;
  initialAuthor?: string;
  initialIsAnonymous?: boolean;
  initialHashtags?: string[];
  initialImage?: string;
  lockHashtag?: boolean;
}

export const PostForm = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  editMode = false,
  initialContent = "",
  initialAuthor = "",
  initialIsAnonymous = true,
  initialHashtags = [],
  initialImage = "",
  lockHashtag = false
}: PostFormProps) => {
  const [content, setContent] = useState(initialContent);
  const [authorType, setAuthorType] = useState<"anonymous" | "fictional">(
    initialIsAnonymous ? "anonymous" : "fictional"
  );
  const [fictionalName, setFictionalName] = useState(initialIsAnonymous ? "" : initialAuthor);
  const [hashtagInput, setHashtagInput] = useState(initialHashtags.join(" "));
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hashtagInputRef = useRef<HTMLInputElement>(null);
  const fictionalNameRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
    }
  }, [content]);

  // Update state when dialog opens or closes
  useEffect(() => {
    if (open) {
      if (editMode) {
        setContent(initialContent);
        setAuthorType(initialIsAnonymous ? "anonymous" : "fictional");
        setFictionalName(initialIsAnonymous ? "" : initialAuthor);
        setHashtagInput(initialHashtags.join(" "));
        setImagePreview(initialImage || null);
      }
    } else {
      if (!editMode) {
        setContent("");
        setFictionalName("");
        setHashtagInput("");
        setImagePreview(null);
        setAuthorType("anonymous");
      }
    }
  }, [open, editMode, initialContent, initialAuthor, initialIsAnonymous, initialHashtags, initialImage]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !uploading) {
      const author = authorType === "anonymous" ? "Anonymous" : fictionalName.trim() || "Anonymous";
      
      const hashtags = lockHashtag 
        ? [hashtagInput.trim()]
        : hashtagInput
            .split(/[\s,]+/)
            .map(tag => tag.trim().replace(/^#/, ""))
            .filter(tag => tag.length > 0);
      
      let imageUrl: string | undefined = undefined;
      
      if (selectedFile) {
        try {
          setUploading(true);
          imageUrl = await apiService.uploadImageToS3(selectedFile);
        } catch (error) {
          console.error("Failed to upload image to S3:", error);
        } finally {
          setUploading(false);
        }
      } else if (imagePreview && imagePreview.startsWith('http')) {
        imageUrl = imagePreview;
      }
      
      onSubmit(content, author, authorType === "anonymous", hashtags, imageUrl || undefined);
      trackPostCreated(!!imageUrl);
      
      setContent("");
      setFictionalName("");
      setHashtagInput("");
      setImagePreview(null);
      setSelectedFile(null);
      setAuthorType("anonymous");
      onOpenChange(false);
    }
  }, [content, authorType, fictionalName, lockHashtag, hashtagInput, selectedFile, imagePreview, uploading, onSubmit, onOpenChange]);

  const remainingChars = useMemo(() => 2000 - content.length, [content]);

  const compressImage = useCallback(async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp'
    };
    
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Image compression failed:', error);
      return file;
    }
  }, []);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      
      setUploading(true);
      compressImage(file).then((compressedFile) => {
        setSelectedFile(compressedFile);
        setUploading(false);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      }).catch((error) => {
        console.error('Error processing image:', error);
        setUploading(false);
      });
    }
    e.target.value = '';
  }, [compressImage]);

  const handleCameraCapture = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          alert('Image size must be less than 10MB');
          return;
        }
        
        setUploading(true);
        compressImage(file).then((compressedFile) => {
          setSelectedFile(compressedFile);
          setUploading(false);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(compressedFile);
        }).catch((error) => {
          console.error('Error processing image:', error);
          setUploading(false);
        });
      }
    };
    
    input.click();
  }, [compressImage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="mobile-post-dialog sm:max-w-[550px] w-full h-[100vh] sm:h-auto max-h-[100vh] sm:max-h-[90vh] overflow-hidden mx-0 sm:mx-auto rounded-none sm:rounded-lg p-0 bg-background flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <DialogTitle className="text-base font-semibold">
            {editMode ? "Edit post" : "Create post"}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              placeholder="What's happening?"
              value={content}
              onChange={(e) => {
                const newValue = e.target.value.slice(0, 2000);
                setContent(newValue);
              }}
              className="min-h-[100px] sm:min-h-[120px] max-h-[300px] resize-none border focus-visible:ring-2 focus-visible:ring-ring p-3 text-base placeholder:text-muted-foreground/60"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  loading="lazy"
                  className="w-full max-h-[250px] sm:max-h-[300px] object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedFile(null);
                  }}
                  aria-label="Remove image"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Post As - Compact */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Post as</Label>
              <RadioGroup 
                value={authorType} 
                onValueChange={(value) => setAuthorType(value as "anonymous" | "fictional")} 
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anonymous" id="anonymous" />
                  <Label htmlFor="anonymous" className="font-normal cursor-pointer text-sm">
                    Anonymous
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fictional" id="fictional" />
                  <Label htmlFor="fictional" className="font-normal cursor-pointer text-sm">
                    Fictional name
                  </Label>
                </div>
              </RadioGroup>
              {authorType === "fictional" && (
                <Input
                  ref={fictionalNameRef}
                  placeholder="Enter name..."
                  value={fictionalName}
                  onChange={(e) => setFictionalName(e.target.value.slice(0, 30))}
                  className="mt-2 h-9 text-sm"
                  onFocus={() => {
                    // Prevent glitches by ensuring smooth scroll
                    setTimeout(() => {
                      fictionalNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                  }}
                />
              )}
            </div>

            {/* Hashtags - Fixed glitch */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hashtags</Label>
              <Input
                ref={hashtagInputRef}
                placeholder="college funny rant"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                disabled={lockHashtag}
                className="h-9 text-sm"
                onFocus={() => {
                  // Prevent glitches by ensuring smooth scroll
                  setTimeout(() => {
                    hashtagInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }, 100);
                }}
              />
              {lockHashtag && (
                <p className="text-xs text-muted-foreground">
                  Posting to: #{hashtagInput}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Fixed Bottom Bar - Always Visible */}
        <div className="border-t border-border bg-background px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Media Options */}
            <div className="flex items-center gap-1">
              <label htmlFor="image-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-secondary transition-colors touch-manipulation"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  aria-label="Upload image"
                  disabled={uploading}
                >
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </Button>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-secondary transition-colors touch-manipulation"
                onClick={handleCameraCapture}
                aria-label="Take photo"
                disabled={uploading}
              >
                <Camera className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-secondary transition-colors touch-manipulation"
                onClick={() => setGifPickerOpen(true)}
                aria-label="Search GIFs"
                disabled={uploading}
              >
                <FileVideo className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Character Count & Post Button - Always Visible */}
            <div className="flex items-center gap-2">
              {remainingChars < 500 && (
                <span className={`text-xs font-medium ${
                  remainingChars < 100 ? "text-destructive" : 
                  remainingChars < 500 ? "text-yellow-600" : 
                  "text-muted-foreground"
                }`}>
                  {remainingChars}
                </span>
              )}
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={!content.trim() || remainingChars < 0 || uploading} 
                className="rounded-full h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Posting...</span>
                  </span>
                ) : (
                  editMode ? "Update" : "Post"
                )}
              </Button>
            </div>
          </div>
        </div>

        <GifPicker
          open={gifPickerOpen}
          onOpenChange={setGifPickerOpen}
          onSelect={(gifUrl) => {
            setImagePreview(gifUrl);
            setSelectedFile(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
