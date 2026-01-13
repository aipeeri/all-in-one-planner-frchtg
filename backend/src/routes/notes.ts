import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerNotesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/notes - Get all notes for user with optional folder filter
  app.fastify.get('/api/notes', {
    schema: {
      description: 'Get all notes for the authenticated user',
      tags: ['notes'],
      querystring: {
        type: 'object',
        properties: {
          folderId: { type: 'string', description: 'Optional folder ID filter' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              folderId: { type: ['string', 'null'] },
              title: { type: 'string' },
              content: { type: ['string', 'null'] },
              tags: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { folderId } = request.query as { folderId?: string };

    if (folderId) {
      return app.db.select().from(schema.notes).where(
        and(
          eq(schema.notes.userId, session.user.id),
          eq(schema.notes.folderId, folderId)
        )
      );
    }

    return app.db.select().from(schema.notes).where(
      eq(schema.notes.userId, session.user.id)
    );
  });

  // GET /api/notes/:id - Get a specific note
  app.fastify.get('/api/notes/:id', {
    schema: {
      description: 'Get a specific note',
      tags: ['notes'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            folderId: { type: ['string', 'null'] },
            title: { type: 'string' },
            content: { type: ['string', 'null'] },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };

    const note = await app.db.query.notes.findFirst({
      where: and(
        eq(schema.notes.id, id),
        eq(schema.notes.userId, session.user.id)
      )
    });

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    return note;
  });

  // POST /api/notes - Create a new note
  app.fastify.post('/api/notes', {
    schema: {
      description: 'Create a new note',
      tags: ['notes'],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          folderId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            folderId: { type: ['string', 'null'] },
            title: { type: 'string' },
            content: { type: ['string', 'null'] },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { title, content, folderId, tags } = request.body as {
      title: string;
      content?: string;
      folderId?: string;
      tags?: string[];
    };

    const [note] = await app.db.insert(schema.notes).values({
      userId: session.user.id,
      title,
      content: content || null,
      folderId: folderId || null,
      tags: tags || []
    }).returning();

    return reply.status(201).send(note);
  });

  // PUT /api/notes/:id - Update a note
  app.fastify.put('/api/notes/:id', {
    schema: {
      description: 'Update a note',
      tags: ['notes'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          folderId: { type: ['string', 'null'] },
          tags: { type: 'array', items: { type: 'string' } }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            folderId: { type: ['string', 'null'] },
            title: { type: 'string' },
            content: { type: ['string', 'null'] },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    const { title, content, folderId, tags } = request.body as {
      title?: string;
      content?: string;
      folderId?: string | null;
      tags?: string[];
    };

    // Verify note ownership
    const note = await app.db.query.notes.findFirst({
      where: and(
        eq(schema.notes.id, id),
        eq(schema.notes.userId, session.user.id)
      )
    });

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content || null;
    if (folderId !== undefined) updates.folderId = folderId || null;
    if (tags !== undefined) updates.tags = tags;

    const [updatedNote] = await app.db.update(schema.notes)
      .set(updates)
      .where(eq(schema.notes.id, id))
      .returning();

    return updatedNote;
  });

  // DELETE /api/notes/:id - Delete a note
  app.fastify.delete('/api/notes/:id', {
    schema: {
      description: 'Delete a note',
      tags: ['notes'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        204: { type: 'null' }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };

    // Verify note ownership
    const note = await app.db.query.notes.findFirst({
      where: and(
        eq(schema.notes.id, id),
        eq(schema.notes.userId, session.user.id)
      )
    });

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    await app.db.delete(schema.notes).where(eq(schema.notes.id, id));
    return reply.status(204).send();
  });
}
