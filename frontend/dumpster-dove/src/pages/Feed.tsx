import { useState, useEffect, useCallback } from "react";
import { PostCard, Post } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";
import { Button } from "@/components/ui/button";
import { Plus, X, Search, Home } from "lucide-react";
import { apiService, Post as ApiPost } from "@/services/api";
import { useToken } from "@/hooks/useToken";
import { trackPageView } from "@/lib/analytics";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

const Feed = () => {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editingPost, setEditingPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const { token, loading: tokenLoading } = useToken();

  // Load posts from API
  const loadPosts = async (isInitialLoad = false, page = 1, isPolling = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      } else if (!isPolling) {
        setLoadingMore(true);
      }
      setError(null);
      const response = await apiService.getPosts(selectedHashtag || undefined, page);
      
      if (isInitialLoad) {
        setPosts(response.posts);
      } else if (isPolling) {
        // For polling, only update if there are new posts
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p.id));
          const newPosts = response.posts.filter(post => !existingIds.has(post.id));
          
          // Only update if there are actually new posts
          if (newPosts.length > 0) {
            return [...newPosts, ...prevPosts];
          }
          
          // Check for updated posts (reactions, etc.)
          const hasUpdates = response.posts.some(newPost => {
            const existingPost = prevPosts.find(p => p.id === newPost.id);
            return existingPost && (
              existingPost.reactions !== newPost.reactions ||
              existingPost.content !== newPost.content
            );
          });
          
          if (hasUpdates) {
            return response.posts;
          }
          
          return prevPosts; // No changes
        });
      } else {
        // For pagination, append new posts
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p.id));
          const newPosts = response.posts.filter(post => !existingIds.has(post.id));
          return [...prevPosts, ...newPosts];
        });
      }
      
      // Check if there are more posts to load
      setHasMore(response.posts.length === 20); // 20 is our page size
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError(`Failed to load posts: ${err.message}`);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else if (!isPolling) {
        setLoadingMore(false);
      }
    }
  };

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadPosts(false, currentPage + 1);
    }
  }, [loadingMore, hasMore, currentPage, loading]);

  // Infinite scroll detection with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Throttle scroll events
      timeoutId = setTimeout(() => {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        
        // Load more when user is 200px from bottom
        if (scrollTop + clientHeight >= scrollHeight - 200) {
          loadMorePosts();
        }
      }, 100); // 100ms throttle
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loadMorePosts]);

  useEffect(() => {
    if (!tokenLoading && token) {
      // Track page view in Google Analytics
      trackPageView('Dumps.online - Home');
      
      // Reset pagination when hashtag changes
      setCurrentPage(1);
      setHasMore(true);
      setPosts([]);
      loadPosts(true); // Initial load with loading spinner
    }
  }, [token, tokenLoading, selectedHashtag]);

  // Real-time updates - poll every 5 seconds (silent updates)
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      // Only poll for new posts, not pagination
      loadPosts(false, 1, true); // Always check page 1 for new posts, isPolling=true
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [token, selectedHashtag]);

  const handleCreatePost = async (content: string, author: string, isAnonymous: boolean, hashtags: string[], image?: string) => {
    if (!token) {
      setError("No token available. Please refresh the page.");
      return;
    }

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
        // Create new post
        const newPost = {
          content,
          hashtag: hashtags[0] || "general", // Use first hashtag or default
          user_token: token,
          fictional_name: isAnonymous ? "Anonymous" : author,
          image_url: image,
        };
        
        const createdPost = await apiService.createPost(newPost);
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
    
    try {
      const updatedPost = await apiService.reactToPost(postId, reaction, token);
      
      setPosts(prevPosts => {
        const newPosts = prevPosts.map(post => 
          post.id === postId ? updatedPost : post
        );
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

  // Handle hashtag search from bottom nav
  const handleHashtagSearch = (term: string) => {
    // Remove leading # if present
    const cleanSearch = term.startsWith('#') ? term.slice(1) : term;
    setSearchTerm(cleanSearch);
    
    // Check if we have any posts with matching hashtags
    const matchingHashtags = allHashtags.filter(tag => 
      tag.toLowerCase().includes(cleanSearch.toLowerCase())
    );
    
    if (matchingHashtags.length > 0) {
      // Set to the first matching hashtag
      setSelectedHashtag(matchingHashtags[0]);
    } else {
      // No matching hashtag found, search in content instead
      setSelectedHashtag(null);
    }
  };

  // Filter posts based on search term (content and hashtag)
  const filteredPosts = searchTerm ? posts.filter(post => 
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.hashtag.toLowerCase().includes(searchTerm.toLowerCase())
  ) : posts;

  // Use filtered posts
  const convertedPosts = filteredPosts;

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
            Dump your thoughts anonymously.
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

      {searchTerm && (
        <div className="max-w-2xl mx-auto px-6 py-3">
          <div className="bg-accent/50 border border-accent-foreground/20 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Search results for: "{searchTerm}"</span>
              <span className="text-xs text-muted-foreground">({filteredPosts.length} results)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedHashtag(null);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {selectedHashtag && !allHashtags.includes(selectedHashtag) && (
        <div className="max-w-2xl mx-auto px-6 py-3">
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">Showing results for: #{selectedHashtag}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedHashtag(null)}
              className="text-primary"
            >
              Clear filter
            </Button>
          </div>
        </div>
      )}

      {allHashtags.length > 0 && (
        <div className="max-w-2xl mx-auto px-6 py-4 border-b border-border">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedHashtag === null && !searchTerm ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedHashtag(null);
                setSearchTerm("");
              }}
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

      <main className="max-w-2xl mx-auto px-6 py-6 pb-28">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : convertedPosts.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">
                {searchTerm
                  ? `No posts found matching "${searchTerm}".`
                  : selectedHashtag
                  ? `No posts with #${selectedHashtag} yet.`
                  : "No posts yet. Be the first to share!"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                {(selectedHashtag || searchTerm) && (
                  <Button
                    onClick={() => {
                      setSelectedHashtag(null);
                      setSearchTerm("");
                    }}
                  >
                    ← Back to All Posts
                  </Button>
                )}
                <Button variant={(selectedHashtag || searchTerm) ? "outline" : "default"} onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
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
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center py-6">
              <Button
                onClick={loadMorePosts}
                disabled={loadingMore}
                variant="outline"
                className="px-8"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    Loading more posts...
                  </>
                ) : (
                  "Load More Posts"
                )}
              </Button>
            </div>
          )}
          
          {/* End of posts message */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>You've reached the end! No more posts to load.</p>
            </div>
          )}
        </div>
      </main>

      {/* Back to All button - only shown when search/filter is active */}
      {(searchTerm || selectedHashtag) && (
        <Button
          onClick={() => {
            setSearchTerm("");
            setSelectedHashtag(null);
          }}
          className="fixed bottom-36 right-6 h-14 w-14 rounded-lg shadow-lg hover:shadow-xl bg-secondary hover:bg-secondary/90 hover:scale-110 transition-all duration-200 z-40"
          size="icon"
          title="Back to all posts"
        >
          <Home className="w-6 h-6" />
        </Button>
      )}

      <Button
        onClick={() => setIsFormOpen(true)}
        className={cn(
          "fixed right-6 h-16 w-16 rounded-lg shadow-glow-lg hover:shadow-glow bg-primary hover:bg-primary/90 hover:scale-110 transition-all duration-200 z-40",
          (searchTerm || selectedHashtag) ? "bottom-24" : "bottom-20"
        )}
        size="icon"
      >
        <Plus className="w-7 h-7" />
      </Button>

      <BottomNav onHashtagSearch={handleHashtagSearch} allHashtags={allHashtags} />

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

export default Feed;