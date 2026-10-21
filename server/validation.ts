import { z } from 'zod'
import { BIO_MAX, DISPLAY_NAME_MAX, NOTE_MAX, WATCH_STATUSES } from '../shared/constants.ts'

const RESERVED = new Set(['admin', 'api', 'me', 'root', 'support', 'cinemaverse', 'system'])

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.]{3,20}$/, '3–20 characters: letters, numbers, _ or .')
  .refine((u) => !RESERVED.has(u) && !u.startsWith('guest_'), 'That username is reserved.')

const displayName = z.string().trim().min(1, 'Required.').max(DISPLAY_NAME_MAX, `${DISPLAY_NAME_MAX} characters max.`)

export const signupSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email.')),
  password: z.string().min(8, 'At least 8 characters.').max(128, '128 characters max.'),
  displayName: displayName.optional(),
})

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1, 'Enter your email or username.').max(254),
  password: z.string().min(1, 'Enter your password.').max(128),
})

export const statusSchema = z.enum(WATCH_STATUSES)

const posterPath = z
  .string()
  .regex(/^\/[A-Za-z0-9_-]{5,64}\.(jpg|jpeg|png|webp)$/, 'Not a TMDB image path.')
  .nullable()
  .optional()

export const filmSchema = z.object({
  title: z.string().trim().min(1).max(200),
  posterPath,
  backdropPath: posterPath,
  releaseYear: z.number().int().min(1870).max(2100).nullable().optional(),
  genres: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
})

const rating = z.number().int().min(1, 'Rating is 1–10.').max(10, 'Rating is 1–10.').nullable()
const note = z.string().trim().max(NOTE_MAX, `${NOTE_MAX} characters max.`)

/** PUT /api/watchlist/:tmdbId — log or update a film. */
export const logSchema = z.object({
  film: filmSchema,
  status: statusSchema,
  rating: rating.optional(),
  note: note.optional(),
})

/** PATCH /api/watchlist/:tmdbId — partial update of an existing entry. */
export const patchEntrySchema = z
  .object({ status: statusSchema.optional(), rating: rating.optional(), note: note.optional() })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.')

export const profilePatchSchema = z
  .object({
    displayName: displayName.optional(),
    bio: z.string().trim().max(BIO_MAX, `${BIO_MAX} characters max.`).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.')

export const tmdbIdParam = z.coerce.number().int().positive().max(100_000_000)
export const uuidParam = z.uuid('Not a valid id.')

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(200).optional(),
  status: statusSchema.optional(),
})

export const watchlistQuerySchema = z.object({ status: statusSchema.optional() })
