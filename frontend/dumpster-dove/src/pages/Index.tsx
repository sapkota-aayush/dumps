import { useState, useEffect } from "react";
import { PostCard, Post } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

const STORAGE_KEY = "dumps_posts";
const REACTIONS_KEY = "dumps_user_reactions";

const loadPosts = (): Post[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((post: any) => ({
        ...post,
        timestamp: new Date(post.timestamp),
        hashtags: post.hashtags || [],
      }));
    }
  } catch (error) {
    console.error("Failed to load posts:", error);
  }
  return [];
};

const savePosts = (posts: Post[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error("Failed to save posts:", error);
  }
};

const loadUserReactions = (): Record<string, keyof Post["reactions"]> => {
  try {
    const stored = localStorage.getItem(REACTIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load reactions:", error);
  }
  return {};
};

const saveUserReactions = (reactions: Record<string, keyof Post["reactions"]>) => {
  try {
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions));
  } catch (error) {
    console.error("Failed to save reactions:", error);
  }
};

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, keyof Post["reactions"]>>({});
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    setPosts(loadPosts());
    setUserReactions(loadUserReactions());
  }, []);

  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  useEffect(() => {
    saveUserReactions(userReactions);
  }, [userReactions]);

  const handleCreatePost = (content: string, author: string, isAnonymous: boolean, hashtags: string[], image?: string) => {
    if (editingPost) {
      // Update existing post
      setPosts(posts.map(post => 
        post.id === editingPost.id
          ? { ...post, content, author, isAnonymous, hashtags, image }
          : post
      ));
      setEditingPost(null);
    } else {
      // Create new post with unique anonymous ID
      const uniqueAuthor = isAnonymous 
        ? `Anon${Math.floor(1000 + Math.random() * 9000)}` 
        : author;
      
      const newPost: Post = {
        id: Date.now().toString(),
        content,
        author: uniqueAuthor,
        isAnonymous,
        timestamp: new Date(),
        hashtags,
        image,
        reactions: {
          thumbsUp: 0,
          heart: 0,
          laugh: 0,
          angry: 0,
        },
      };
      setPosts([newPost, ...posts]);
    }
  };

  const handleEditPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
      setIsFormOpen(true);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
    // Also remove user reaction for this post
    const newReactions = { ...userReactions };
    delete newReactions[postId];
    setUserReactions(newReactions);
  };

  const handleReact = (postId: string, reaction: keyof Post["reactions"]) => {
    const currentReaction = userReactions[postId];

    // Update user reactions
    const newUserReactions = { ...userReactions };
    if (currentReaction === reaction) {
      // User clicked same reaction - remove it
      delete newUserReactions[postId];
    } else {
      // User clicked different reaction - replace it
      newUserReactions[postId] = reaction;
    }
    setUserReactions(newUserReactions);

    // Update post reactions
    setPosts(
      posts.map((post) => {
        if (post.id !== postId) return post;

        const newReactions = { ...post.reactions };

        // Remove previous reaction if exists
        if (currentReaction) {
          newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
        }

        // Add new reaction if not removing
        if (currentReaction !== reaction) {
          newReactions[reaction] = newReactions[reaction] + 1;
        }

        return { ...post, reactions: newReactions };
      })
    );
  };

  // Get all unique hashtags from posts
  const allHashtags = Array.from(
    new Set(posts.flatMap((post) => post.hashtags))
  ).sort();

  // Filter posts by selected hashtag
  const filteredPosts = selectedHashtag
    ? posts.filter((post) => post.hashtags.includes(selectedHashtag))
    : posts;

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
          {filteredPosts.length === 0 ? (
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
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={handleReact}
                userReaction={userReactions[post.id]}
                onHashtagClick={setSelectedHashtag}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
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
        initialAuthor={editingPost?.author}
        initialIsAnonymous={editingPost?.isAnonymous}
        initialHashtags={editingPost?.hashtags}
        initialImage={editingPost?.image}
      />
    </div>
  );
};

export default Index;
