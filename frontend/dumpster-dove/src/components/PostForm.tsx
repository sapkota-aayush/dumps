import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Image as ImageIcon, X, Upload, Camera, FileVideo, Search } from "lucide-react";
import { apiService } from "@/services/api";
import { trackPostCreated } from "@/lib/analytics";
import { GifPicker } from "./GifPicker";

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
  lockHashtag?: boolean; // New prop to lock the hashtag field
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

  // Update state when dialog opens or closes
  useEffect(() => {
    if (open) {
      // Only update if editing, otherwise keep defaults
      if (editMode) {
        setContent(initialContent);
        setAuthorType(initialIsAnonymous ? "anonymous" : "fictional");
        setFictionalName(initialIsAnonymous ? "" : initialAuthor);
        setHashtagInput(initialHashtags.join(" "));
        setImagePreview(initialImage || null);
      }
      // Don't auto-focus on mobile to avoid cursor jumping
      // Users can tap to focus when needed
    } else {
      // Reset form when closing
      if (!editMode) {
        setContent("");
        setFictionalName("");
        setHashtagInput("");
        setImagePreview(null);
        setAuthorType("anonymous");
      }
    }
  }, [open, editMode, initialContent, initialAuthor, initialIsAnonymous, initialHashtags, initialImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      const author = authorType === "anonymous" ? "Anonymous" : fictionalName.trim() || "Anonymous";
      
      // Parse hashtags from input
      // If hashtag is locked (posting from hashtag page), use the locked hashtag
      const hashtags = lockHashtag 
        ? [hashtagInput.trim()] // Use the locked hashtag
        : hashtagInput
            .split(/[\s,]+/)
            .map(tag => tag.trim().replace(/^#/, ""))
            .filter(tag => tag.length > 0);
      
      let imageUrl: string | undefined = undefined;
      
      // Upload image to S3 if a new file is selected
      if (selectedFile) {
        try {
          setUploading(true);
          imageUrl = await apiService.uploadImageToS3(selectedFile);
        } catch (error) {
          console.error("Failed to upload image to S3:", error);
          // Continue without image if upload fails
        } finally {
          setUploading(false);
        }
      } else if (imagePreview && imagePreview.startsWith('http')) {
        // Only use imagePreview if it's already an S3 URL (not base64)
        imageUrl = imagePreview;
      }
      
      onSubmit(content, author, authorType === "anonymous", hashtags, imageUrl || undefined);
      
      // Track post creation in Google Analytics
      trackPostCreated(!!imageUrl);
      
      setContent("");
      setFictionalName("");
      setHashtagInput("");
      setImagePreview(null);
      setSelectedFile(null);
      setAuthorType("anonymous");
      onOpenChange(false);
    }
  };

  const remainingChars = 280 - content.length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // Create a hidden file input with camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          return;
        }
        
        setSelectedFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    
    // Trigger the camera/file picker
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-0 sm:mx-auto rounded-none sm:rounded-lg h-[100vh] sm:h-auto w-full sm:w-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{editMode ? "Edit" : "New post"}</DialogTitle>
          <DialogDescription className="sr-only">
            {editMode ? "Edit your post content" : "Create a new post"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 280))}
            className="min-h-[120px] resize-none border focus-visible:ring-2 focus-visible:ring-ring p-3 text-base"
            onKeyDown={(e) => {
              // Auto-submit on mobile when user presses "Done" or "Enter"
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            autoFocus={false}
          />

          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border">
              <img 
                src={imagePreview} 
                alt="Preview" 
                loading="lazy"
                className="w-full max-h-64 object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setImagePreview(null)}
                aria-label="Remove image"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="image-upload">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  aria-label="Upload image"
                  title="Upload Image"
                >
                  <ImageIcon className="h-5 w-5 text-primary" />
                </Button>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleCameraCapture}
                aria-label="Take photo or select from gallery"
                title="Take Photo or Select from Gallery"
              >
                <Camera className="h-5 w-5 text-primary" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setGifPickerOpen(true)}
                aria-label="Search GIFs"
                title="Search GIFs"
              >
                <FileVideo className="h-5 w-5 text-primary" />
              </Button>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-sm ${remainingChars < 20 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {remainingChars}
              </span>
              <Button 
                type="submit" 
                disabled={!content.trim() || remainingChars < 0 || uploading} 
                size="sm" 
                className="rounded-full min-w-[90px] h-10 text-sm font-medium"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  editMode ? "Update" : "Post"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <div>
              <Label className="text-sm mb-2 block">Post as</Label>
              <RadioGroup value={authorType} onValueChange={(value) => setAuthorType(value as "anonymous" | "fictional")} className="gap-2">
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
                  placeholder="Enter name..."
                  value={fictionalName}
                  onChange={(e) => setFictionalName(e.target.value.slice(0, 30))}
                  className="mt-2 h-9 text-sm"
                />
              )}
            </div>

            <div>
              <Label className="text-sm mb-2 block">Hashtags</Label>
              <Input
                placeholder="college funny rant"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                disabled={lockHashtag}
                className="h-9 text-sm"
              />
              {lockHashtag && (
                <p className="text-xs text-muted-foreground mt-1">
                  Posting to: #{hashtagInput}
                </p>
              )}
            </div>
          </div>
        </form>

        <GifPicker
          open={gifPickerOpen}
          onOpenChange={setGifPickerOpen}
          onSelect={(gifUrl) => {
            setImagePreview(gifUrl);
            setSelectedFile(null); // Clear any selected file
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
