import { HttpError } from 'wasp/server'
import type { 
  GetWatchlist, 
  AddToWatchlist, 
  UpdateWatchItem, 
  RemoveFromWatchlist,
  GetEpisodes,
  UpdateEpisode,
  BulkUpdateEpisodes,
  SyncEpisodes
} from 'wasp/server/operations'
import type { WatchItem, Episode } from 'wasp/entities'
import { MediaType, WatchStatus } from '@prisma/client'

export const getWatchlist: GetWatchlist<void, (WatchItem & { episodes: Episode[] })[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  return context.entities.WatchItem.findMany({
    where: { userId: context.user.id },
    include: {
      episodes: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const addToWatchlist: AddToWatchlist<{
  tmdbId: number
  mediaType: 'MOVIE' | 'TV_SHOW'
  title: string
  posterPath?: string
  overview?: string
  genres: string[]
  releaseDate?: string
}, WatchItem> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { tmdbId, mediaType, title, posterPath, overview, genres, releaseDate } = args

  // Check if item already exists in user's watchlist
  const existingItem = await context.entities.WatchItem.findFirst({
    where: {
      tmdbId,
      userId: context.user.id
    }
  })

  if (existingItem) {
    throw new HttpError(409, 'Item already exists in your watchlist')
  }

  // Create the watchlist item
  const watchItem = await context.entities.WatchItem.create({
    data: {
      tmdbId,
      mediaType: mediaType as MediaType,
      title,
      posterPath,
      overview,
      genres,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      status: WatchStatus.PLANNED,
      userId: context.user.id
    }
  })

  return watchItem
}

export const updateWatchItem: UpdateWatchItem<{
  id: string
  status?: WatchStatus
  rating?: number
}, WatchItem> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { id, status, rating } = args

  // Verify the item belongs to the user
  const existingItem = await context.entities.WatchItem.findFirst({
    where: {
      id,
      userId: context.user.id
    }
  })

  if (!existingItem) {
    throw new HttpError(404, 'Watchlist item not found')
  }

  // Validate rating if provided
  if (rating !== undefined && (rating < 1 || rating > 10)) {
    throw new HttpError(400, 'Rating must be between 1 and 10')
  }

  // Update the item
  const updatedItem = await context.entities.WatchItem.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(rating !== undefined && { rating })
    }
  })

  return updatedItem
}

export const removeFromWatchlist: RemoveFromWatchlist<{ id: string }, { success: boolean }> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { id } = args

  // Verify the item belongs to the user
  const existingItem = await context.entities.WatchItem.findFirst({
    where: {
      id,
      userId: context.user.id
    }
  })

  if (!existingItem) {
    throw new HttpError(404, 'Watchlist item not found')
  }

  // Delete the item (episodes will be deleted automatically due to cascade)
  await context.entities.WatchItem.delete({
    where: { id }
  })

  return { success: true }
} 

// Episode management operations
export const getEpisodes: GetEpisodes<{ watchItemId: string }, Episode[]> = async ({ watchItemId }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  // Verify the watch item belongs to the user
  const watchItem = await context.entities.WatchItem.findFirst({
    where: { id: watchItemId, userId: context.user.id }
  });

  if (!watchItem) {
    throw new HttpError(404, 'Watch item not found');
  }

  return context.entities.Episode.findMany({
    where: { watchItemId },
    orderBy: [
      { seasonNumber: 'asc' },
      { episodeNumber: 'asc' }
    ]
  });
};

export const updateEpisode: UpdateEpisode<{ id: string; isWatched: boolean }, Episode> = async ({ id, isWatched }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  // Verify the episode belongs to a watch item owned by the user
  const episode = await context.entities.Episode.findFirst({
    where: { id },
    include: { watchItem: true }
  });

  if (!episode || episode.watchItem.userId !== context.user.id) {
    throw new HttpError(404, 'Episode not found');
  }

  return context.entities.Episode.update({
    where: { id },
    data: { isWatched }
  });
};

export const bulkUpdateEpisodes: BulkUpdateEpisodes<{ watchItemId: string; episodeIds: string[]; isWatched: boolean }, { success: boolean; updatedCount: number }> = async ({ watchItemId, episodeIds, isWatched }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  // Verify the watch item belongs to the user
  const watchItem = await context.entities.WatchItem.findFirst({
    where: { id: watchItemId, userId: context.user.id }
  });

  if (!watchItem) {
    throw new HttpError(404, 'Watch item not found');
  }

  // Update all specified episodes
  const updatePromises = episodeIds.map((episodeId: string) =>
    context.entities.Episode.updateMany({
      where: { 
        id: episodeId, 
        watchItemId 
      },
      data: { isWatched }
    })
  );

  await Promise.all(updatePromises);

  return { success: true, updatedCount: episodeIds.length };
};

export const syncEpisodes: SyncEpisodes<{ watchItemId: string }, { success: boolean; syncedCount: number }> = async ({ watchItemId }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  // Verify the watch item belongs to the user and is a TV show
  const watchItem = await context.entities.WatchItem.findFirst({
    where: { id: watchItemId, userId: context.user.id, mediaType: 'TV_SHOW' }
  });

  if (!watchItem) {
    throw new HttpError(404, 'TV show watch item not found');
  }

  try {
    // Fetch TV show details from TMDB to get episodes
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BEARER = process.env.TMDB_BEARER_TOKEN;

    const headers: Record<string, string> = {};
    if (TMDB_BEARER) {
      headers['Authorization'] = `Bearer ${TMDB_BEARER}`;
    }
    
    const fullUrl = TMDB_BEARER 
      ? `https://api.themoviedb.org/3/tv/${watchItem.tmdbId}?append_to_response=seasons`
      : `https://api.themoviedb.org/3/tv/${watchItem.tmdbId}?append_to_response=seasons&api_key=${TMDB_API_KEY}`;
    
    const response = await fetch(fullUrl, { headers });
    if (!response.ok) {
      throw new HttpError(response.status, 'Failed to fetch TV show details');
    }
    
    const tvData = await response.json();
    
    // Get existing episodes
    const existingEpisodes = await context.entities.Episode.findMany({
      where: { watchItemId },
      select: { tmdbId: true }
    });
    
    const existingEpisodeIds = new Set(existingEpisodes.map(ep => ep.tmdbId));
    
    let syncedCount = 0;
    
    // Process each season
    for (const season of tvData.seasons || []) {
      if (season.season_number === 0) continue; // Skip specials
      
      // Fetch episodes for this season
      const seasonUrl = TMDB_BEARER 
        ? `https://api.themoviedb.org/3/tv/${watchItem.tmdbId}/season/${season.season_number}`
        : `https://api.themoviedb.org/3/tv/${watchItem.tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`;
      
      const seasonResponse = await fetch(seasonUrl, { headers });
      if (!seasonResponse.ok) continue;
      
      const seasonData = await seasonResponse.json();
      
      // Create episodes that don't exist
      for (const episode of seasonData.episodes || []) {
        if (!existingEpisodeIds.has(episode.id)) {
          await context.entities.Episode.create({
            data: {
              tmdbId: episode.id,
              seasonNumber: episode.season_number,
              episodeNumber: episode.episode_number,
              title: episode.name,
              airDate: episode.air_date ? new Date(episode.air_date) : null,
              isWatched: false,
              watchItemId
            }
          });
          syncedCount++;
        }
      }
    }
    
    return { success: true, syncedCount };
  } catch (error) {
    console.error('Failed to sync episodes:', error);
    throw new HttpError(500, 'Failed to sync episodes');
  }
}; 