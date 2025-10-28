import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PostCard, Post } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";
import { Button } from "@/components/ui/button";
import { Plus, Home } from "lucide-react";
import { apiService, Post as ApiPost } from "@/services/api";
import { useToken } from "@/hooks/useToken";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

const HashtagPage = () => {
  const { hashtag } = useParams<{ hashtag: string }>();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<ApiPost | null>(null);
  const { token } = useToken();
  const navigate = useNavigate();

  // Get all unique hashtags from posts for navigation
  const allHashtags = Array.from(
    new Set(posts.map((post) => post.hashtag))
  ).sort();


  // Load posts for this hashtag
  useEffect(() => {
    const loadPosts = async () => {
      if (!hashtag) return;
      
      // Try to load cached posts first for instant display
      const cacheKey = `cached_posts_${hashtag}`;
      const cachedPosts = localStorage.getItem(cacheKey);
      
      if (cachedPosts) {
        try {
          const parsedPosts = JSON.parse(cachedPosts);
          setPosts(parsedPosts);
          setLoading(false);
          
          // Load fresh data in background
          const response = await apiService.getHashtagPosts(hashtag);
          setPosts(response.posts);
          // Update cache with fresh data
          localStorage.setItem(cacheKey, JSON.stringify(response.posts));
        } catch (err) {
          console.error("Failed to parse cached posts:", err);
          // Fallback to normal loading
          setLoading(true);
          const response = await apiService.getHashtagPosts(hashtag);
          setPosts(response.posts);
          localStorage.setItem(cacheKey, JSON.stringify(response.posts));
          setLoading(false);
        }
      } else {
        // No cache, load normally
        setLoading(true);
        try {
          const response = await apiService.getHashtagPosts(hashtag);
          setPosts(response.posts);
          // Cache the posts
          localStorage.setItem(cacheKey, JSON.stringify(response.posts));
        } catch (err) {
          console.error("Failed to load posts:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPosts();
  }, [hashtag]);

  // Smart real-time updates for hashtag page
  useEffect(() => {
    if (!hashtag || posts.length === 0) return;
    
    const interval = setInterval(async () => {
      try {
        // Get the timestamp of the most recent post we have
        const latestPost = posts[0];
        if (!latestPost) return;
        
        // Convert to ISO string for API
        const since = new Date(latestPost.created_at).toISOString();
        
        // Only fetch posts newer than what we have for this hashtag
        const response = await apiService.getNewPosts(since, hashtag);
        
        if (response.posts.length > 0) {
          // Add new posts to the beginning, avoiding duplicates
          setPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(p => p.id));
            const newPosts = response.posts.filter(post => !existingIds.has(post.id));
            
            if (newPosts.length > 0) {
              const updatedPosts = [...newPosts, ...prevPosts];
              // Update cache with new posts
              const cacheKey = `cached_posts_${hashtag}`;
              localStorage.setItem(cacheKey, JSON.stringify(updatedPosts));
              return updatedPosts;
            }
            
            return prevPosts; // No new posts to add
          });
        }
      } catch (err) {
        console.error("Failed to fetch new posts:", err);
        // Silently fail - don't show error for background updates
      }
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [hashtag, posts]);

  const handleCreatePost = async (content: string, author: string, isAnonymous: boolean, hashtags: string[], image?: string) => {
    if (!token) return;

    try {
      if (editingPost) {
        // Update existing post
        const updates = {
          content,
          fictional_name: isAnonymous ? "Anonymous" : author,
        };
        
        const updatedPost = await apiService.updatePost(editingPost.id, token, updates);
        setPosts(posts.map(post => post.id === editingPost.id ? updatedPost : post));
        setEditingPost(null);
      } else {
        // Create new post - use the page's hashtag automatically
        const newPost = {
          content,
          hashtag: hashtag || "general", // Use the page's hashtag, not the form input
          user_token: token,
          fictional_name: isAnonymous ? "Anonymous" : author,
          image_url: image,
        };
        
        const createdPost = await apiService.createPost(newPost);
        setPosts([createdPost, ...posts]);
        
        // Update cache with new post (avoid duplicates)
        const cacheKey = `cached_posts_${hashtag}`;
        const existingIds = new Set(posts.map(p => p.id));
        if (!existingIds.has(createdPost.id)) {
          const updatedPosts = [createdPost, ...posts];
          localStorage.setItem(cacheKey, JSON.stringify(updatedPosts));
        }
      }
      
      setIsFormOpen(false);
      setEditingPost(null);
    } catch (err) {
      console.error("Failed to create/update post:", err);
    }
  };

  const handleReact = async (postId: number, reaction: string) => {
    if (!token) return;
    
    try {
      await apiService.reactToPost(postId, reaction, token);
      
      // Update the post in the list
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                reactions: { 
                  ...post.reactions, 
                  [reaction]: (post.reactions[reaction as keyof typeof post.reactions] || 0) + 1 
                } 
              } 
            : post
        )
      );
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to another hashtag page
    navigate(`/hashtag/${hashtag}`);
  };

  const handleEdit = async (postId: number, updatedContent: string) => {
    if (!token) return;
    
    try {
      const updatedPost = await apiService.updatePost(postId, token, { content: updatedContent });
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    } catch (err) {
      console.error("Failed to update post:", err);
    }
  };

  const handleEditClick = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
      setIsFormOpen(true);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!token) return;
    
    try {
      await apiService.deletePost(postId, token);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header - Same as Feed */}
      <header className="bg-card border-b-2 border-primary/30 shadow-xl">
        <div className="max-w-2xl mx-auto px-6 py-6 text-center">
          <h1 className="text-3xl font-black text-primary tracking-tight uppercase">
            Dumps.online
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Dump your thoughts anonymously.
          </p>
        </div>
      </header>

      {/* Hashtag Filter Buttons - Same as Feed */}
      {allHashtags.length > 0 && (
        <div className="max-w-2xl mx-auto px-6 py-4 border-b border-border">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/feed')}
            >
              All
            </Button>
            {allHashtags.map((tag) => (
              <Button
                key={tag}
                variant={hashtag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => navigate(`/hashtag/${tag}`)}
                className="relative"
              >
                #{tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Post Form */}
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
        initialHashtags={hashtag ? [hashtag] : []} // Pre-fill with page hashtag
        initialImage={editingPost?.image_url}
        lockHashtag={true} // Lock hashtag when posting from hashtag page
      />

      {/* Posts Feed */}
      <main className="max-w-2xl mx-auto px-6 py-6 pb-28">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No posts in #{hashtag} yet</p>
            <p className="text-muted-foreground text-sm mt-2">Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={(postId, reaction) => handleReact(postId, reaction)}
                onHashtagClick={handleHashtagClick}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                currentUserToken={token || ""}
              />
            ))}
          </div>
        )}
      </main>

      {/* Back to All button */}
      <Button
        onClick={() => navigate('/feed')}
        className="fixed bottom-36 right-6 h-14 w-14 rounded-lg shadow-lg hover:shadow-xl bg-secondary hover:bg-secondary/90 hover:scale-110 transition-all duration-200 z-40"
        size="icon"
        title="Back to all posts"
      >
        <Home className="w-6 h-6" />
      </Button>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsFormOpen(true)}
        className={cn(
          "fixed right-6 h-16 w-16 rounded-full shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 hover:scale-110 transition-all duration-200 z-50",
          "bottom-24"
        )}
        size="icon"
      >
        <Plus className="w-7 h-7" />
      </Button>

      {/* Bottom Navigation */}
      <BottomNav onHashtagSearch={() => {}} allHashtags={[]} />
    </div>
  );
};

export default HashtagPage;
