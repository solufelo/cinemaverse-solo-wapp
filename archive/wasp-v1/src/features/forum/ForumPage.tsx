'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'wasp/client/operations';
import { getDiscussion, getComments, createComment, updateComment, deleteComment, likeComment, dislikeComment } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, ThumbsUp, ThumbsDown, Edit, Trash2, Reply, Star, Calendar, User } from 'lucide-react';
import Header2 from '../../components/mvpblocks/header';

// Use the actual Prisma types
type Comment = {
  id: string;
  content: string;
  rating: number | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  likes: number;
  dislikes: number;
  user: {
    id: string;
    username: string;
    email: string;
  };
  replies: Comment[];
};

type Discussion = {
  id: string;
  tmdbId: number;
  mediaType: 'MOVIE' | 'TV_SHOW';
  title: string;
  posterPath: string | null;
  createdAt: string;
  likes: number;
  dislikes: number;
};

export default function ForumPage() {
  const { data: user } = useAuth();
  const [searchParams] = useSearchParams();
  const tmdbId = searchParams.get('tmdbId');
  const mediaType = searchParams.get('mediaType') as 'MOVIE' | 'TV_SHOW';

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState<number>(0);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: discussion, isLoading: discussionLoading, error: discussionError } = useQuery(
    getDiscussion,
    { tmdbId: parseInt(tmdbId || '0'), mediaType },
    { enabled: !!tmdbId && !!mediaType }
  );

  const { data: comments, isLoading: commentsLoading, error: commentsError, refetch: refetchComments } = useQuery(
    getComments,
    { discussionId: discussion?.id || '' },
    { enabled: !!discussion?.id }
  );

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !discussion) return;

    try {
      await createComment({
        discussionId: discussion.id,
        content: newComment.trim(),
        rating: newRating > 0 ? newRating : undefined
      });
      setNewComment('');
      setNewRating(0);
      refetchComments();
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Failed to create comment. Please try again.');
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment({
        id: commentId,
        content: editContent.trim()
      });
      setEditingComment(null);
      setEditContent('');
      refetchComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment({ id: commentId });
      refetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await likeComment({ id: commentId });
      refetchComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDislikeComment = async (commentId: string) => {
    try {
      await dislikeComment({ id: commentId });
      refetchComments();
    } catch (error) {
      console.error('Failed to dislike comment:', error);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !discussion) return;

    try {
      await createComment({
        discussionId: discussion.id,
        content: replyContent.trim(),
        parentId
      });
      setReplyingTo(null);
      setReplyContent('');
      refetchComments();
    } catch (error) {
      console.error('Failed to create reply:', error);
      alert('Failed to create reply. Please try again.');
    }
  };

  const getPosterUrl = (posterPath: string | null | undefined) => {
    if (!posterPath) return '/placeholder-poster.jpg';
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  if (!tmdbId || !mediaType) {
    return (
      <div className="relative min-h-screen">
        {/* Stylized Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-indigo-900 dark:to-slate-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20"></div>
          <div className="absolute inset-0 bg-[linear-gradient(30deg,_#6366f1_1px,_transparent_1px),_linear-gradient(-30deg,_#8b5cf6_1px,_transparent_1px)] bg-[size:25px_25px] opacity-15 dark:opacity-25"></div>
        </div>
        <div className="relative z-10">
          <Header2 />
          <div className="pt-16 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Discussion Not Found</h2>
              <p className="text-gray-600">Please provide a valid movie or TV show ID.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (discussionLoading || commentsLoading) {
    return (
      <div className="relative min-h-screen">
        {/* Stylized Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-indigo-900 dark:to-slate-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20"></div>
          <div className="absolute inset-0 bg-[linear-gradient(30deg,_#6366f1_1px,_transparent_1px),_linear-gradient(-30deg,_#8b5cf6_1px,_transparent_1px)] bg-[size:25px_25px] opacity-15 dark:opacity-25"></div>
        </div>
        <div className="relative z-10">
          <Header2 />
          <div className="pt-16 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (discussionError || commentsError) {
    return (
      <div className="relative min-h-screen">
        {/* Stylized Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-indigo-900 dark:to-slate-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20"></div>
          <div className="absolute inset-0 bg-[linear-gradient(30deg,_#6366f1_1px,_transparent_1px),_linear-gradient(-30deg,_#8b5cf6_1px,_transparent_1px)] bg-[size:25px_25px] opacity-15 dark:opacity-25"></div>
        </div>
        <div className="relative z-10">
          <Header2 />
          <div className="pt-16 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Discussion</h2>
              <p className="text-gray-600">Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Stylized Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-indigo-900 dark:to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(30deg,_#6366f1_1px,_transparent_1px),_linear-gradient(-30deg,_#8b5cf6_1px,_transparent_1px)] bg-[size:25px_25px] opacity-15 dark:opacity-25"></div>
      </div>
      <div className="relative z-10">
        <Header2 />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Discussion Header */}
          {discussion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <div className="flex items-start space-x-6">
                <img
                  src={getPosterUrl(discussion.posterPath)}
                  alt={discussion.title}
                  className="w-24 h-36 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {discussion.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span className="capitalize">{discussion.mediaType.toLowerCase().replace('_', ' ')}</span>
                    <span>•</span>
                    <span>TMDB ID: {discussion.tmdbId}</span>
                    <span>•</span>
                    <span>Created {new Date(discussion.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">{discussion.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">{discussion.dislikes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* New Comment Form */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Comment</h3>
              
              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (optional)</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setNewRating(rating)}
                      className={`p-2 rounded-full transition-colors ${
                        newRating >= rating
                          ? 'text-yellow-500 bg-yellow-50'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                  {newRating > 0 && (
                    <span className="text-sm text-gray-600 ml-2">{newRating}/10</span>
                  )}
                </div>
              </div>

              {/* Comment Input */}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this movie or TV show..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post Comment
                </button>
              </div>
            </motion.div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Comments ({comments?.length || 0})
            </h3>
            
            {comments?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments?.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment as any}
                  user={user}
                  onEdit={handleUpdateComment}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                  onDislike={handleDislikeComment}
                  onReply={handleSubmitReply}
                  editingComment={editingComment}
                  setEditingComment={setEditingComment}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                />
              ))
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  user: any;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
  onReply: (parentId: string) => void;
  editingComment: string | null;
  setEditingComment: (commentId: string | null) => void;
  editContent: string;
  setEditContent: (content: string) => void;
  replyingTo: string | null;
  setReplyingTo: (commentId: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
}

function CommentItem({
  comment,
  user,
  onEdit,
  onDelete,
  onLike,
  onDislike,
  onReply,
  editingComment,
  setEditingComment,
  editContent,
  setEditContent,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent
}: CommentItemProps) {
  const isOwner = user?.id === comment.user.id;
  const isEditing = editingComment === comment.id;
  const isReplying = replyingTo === comment.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{comment.user.username}</div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
              {comment.isEdited && <span>• Edited</span>}
              {comment.rating && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{comment.rating}/10</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {isOwner && !comment.isDeleted && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditingComment(comment.id);
                setEditContent(comment.content);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Comment Content */}
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={() => setEditingComment(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onEdit(comment.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-gray-900 whitespace-pre-wrap">
            {comment.isDeleted ? '[This comment has been deleted]' : comment.content}
          </p>
        </div>
      )}

      {/* Comment Actions */}
      {!comment.isDeleted && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike(comment.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{comment.likes}</span>
            </button>
            <button
              onClick={() => onDislike(comment.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm">{comment.dislikes}</span>
            </button>
            {user && (
              <button
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyContent('');
                }}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Reply className="h-4 w-4" />
                <span className="text-sm">Reply</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reply Form */}
      {isReplying && user && (
        <div className="mt-4 pl-6 border-l-2 border-gray-200">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={() => setReplyingTo(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onReply(comment.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reply
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200">
          {comment.replies.map((reply: Comment) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onDislike={onDislike}
              onReply={onReply}
              editingComment={editingComment}
              setEditingComment={setEditingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
} 