import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  libraries: defineTable({
    userId: v.string(),
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    hardcoverKeyEncrypted: v.optional(v.string()),
    hardcoverLastSyncedAt: v.optional(v.number()),
    importSource: v.union(
      v.literal('hardcover'),
      v.literal('goodreads'),
      v.literal('manual'),
      v.literal('none'),
    ),
    isPublic: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_username', ['username']),

  books: defineTable({
    userId: v.string(),
    year: v.number(),
    order: v.number(),
    title: v.string(),
    authors: v.array(v.string()),
    pageCount: v.number(),
    coverUrl: v.optional(v.string()),
    coverProxiedUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    hardcoverId: v.optional(v.string()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    source: v.union(
      v.literal('hardcover'),
      v.literal('goodreads'),
      v.literal('manual'),
      v.literal('openlibrary'),
    ),
    enrichmentStatus: v.optional(
      v.union(v.literal('pending'), v.literal('done'), v.literal('failed')),
    ),
  })
    .index('by_user_year_order', ['userId', 'year', 'order'])
    .index('by_user', ['userId']),
});
