import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerDietRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/diet - Get all diet entries for user with optional date range and folder filtering
  app.fastify.get('/api/diet', {
    schema: {
      description: 'Get all diet entries for the authenticated user',
      tags: ['diet'],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'ISO date string for start of date range' },
          endDate: { type: 'string', description: 'ISO date string for end of date range' },
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
              date: { type: 'string' },
              mealType: { type: 'string' },
              foodName: { type: 'string' },
              calories: { type: ['integer', 'null'] },
              notes: { type: ['string', 'null'] },
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

    const { startDate, endDate, folderId } = request.query as {
      startDate?: string;
      endDate?: string;
      folderId?: string;
    };

    const conditions = [eq(schema.dietEntries.userId, session.user.id)];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      conditions.push(gte(schema.dietEntries.date, start));
      conditions.push(lte(schema.dietEntries.date, end));
    }

    if (folderId) {
      conditions.push(eq(schema.dietEntries.folderId, folderId));
    }

    return app.db.select().from(schema.dietEntries).where(and(...conditions));
  });

  // GET /api/diet/:id - Get a specific diet entry
  app.fastify.get('/api/diet/:id', {
    schema: {
      description: 'Get a specific diet entry',
      tags: ['diet'],
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
            date: { type: 'string' },
            mealType: { type: 'string' },
            foodName: { type: 'string' },
            calories: { type: ['integer', 'null'] },
            notes: { type: ['string', 'null'] },
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

    const dietEntry = await app.db.query.dietEntries.findFirst({
      where: and(
        eq(schema.dietEntries.id, id),
        eq(schema.dietEntries.userId, session.user.id)
      )
    });

    if (!dietEntry) {
      return reply.status(404).send({ error: 'Diet entry not found' });
    }

    return dietEntry;
  });

  // POST /api/diet - Create a new diet entry
  app.fastify.post('/api/diet', {
    schema: {
      description: 'Create a new diet entry',
      tags: ['diet'],
      body: {
        type: 'object',
        required: ['date', 'mealType', 'foodName'],
        properties: {
          date: { type: 'string' },
          mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
          foodName: { type: 'string' },
          calories: { type: 'integer' },
          notes: { type: 'string' },
          folderId: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            folderId: { type: ['string', 'null'] },
            date: { type: 'string' },
            mealType: { type: 'string' },
            foodName: { type: 'string' },
            calories: { type: ['integer', 'null'] },
            notes: { type: ['string', 'null'] },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { date, mealType, foodName, calories, notes, folderId } = request.body as {
      date: string;
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      foodName: string;
      calories?: number;
      notes?: string;
      folderId?: string;
    };

    const [dietEntry] = await app.db.insert(schema.dietEntries).values({
      userId: session.user.id,
      date: new Date(date),
      mealType,
      foodName,
      calories: calories || null,
      notes: notes || null,
      folderId: folderId || null
    }).returning();

    return reply.status(201).send(dietEntry);
  });

  // PUT /api/diet/:id - Update a diet entry
  app.fastify.put('/api/diet/:id', {
    schema: {
      description: 'Update a diet entry',
      tags: ['diet'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
          foodName: { type: 'string' },
          calories: { type: 'integer' },
          notes: { type: 'string' },
          folderId: { type: ['string', 'null'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            folderId: { type: ['string', 'null'] },
            date: { type: 'string' },
            mealType: { type: 'string' },
            foodName: { type: 'string' },
            calories: { type: ['integer', 'null'] },
            notes: { type: ['string', 'null'] },
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
    const { date, mealType, foodName, calories, notes, folderId } = request.body as {
      date?: string;
      mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      foodName?: string;
      calories?: number;
      notes?: string;
      folderId?: string | null;
    };

    // Verify diet entry ownership
    const dietEntry = await app.db.query.dietEntries.findFirst({
      where: and(
        eq(schema.dietEntries.id, id),
        eq(schema.dietEntries.userId, session.user.id)
      )
    });

    if (!dietEntry) {
      return reply.status(404).send({ error: 'Diet entry not found' });
    }

    const updates: Record<string, any> = {};
    if (date !== undefined) updates.date = new Date(date);
    if (mealType !== undefined) updates.mealType = mealType;
    if (foodName !== undefined) updates.foodName = foodName;
    if (calories !== undefined) updates.calories = calories || null;
    if (notes !== undefined) updates.notes = notes || null;
    if (folderId !== undefined) updates.folderId = folderId || null;

    const [updatedDietEntry] = await app.db.update(schema.dietEntries)
      .set(updates)
      .where(eq(schema.dietEntries.id, id))
      .returning();

    return updatedDietEntry;
  });

  // DELETE /api/diet/:id - Delete a diet entry
  app.fastify.delete('/api/diet/:id', {
    schema: {
      description: 'Delete a diet entry',
      tags: ['diet'],
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

    // Verify diet entry ownership
    const dietEntry = await app.db.query.dietEntries.findFirst({
      where: and(
        eq(schema.dietEntries.id, id),
        eq(schema.dietEntries.userId, session.user.id)
      )
    });

    if (!dietEntry) {
      return reply.status(404).send({ error: 'Diet entry not found' });
    }

    await app.db.delete(schema.dietEntries).where(eq(schema.dietEntries.id, id));
    return reply.status(204).send();
  });
}
