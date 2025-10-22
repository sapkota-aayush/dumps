import { useState, useEffect } from "react";
import { PostCard, Post } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { apiService, Post as ApiPost } from "@/services/api";
import { useToken } from "@/hooks/useToken";

const Index = () => {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { token, loading: tokenLoading } = useToken();

  // Load posts from API
  const loadPosts = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      console.log("Loading posts...", { selectedHashtag, token });
      const response = await apiService.getPosts(selectedHashtag || undefined);
      console.log("Posts loaded successfully:", response);
      
      // Smart update - only update if posts actually changed
      setPosts(prevPosts => {
        const newPosts = response.posts;
        
        // Check if posts are actually different
        if (prevPosts.length !== newPosts.length) {
          return newPosts;
        }
        
        // Check if any post content changed
        const hasChanges = prevPosts.some((prevPost, index) => {
          const newPost = newPosts[index];
          if (!newPost) return true;
          
          return (
            prevPost.id !== newPost.id ||
            prevPost.content !== newPost.content ||
            JSON.stringify(prevPost.reactions) !== JSON.stringify(newPost.reactions) ||
            prevPost.created_at !== newPost.created_at
          );
        });
        
        return hasChanges ? newPosts : prevPosts;
      });
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError(`Failed to load posts: ${err.message}`);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!tokenLoading && token) {
      loadPosts(true); // Initial load with loading spinner
    }
  }, [token, tokenLoading, selectedHashtag]);

  // Real-time updates - poll every 5 seconds (silent updates)
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      loadPosts(false); // Silent update - no loading spinner
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [token, selectedHashtag]);

  const handleCreatePost = async (content: string, author: string, isAnonymous: boolean, hashtags: string[], image?: string) => {
    if (!token) {
      setError("No token available. Please refresh the page.");
      return;
    }

    try {
      console.log("Creating/updating post...", { content, author, isAnonymous, hashtags, image, token });
      
      if (editingPost) {
        // Update existing post
        const updates = {
          content,
          fictional_name: isAnonymous ? "Anonymous" : author,
        };
        
        console.log("Updating post:", editingPost.id, updates);
        const updatedPost = await apiService.updatePost(editingPost.id, token, updates);
        console.log("Post updated successfully:", updatedPost);
        setPosts(posts.map(post => post.id === editingPost.id ? updatedPost : post));
        setEditingPost(null);
      } else {
        // Create new post
        const newPost = {
          content,
          hashtag: hashtags[0] || "general", // Use first hashtag or default
          user_token: token,
          fictional_name: isAnonymous ? "Anonymous" : author,
          image_url: image,
        };
        
        console.log("Creating new post:", newPost);
        const createdPost = await apiService.createPost(newPost);
        console.log("Post created successfully:", createdPost);
        setPosts([createdPost, ...posts]);
      }
      
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save post:", err);
      setError(`Failed to save post: ${err.message}`);
    }
  };

  const handleEditPost = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
      setIsFormOpen(true);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!token) {
      setError("No token available. Please refresh the page.");
      return;
    }

    try {
      await apiService.deletePost(postId, token);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
      setError("Failed to delete post. Please try again.");
    }
  };

  const handleReact = async (postId: number, reaction: keyof ApiPost["reactions"]) => {
    if (!token) {
      console.error("No token available for reaction");
      return;
    }
    
    console.log("Reacting to post:", { postId, reaction, token });
    
    try {
      const updatedPost = await apiService.reactToPost(postId, reaction, token);
      console.log("Reaction successful:", updatedPost);
      console.log("Current posts before update:", posts);
      
      setPosts(prevPosts => {
        const newPosts = prevPosts.map(post => 
          post.id === postId ? updatedPost : post
        );
        console.log("Updated posts:", newPosts);
        return newPosts;
      });
    } catch (err) {
      console.error("Failed to react to post:", err);
      setError("Failed to react to post. Please try again.");
    }
  };

  // Get all unique hashtags from posts
  const allHashtags = Array.from(
    new Set(posts.map((post) => post.hashtag))
  ).sort();

  // Use posts directly - no conversion needed since PostCard expects API format
  const convertedPosts = posts;

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-primary/30 shadow-xl">
        <div className="max-w-2xl mx-auto px-6 py-6 text-center">
          <h1 className="text-3xl font-black text-primary tracking-tight uppercase">
            Dumps.online
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            The more you f*ck around, the more you will find out. Dump your thoughts.
          </p>
        </div>
      </header>

      {error && (
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {allHashtags.length > 0 && (
        <div className="max-w-2xl mx-auto px-6 py-4 border-b border-border">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedHashtag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedHashtag(null)}
            >
              All
            </Button>
            {allHashtags.map((tag) => (
              <Button
                key={tag}
                variant={selectedHashtag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedHashtag(tag)}
                className="relative"
              >
                #{tag}
                {selectedHashtag === tag && (
                  <X
                    className="w-3 h-3 ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHashtag(null);
                    }}
                  />
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-6 py-6">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : convertedPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {selectedHashtag
                  ? `No posts with #${selectedHashtag} yet.`
                  : "No posts yet. Be the first to share!"}
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            convertedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={(postId, reaction) => handleReact(postId, reaction)}
                onHashtagClick={(hashtag) => setSelectedHashtag(hashtag)}
                onEdit={(postId) => handleEditPost(postId)}
                onDelete={(postId) => handleDeletePost(postId)}
                currentUserToken={token || ""}
              />
            ))
          )}
        </div>
      </main>

      <Button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-lg shadow-glow-lg hover:shadow-glow bg-primary hover:bg-primary/90 hover:scale-110 transition-all duration-200"
        size="icon"
      >
        <Plus className="w-7 h-7" />
      </Button>

      <PostForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPost(null);
        }}
        onSubmit={handleCreatePost}
        editMode={!!editingPost}
        initialContent={editingPost?.content}
        initialAuthor={editingPost?.fictional_name}
        initialIsAnonymous={editingPost?.fictional_name === "Anonymous"}
        initialHashtags={editingPost ? [editingPost.hashtag] : []}
        initialImage={editingPost?.image_url}
      />
    </div>
  );
};

export default Index;