import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerFolderRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/folders - Get all folders for user with optional type filter
  app.fastify.get('/api/folders', {
    schema: {
      description: 'Get all folders for the authenticated user',
      tags: ['folders'],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['notes', 'diet'] }
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
              name: { type: 'string' },
              type: { type: 'string' },
              color: { type: 'string' },
              icon: { type: 'string' },
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

    const { type } = request.query as { type?: string };

    if (type) {
      return app.db.select().from(schema.folders).where(
        and(
          eq(schema.folders.userId, session.user.id),
          eq(schema.folders.type, type as 'notes' | 'diet')
        )
      );
    }

    return app.db.select().from(schema.folders).where(
      eq(schema.folders.userId, session.user.id)
    );
  });

  // POST /api/folders - Create a new folder
  app.fastify.post('/api/folders', {
    schema: {
      description: 'Create a new folder',
      tags: ['folders'],
      body: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['notes', 'diet'] },
          color: { type: 'string' },
          icon: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            color: { type: 'string' },
            icon: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { name, type, color, icon } = request.body as {
      name: string;
      type: 'notes' | 'diet';
      color?: string;
      icon?: string;
    };

    const [folder] = await app.db.insert(schema.folders).values({
      userId: session.user.id,
      name,
      type,
      color: color || 'blue',
      icon: icon || 'folder'
    }).returning();

    return reply.status(201).send(folder);
  });

  // PUT /api/folders/:id - Update a folder
  app.fastify.put('/api/folders/:id', {
    schema: {
      description: 'Update a folder',
      tags: ['folders'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          color: { type: 'string' },
          icon: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            color: { type: 'string' },
            icon: { type: 'string' },
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
    const { name, color, icon } = request.body as {
      name?: string;
      color?: string;
      icon?: string;
    };

    // Verify folder ownership
    const folder = await app.db.query.folders.findFirst({
      where: and(
        eq(schema.folders.id, id),
        eq(schema.folders.userId, session.user.id)
      )
    });

    if (!folder) {
      return reply.status(404).send({ error: 'Folder not found' });
    }

    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (color) updates.color = color;
    if (icon) updates.icon = icon;

    const [updatedFolder] = await app.db.update(schema.folders)
      .set(updates)
      .where(eq(schema.folders.id, id))
      .returning();

    return updatedFolder;
  });

  // DELETE /api/folders/:id - Delete a folder
  app.fastify.delete('/api/folders/:id', {
    schema: {
      description: 'Delete a folder',
      tags: ['folders'],
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

    // Verify folder ownership
    const folder = await app.db.query.folders.findFirst({
      where: and(
        eq(schema.folders.id, id),
        eq(schema.folders.userId, session.user.id)
      )
    });

    if (!folder) {
      return reply.status(404).send({ error: 'Folder not found' });
    }

    await app.db.delete(schema.folders).where(eq(schema.folders.id, id));
    return reply.status(204).send();
  });
}
