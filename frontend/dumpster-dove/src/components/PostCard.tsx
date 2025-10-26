import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ReactionButton } from "./ReactionButton";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  // For local development
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:8000${imageUrl}`;
  }
  // For production
  return `https://dumps.online${imageUrl}`;
};

export interface Post {
  id: number;
  content: string;
  fictional_name: string;
  hashtag: string;
  created_at: string;
  image_url?: string;
  user_token: string;
  reactions: {
    thumbs_up: number;
    heart: number;
    laugh: number;
    angry: number;
  };
}

interface PostCardProps {
  post: Post;
  onReact: (postId: number, reaction: keyof Post["reactions"]) => void;
  onHashtagClick: (hashtag: string) => void;
  onEdit: (postId: number) => void;
  onDelete: (postId: number) => void;
  currentUserToken: string;
}

export const PostCard = ({ post, onReact, onHashtagClick, onEdit, onDelete, currentUserToken }: PostCardProps) => {
  const isOwnPost = post.user_token === currentUserToken;
  
  // Try to parse the date properly
  const formatDate = (dateString: string) => {
    try {
      // Handle different date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If direct parsing fails, try ISO format
        return formatDistanceToNow(new Date(dateString + 'Z'), { addSuffix: true });
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Date parsing error:', error, 'Date string:', dateString);
      return 'Unknown time';
    }
  };
  return (
    <Card className="p-5 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:border-primary/40 bg-card">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {post.fictional_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {post.created_at ? formatDate(post.created_at) : 'Unknown time'}
            </span>
          </div>
          {isOwnPost && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(post.id)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(post.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
        
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {post.image_url && (
          <div className="mt-3 rounded-lg overflow-hidden border border-border">
            <img 
              src={getImageUrl(post.image_url)} 
              alt="Post image" 
              className="w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(getImageUrl(post.image_url), '_blank')}
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onHashtagClick(post.hashtag)}
            className="text-xs px-3 py-1.5 rounded-md bg-secondary border border-border hover:border-primary/50 text-foreground hover:text-primary transition-all duration-200 font-medium"
          >
            #{post.hashtag}
          </button>
        </div>
        
        <div className="flex items-center gap-4 pt-3">
          <ReactionButton
            emoji="👍"
            count={post.reactions.thumbs_up}
            onClick={() => {
              console.log("Thumbs up clicked for post:", post.id);
              onReact(post.id, "thumbs_up");
            }}
          />
          <ReactionButton
            emoji="❤️"
            count={post.reactions.heart}
            onClick={() => {
              console.log("Heart clicked for post:", post.id);
              onReact(post.id, "heart");
            }}
          />
          <ReactionButton
            emoji="😂"
            count={post.reactions.laugh}
            onClick={() => {
              console.log("Laugh clicked for post:", post.id);
              onReact(post.id, "laugh");
            }}
          />
          <ReactionButton
            emoji="😡"
            count={post.reactions.angry}
            onClick={() => {
              console.log("Angry clicked for post:", post.id);
              onReact(post.id, "angry");
            }}
          />
        </div>
      </div>
    </Card>
  );
};
