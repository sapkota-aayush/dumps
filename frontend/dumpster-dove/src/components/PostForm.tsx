import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Image as ImageIcon, X, Upload, Camera } from "lucide-react";
import { apiService } from "@/services/api";

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
  initialImage = ""
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
      // Focus textarea after dialog animation
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
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
      const hashtags = hashtagInput
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

  const handleCameraCapture = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera is not supported on this device. Please use the file upload option instead.');
        return;
      }

      // Check if we're on HTTPS or localhost
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        alert('Camera access requires HTTPS. Please use the file upload option instead.');
        return;
      }

      // Check if device has camera capabilities
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
      
      if (!hasVideoDevice) {
        alert('No camera found on this device. Please use the file upload option instead.');
        return;
      }

      // Simple camera capture using input with capture attribute
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
      
      // Trigger the camera
      input.click();
      
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Camera access failed. Please use the file upload option instead.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
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
          />

          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full max-h-64 object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setImagePreview(null)}
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
                title="Take Photo"
              >
                <Camera className="h-5 w-5 text-primary" />
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

          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
              <span>Advanced options</span>
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="mt-3 space-y-3 pl-1">
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
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </details>
        </form>
      </DialogContent>
    </Dialog>
  );
};
