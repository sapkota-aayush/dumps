import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ReactionButton } from "./ReactionButton";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export interface Post {
  id: string;
  content: string;
  author: string;
  isAnonymous: boolean;
  timestamp: Date;
  hashtags: string[];
  image?: string;
  reactions: {
    thumbsUp: number;
    heart: number;
    laugh: number;
    angry: number;
  };
}

interface PostCardProps {
  post: Post;
  onReact: (postId: string, reaction: keyof Post["reactions"]) => void;
  userReaction?: keyof Post["reactions"] | null;
  onHashtagClick: (hashtag: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
}

export const PostCard = ({ post, onReact, userReaction, onHashtagClick, onEdit, onDelete }: PostCardProps) => {
  return (
    <Card className="p-5 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:border-primary/40 bg-card">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {post.isAnonymous ? post.author : post.author}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(post.timestamp, { addSuffix: true })}
            </span>
          </div>
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
        </div>
        
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {post.image && (
          <img 
            src={post.image} 
            alt="Post image" 
            className="rounded-lg w-full max-h-48 object-cover"
          />
        )}
        
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <button
                key={tag}
                onClick={() => onHashtagClick(tag)}
                className="text-xs px-3 py-1.5 rounded-md bg-secondary border border-border hover:border-primary/50 text-foreground hover:text-primary transition-all duration-200 font-medium"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-4 pt-3">
          <ReactionButton
            emoji="👍"
            count={post.reactions.thumbsUp}
            onClick={() => onReact(post.id, "thumbsUp")}
            isActive={userReaction === "thumbsUp"}
          />
          <ReactionButton
            emoji="❤️"
            count={post.reactions.heart}
            onClick={() => onReact(post.id, "heart")}
            isActive={userReaction === "heart"}
          />
          <ReactionButton
            emoji="😂"
            count={post.reactions.laugh}
            onClick={() => onReact(post.id, "laugh")}
            isActive={userReaction === "laugh"}
          />
          <ReactionButton
            emoji="😡"
            count={post.reactions.angry}
            onClick={() => onReact(post.id, "angry")}
            isActive={userReaction === "angry"}
          />
        </div>
      </div>
    </Card>
  );
};
