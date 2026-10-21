import { HttpError } from 'wasp/server';
import type { 
  GetDiscussion, 
  CreateDiscussion, 
  GetComments, 
  CreateComment, 
  UpdateComment, 
  DeleteComment,
  LikeComment,
  DislikeComment
} from 'wasp/server/operations';
import type { Discussion, Comment } from 'wasp/entities';

// Get or create discussion for a movie/TV show
export const getDiscussion: GetDiscussion<{ tmdbId: number; mediaType: 'MOVIE' | 'TV_SHOW' }, Discussion> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { tmdbId, mediaType } = args;

  // Try to find existing discussion
  let discussion = await context.entities.Discussion.findFirst({
    where: { tmdbId, mediaType }
  });

  // If no discussion exists, create one
  if (!discussion) {
    // Fetch movie/TV show details from TMDB
    const tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/${mediaType === 'MOVIE' ? 'movie' : 'tv'}/${tmdbId}?api_key=9b0eaa970893512ec6b66c8add587944`
    );
    
    if (!tmdbResponse.ok) {
      throw new HttpError(404, 'Movie/TV show not found');
    }

    const tmdbData = await tmdbResponse.json();
    
    discussion = await context.entities.Discussion.create({
      data: {
        tmdbId,
        mediaType,
        title: tmdbData.title || tmdbData.name,
        posterPath: tmdbData.poster_path,
        userId: context.user.id
      }
    });
  }

  return discussion;
};

// Create a new discussion (usually not needed as getDiscussion creates automatically)
export const createDiscussion: CreateDiscussion<{
  tmdbId: number;
  mediaType: 'MOVIE' | 'TV_SHOW';
  title: string;
  posterPath?: string;
}, Discussion> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { tmdbId, mediaType, title, posterPath } = args;

  // Check if discussion already exists
  const existingDiscussion = await context.entities.Discussion.findFirst({
    where: { tmdbId, mediaType }
  });

  if (existingDiscussion) {
    throw new HttpError(409, 'Discussion already exists for this movie/TV show');
  }

  return context.entities.Discussion.create({
    data: {
      tmdbId,
      mediaType,
      title,
      posterPath,
      userId: context.user.id
    }
  });
};

// Get comments for a discussion
export const getComments: GetComments<{ discussionId: string }, Comment[]> = async (args, context) => {
  const { discussionId } = args;

  return context.entities.Comment.findMany({
    where: { 
      discussionId,
      parentId: null, // Only top-level comments
      isDeleted: false
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      replies: {
        where: { isDeleted: false },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

// Create a new comment
export const createComment: CreateComment<{
  discussionId: string;
  content: string;
  rating?: number;
  episodeNumber?: number;
  seasonNumber?: number;
  parentId?: string;
}, Comment> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { discussionId, content, rating, episodeNumber, seasonNumber, parentId } = args;

  // Validate content
  if (!content.trim()) {
    throw new HttpError(400, 'Comment content cannot be empty');
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 10)) {
    throw new HttpError(400, 'Rating must be between 1 and 10');
  }

  // Check if discussion exists
  const discussion = await context.entities.Discussion.findUnique({
    where: { id: discussionId }
  });

  if (!discussion) {
    throw new HttpError(404, 'Discussion not found');
  }

  // If this is a reply, check if parent comment exists
  if (parentId) {
    const parentComment = await context.entities.Comment.findUnique({
      where: { id: parentId }
    });

    if (!parentComment) {
      throw new HttpError(404, 'Parent comment not found');
    }
  }

  return context.entities.Comment.create({
    data: {
      content: content.trim(),
      rating,
      episodeNumber,
      seasonNumber,
      discussionId,
      parentId,
      userId: context.user.id
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });
};

// Update a comment
export const updateComment: UpdateComment<{
  id: string;
  content: string;
  rating?: number;
}, Comment> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { id, content, rating } = args;

  // Validate content
  if (!content.trim()) {
    throw new HttpError(400, 'Comment content cannot be empty');
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 10)) {
    throw new HttpError(400, 'Rating must be between 1 and 10');
  }

  // Find the comment and check ownership
  const comment = await context.entities.Comment.findUnique({
    where: { id }
  });

  if (!comment) {
    throw new HttpError(404, 'Comment not found');
  }

  if (comment.userId !== context.user.id) {
    throw new HttpError(403, 'You can only edit your own comments');
  }

  return context.entities.Comment.update({
    where: { id },
    data: {
      content: content.trim(),
      rating,
      isEdited: true,
      updatedAt: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });
};

// Delete a comment (soft delete)
export const deleteComment: DeleteComment<{ id: string }, Comment> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { id } = args;

  // Find the comment and check ownership
  const comment = await context.entities.Comment.findUnique({
    where: { id }
  });

  if (!comment) {
    throw new HttpError(404, 'Comment not found');
  }

  if (comment.userId !== context.user.id) {
    throw new HttpError(403, 'You can only delete your own comments');
  }

  return context.entities.Comment.update({
    where: { id },
    data: {
      isDeleted: true,
      content: '[deleted]',
      updatedAt: new Date()
    }
  });
};

// Like a comment
export const likeComment: LikeComment<{ id: string }, Comment> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { id } = args;

  const comment = await context.entities.Comment.findUnique({
    where: { id }
  });

  if (!comment) {
    throw new HttpError(404, 'Comment not found');
  }

  return context.entities.Comment.update({
    where: { id },
    data: {
      likes: comment.likes + 1
    }
  });
};

// Dislike a comment
export const dislikeComment: DislikeComment<{ id: string }, Comment> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { id } = args;

  const comment = await context.entities.Comment.findUnique({
    where: { id }
  });

  if (!comment) {
    throw new HttpError(404, 'Comment not found');
  }

  return context.entities.Comment.update({
    where: { id },
    data: {
      dislikes: comment.dislikes + 1
    }
  });
}; 