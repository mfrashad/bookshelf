import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  return ctx.auth.getUserIdentity().then((id) => {
    if (!id) throw new Error('Not authenticated');
    return id.subject;
  });
}

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];
    return ctx.db
      .query('books')
      .withIndex('by_user', (q) => q.eq('userId', userId.subject))
      .collect();
  },
});

export const upsertMany = mutation({
  args: {
    books: v.array(
      v.object({
        title: v.string(),
        authors: v.array(v.string()),
        pageCount: v.number(),
        year: v.number(),
        order: v.number(),
        coverUrl: v.optional(v.string()),
        coverProxiedUrl: v.optional(v.string()),
        isbn: v.optional(v.string()),
        hardcoverId: v.optional(v.string()),
        rating: v.optional(v.number()),
        source: v.union(
          v.literal('hardcover'),
          v.literal('goodreads'),
          v.literal('manual'),
          v.literal('openlibrary'),
        ),
      }),
    ),
  },
  handler: async (ctx, { books }) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error('Not authenticated');
    for (const book of books) {
      await ctx.db.insert('books', { ...book, userId, enrichmentStatus: 'pending' });
    }
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    authors: v.array(v.string()),
    pageCount: v.number(),
    year: v.number(),
    order: v.number(),
    coverUrl: v.optional(v.string()),
    coverProxiedUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    rating: v.optional(v.number()),
    source: v.union(
      v.literal('hardcover'),
      v.literal('goodreads'),
      v.literal('manual'),
      v.literal('openlibrary'),
    ),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error('Not authenticated');
    return ctx.db.insert('books', { ...args, userId });
  },
});

export const update = mutation({
  args: {
    id: v.id('books'),
    patch: v.object({
      title: v.optional(v.string()),
      authors: v.optional(v.array(v.string())),
      pageCount: v.optional(v.number()),
      year: v.optional(v.number()),
      order: v.optional(v.number()),
      coverUrl: v.optional(v.string()),
      coverProxiedUrl: v.optional(v.string()),
      rating: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error('Not authenticated');
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id('books') },
  handler: async (ctx, { id }) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error('Not authenticated');
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    await ctx.db.delete(id);
  },
});

export const move = mutation({
  args: { id: v.id('books'), toYear: v.number(), toOrder: v.number() },
  handler: async (ctx, { id, toYear, toOrder }) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error('Not authenticated');
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    await ctx.db.patch(id, { year: toYear, order: toOrder });
  },
});

export const migrateFromLocalStorage = mutation({
  args: {
    books: v.array(
      v.object({
        title: v.string(),
        authors: v.array(v.string()),
        pageCount: v.number(),
        year: v.number(),
        order: v.number(),
        coverUrl: v.optional(v.string()),
        coverProxiedUrl: v.optional(v.string()),
        isbn: v.optional(v.string()),
        rating: v.optional(v.number()),
        source: v.union(
          v.literal('hardcover'),
          v.literal('goodreads'),
          v.literal('manual'),
          v.literal('openlibrary'),
        ),
      }),
    ),
  },
  handler: async (ctx, { books }) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error('Not authenticated');
    const existing = await ctx.db
      .query('books')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    // Only migrate if the user has no Convex books yet (fresh account)
    if (existing.length > 0) return { skipped: true, count: 0 };
    for (const book of books) {
      await ctx.db.insert('books', { ...book, userId });
    }
    return { skipped: false, count: books.length };
  },
});
