import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/Backend/api/todoApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, ThumbsUp, MoreVertical, Flag, Image as ImageIcon, PlusCircle, Search, Clock, Users, Trash2, Globe } from 'lucide-react';

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface Post {
  _id: string;
  userId: string;
  userName: string;
  category: string;
  text: string;
  image?: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Poultry');
  const [newPostImage, setNewPostImage] = useState('');
  const [newPostImagePreview, setNewPostImagePreview] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const { t, translateText, language } = useLanguage();
  const [translatedContent, setTranslatedContent] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});

  const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  const API_BASE = !rawBase ? '/api' : (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`);
  const API_URL = `${API_BASE}/community`;

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, [categoryFilter, sortBy]);

  const fetchCurrentUser = async () => {
    try {
      if (authApi.isAuthenticated()) {
        const profile = await authApi.getProfile();
        setCurrentUser(profile.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}?category=${categoryFilter}&type=${sortBy}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({ title: t('error'), description: t('loadingDiscussions'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: newPostText,
          category: newPostCategory,
          image: newPostImage
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: t('success'), description: t('postCreated') });
        setIsNewPostOpen(false);
        setNewPostText('');
        setNewPostImage('');
        setNewPostImagePreview('');
        fetchPosts();
      }
    } catch (error) {
      toast({ title: t('error'), description: t('error'), variant: 'destructive' });
    }
  };

  const handleReplyChange = (postId: string, text: string) => {
    setReplyTexts(prev => ({ ...prev, [postId]: text }));
  };

  const handleAddReply = async (postId: string) => {
    const text = replyTexts[postId];
    if (!text?.trim()) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: t('replyAdded'), description: t('replyAdded') });
        setReplyTexts(prev => ({ ...prev, [postId]: '' }));
        // Update local state for immediate feedback
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(data.data);
        }
        setPosts(posts.map(p => p._id === postId ? data.data : p));
      }
    } catch (error) {
      toast({ title: t('error'), description: t('error'), variant: 'destructive' });
    }
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('confirmDelete'))) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: t('delete'), description: t('postDeleted') });
        setPosts(posts.filter(p => p._id !== postId));
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(null);
        }
      } else {
        toast({ title: t('error'), description: data.message || t('error'), variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: t('error'), description: t('error'), variant: 'destructive' });
    }
  };

  const handleToggleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening post thread
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/${postId}/like`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(p => p._id === postId ? data.data : p));
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(data.data);
        }
      }
    } catch (error) {
       toast({ title: t('error'), description: t('error'), variant: 'destructive' });
    }
  };

  const handleReport = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${API_URL}/${postId}/report`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast({ title: t('postReportedTitle'), description: t('postReportedDesc') });
    } catch (error) {
      console.error(error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Poultry': return 'bg-amber-100 text-amber-800';
      case 'Dairy': return 'bg-blue-100 text-blue-800';
      case 'Fish': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const translateItem = async (id: string, text: string) => {
    if (translatedContent[id]) {
      setTranslatedContent(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    setIsTranslating(prev => ({ ...prev, [id]: true }));
    try {
      const translated = await translateText(text, language);
      setTranslatedContent(prev => ({ ...prev, [id]: translated }));
    } catch (error) {
      toast({ title: t('error'), description: t('error') });
    } finally {
      setIsTranslating(prev => ({ ...prev, [id]: false }));
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${Math.max(1, seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${t('ago') || 'ago'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${t('ago') || 'ago'}`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ${t('ago') || 'ago'}`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-[124px] pb-12 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
              <Users className="w-8 h-8 text-primary" />
              {t('communityTitle')}
            </h1>
            <p className="text-slate-500 mt-2">{t('communitySubtitle')}</p>
          </div>
          <Button onClick={() => setIsNewPostOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-elegant rounded-xl h-12 px-6">
            <PlusCircle className="w-5 h-5 mr-2" />
            {t('askQuestion')}
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            {['All', 'Poultry', 'Dairy', 'Fish'].map(cat => (
              <Badge 
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                className={`cursor-pointer px-4 py-2 text-sm rounded-lg whitespace-nowrap ${categoryFilter === cat ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'All' ? t('allProducts') : t(`category${cat}`)}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] bg-slate-50 rounded-xl border-slate-200">
                <SelectValue placeholder={t('sortLatest')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">{t('sortLatest')}</SelectItem>
                <SelectItem value="active">{t('sortActive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">{t('loadingDiscussions')}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800">{t('noPostsFoundTitle')}</h3>
              <p className="text-slate-500 mt-2">{t('noPostsFoundDesc')}</p>
            </div>
          ) : (
            posts.map(post => (
              <Card 
                key={post._id} 
                className="overflow-hidden hover:shadow-elegant transition-all duration-300 border-slate-100 rounded-2xl cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <CardHeader className="pb-3 px-6 pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {post.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{post.userName}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {timeAgo(post.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getCategoryColor(post.category)}>
                      {t(`category${post.category}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-2">
                  <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">
                    {translatedContent[post._id] || post.text}
                  </p>
                  {language !== 'en' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); translateItem(post._id, post.text); }}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary transition-colors bg-primary/5 px-2 py-1 rounded-md"
                    >
                      <Globe className="w-3 h-3" />
                      {isTranslating[post._id] ? t('translating') : (translatedContent[post._id] ? t('showOriginal') : t('seeTranslation'))}
                    </button>
                  )}
                  {post.image && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 w-fit max-w-full">
                      <img 
                        src={post.image} 
                        alt="Post attachment" 
                        className="max-h-[250px] w-auto object-contain"
                        onError={(e) => {
                          if ((e.target as HTMLImageElement).parentElement) {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex gap-6">
                  <button 
                    onClick={(e) => handleToggleLike(post._id, e)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.likes.includes(currentUser?._id) ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${post.likes.includes(currentUser?._id) ? 'fill-current' : ''}`} />
                    {post.likes.length} {t('helpfulBtn')}
                  </button>
                  <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    {post.comments.length} {t('repliesBtn')}
                  </button>
                  <div className="flex-1" />
                  {currentUser && (currentUser._id === post.userId || currentUser.id === post.userId) && (
                    <button 
                      onClick={(e) => handleDeletePost(post._id, e)}
                      className="text-slate-400 hover:text-red-500 transition-colors mr-3"
                      title={t('deletePost')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleReport(post._id, e)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </CardFooter>
                
                {/* Inline Replies */}
                {post.comments && post.comments.length > 0 && (
                  <div className="px-6 pb-2 bg-slate-50/50" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-3 pt-2 mb-2 max-h-[300px] overflow-y-auto pr-2">
                      {post.comments.map(comment => (
                        <div key={comment._id} className="flex gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0 text-xs">
                            {comment.userName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-slate-900">{comment.userName}</span>
                              <span className="text-[10px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="text-slate-700 break-words">{translatedContent[comment._id] || comment.text}</p>
                            {language !== 'en' && (
                              <button 
                                onClick={() => translateItem(comment._id, comment.text)}
                                className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary transition-colors"
                              >
                                {isTranslating[comment._id] ? t('translating') : (translatedContent[comment._id] ? t('showOriginal') : t('seeTranslation'))}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Reply Input */}
                <div 
                  className="px-6 pb-4 bg-slate-50/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0 text-xs">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <Input 
                      placeholder={t('writeReply')}
                      className="flex-1 h-10 rounded-full bg-white border-slate-200 text-sm"
                      value={replyTexts[post._id] || ''}
                      onChange={(e) => handleReplyChange(post._id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddReply(post._id);
                        }
                      }}
                    />
                    <Button 
                      size="sm"
                      onClick={() => handleAddReply(post._id)}
                      className="rounded-full bg-primary h-10 px-4 shadow-sm"
                      disabled={!replyTexts[post._id]?.trim()}
                    >
                      {t('replyBtn')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* New Post Dialog */}
      <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{t('askCommunityTitle')}</DialogTitle>
            <DialogDescription>
              {t('askCommunityDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('selectCategory')}</label>
              <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                <SelectTrigger className="w-full bg-slate-50 rounded-xl h-12">
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Poultry">{t('categoryPoultry')}</SelectItem>
                  <SelectItem value="Dairy">{t('categoryDairy')}</SelectItem>
                  <SelectItem value="Fish">{t('categoryFish')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t('yourQuestionLabel')}</label>
              <Textarea 
                placeholder={t('questionPlaceholder')}
                className="min-h-[120px] bg-slate-50 rounded-xl resize-none"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Attach Photo <span className="text-slate-400 font-normal">(Optional)</span>
               </label>

               {newPostImagePreview ? (
                 <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white">
                   <img src={newPostImagePreview} alt="Preview" className="w-full max-h-64 object-contain bg-white" />
                   <button
                     type="button"
                     onClick={() => { setNewPostImage(''); setNewPostImagePreview(''); }}
                     className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                   </button>
                   <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">✓ Photo attached</div>
                 </div>
               ) : (
                 <label
                   htmlFor="community-image-upload"
                   className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl p-6 cursor-pointer bg-slate-50 hover:bg-primary/5 transition-all group"
                 >
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                     <ImageIcon className="w-6 h-6 text-primary/60" />
                   </div>
                   <div className="text-center">
                     <p className="text-sm font-semibold text-slate-600">
                       {isUploadingImage ? 'Processing...' : 'Click to upload a photo'}
                     </p>
                     <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP — shows symptoms to community</p>
                   </div>
                   <input
                     id="community-image-upload"
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file) return;
                       if (file.size > 5 * 1024 * 1024) {
                         toast({ title: 'File too large', description: 'Please choose an image under 5MB.', variant: 'destructive' });
                         return;
                       }
                       setIsUploadingImage(true);
                       const reader = new FileReader();
                       reader.onload = (ev) => {
                         const base64 = ev.target?.result as string;
                         setNewPostImage(base64);
                         setNewPostImagePreview(base64);
                         setIsUploadingImage(false);
                       };
                       reader.readAsDataURL(file);
                     }}
                   />
                 </label>
               )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl px-6" onClick={() => setIsNewPostOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreatePost} className="rounded-xl bg-primary px-8 shadow-elegant" disabled={!newPostText.trim()}>{t('postQuestionBtn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Thread (Replies) Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="sm:max-w-[600px] h-[85vh] p-0 flex flex-col rounded-3xl overflow-hidden shadow-2xl">
          {selectedPost && (
            <>
              <div className="p-6 border-b border-slate-100 bg-white shrink-0 shadow-sm z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {selectedPost.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{selectedPost.userName}</h4>
                      <div className="text-xs text-slate-500">{timeAgo(selectedPost.createdAt)}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getCategoryColor(selectedPost.category)}>
                    {t(`category${selectedPost.category}`)}
                  </Badge>
                </div>
                <p className="text-slate-800 text-lg whitespace-pre-wrap">{translatedContent[selectedPost._id] || selectedPost.text}</p>
                {language !== 'en' && (
                  <button 
                    onClick={() => translateItem(selectedPost._id, selectedPost.text)}
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary transition-colors bg-primary/5 px-2 py-1 rounded-md"
                  >
                    <Globe className="w-3 h-3" />
                    {isTranslating[selectedPost._id] ? t('translating') : (translatedContent[selectedPost._id] ? t('showOriginal') : t('seeTranslation'))}
                  </button>
                )}
                {selectedPost.image && (
                   <div className="mt-4 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 w-fit max-w-full mx-auto">
                      <img 
                        src={selectedPost.image} 
                        alt="Attachment" 
                        className="max-h-[250px] w-auto object-contain" 
                        onError={(e) => {
                          if ((e.target as HTMLImageElement).parentElement) {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }
                        }}
                      />
                   </div>
                )}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 border-dashed">
                  <span className="text-sm font-medium text-slate-500">
                    <ThumbsUp className="w-4 h-4 inline mr-1" /> {selectedPost.likes.length} {t('helpfulBtn')}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    <MessageSquare className="w-4 h-4 inline mr-1" /> {selectedPost.comments.length} {t('repliesBtn')}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
                {selectedPost.comments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    {t('noRepliesYet', { name: selectedPost.userName })}
                  </div>
                ) : (
                  selectedPost.comments.map(comment => (
                    <div key={comment._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50 flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0 text-sm">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                           <span className="font-bold text-slate-900 text-sm">{comment.userName}</span>
                           <span className="text-[10px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                        </div>
                        <p className="text-slate-700 text-sm">{translatedContent[comment._id] || comment.text}</p>
                        {language !== 'en' && (
                          <button 
                            onClick={() => translateItem(comment._id, comment.text)}
                            className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary transition-colors"
                          >
                            {isTranslating[comment._id] ? t('translating') : (translatedContent[comment._id] ? t('showOriginal') : t('seeTranslation'))}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <div className="flex gap-2">
                  <Input 
                    placeholder={t('typeReplyPlaceholder')}
                    className="flex-1 h-12 rounded-xl bg-slate-50 border-slate-200"
                    value={replyTexts[selectedPost._id] || ''}
                    onChange={(e) => handleReplyChange(selectedPost._id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddReply(selectedPost._id)}
                  />
                  <Button 
                    onClick={() => handleAddReply(selectedPost._id)}
                    className="h-12 px-6 rounded-xl bg-primary shadow-elegant"
                    disabled={!replyTexts[selectedPost._id]?.trim()}
                  >
                    {t('replyBtn')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
