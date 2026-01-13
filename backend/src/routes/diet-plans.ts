import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerDietPlanRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/diet-plans - Get all diet plans for user
  app.fastify.get('/api/diet-plans', {
    schema: {
      description: 'Get all diet plans for the authenticated user',
      tags: ['diet-plans'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              name: { type: 'string' },
              goal: { type: 'string' },
              dailyCalorieTarget: { type: ['integer', 'null'] },
              dailyProteinTarget: { type: ['integer', 'null'] },
              dailyWaterTarget: { type: ['integer', 'null'] },
              notes: { type: ['string', 'null'] },
              isActive: { type: 'boolean' },
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

    return app.db.select().from(schema.dietPlans).where(
      eq(schema.dietPlans.userId, session.user.id)
    );
  });

  // GET /api/diet-plans/active - Get the currently active diet plan
  app.fastify.get('/api/diet-plans/active', {
    schema: {
      description: 'Get the currently active diet plan',
      tags: ['diet-plans'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            goal: { type: 'string' },
            dailyCalorieTarget: { type: ['integer', 'null'] },
            dailyProteinTarget: { type: ['integer', 'null'] },
            dailyWaterTarget: { type: ['integer', 'null'] },
            notes: { type: ['string', 'null'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const activePlan = await app.db.query.dietPlans.findFirst({
      where: and(
        eq(schema.dietPlans.userId, session.user.id),
        eq(schema.dietPlans.isActive, true)
      )
    });

    if (!activePlan) {
      return reply.status(404).send({ error: 'No active diet plan' });
    }

    return activePlan;
  });

  // GET /api/diet-plans/:id - Get a specific diet plan
  app.fastify.get('/api/diet-plans/:id', {
    schema: {
      description: 'Get a specific diet plan',
      tags: ['diet-plans'],
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
            name: { type: 'string' },
            goal: { type: 'string' },
            dailyCalorieTarget: { type: ['integer', 'null'] },
            dailyProteinTarget: { type: ['integer', 'null'] },
            dailyWaterTarget: { type: ['integer', 'null'] },
            notes: { type: ['string', 'null'] },
            isActive: { type: 'boolean' },
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

    const plan = await app.db.query.dietPlans.findFirst({
      where: and(
        eq(schema.dietPlans.id, id),
        eq(schema.dietPlans.userId, session.user.id)
      )
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Diet plan not found' });
    }

    return plan;
  });

  // POST /api/diet-plans - Create a new diet plan (sets as active, deactivates others)
  app.fastify.post('/api/diet-plans', {
    schema: {
      description: 'Create a new diet plan',
      tags: ['diet-plans'],
      body: {
        type: 'object',
        required: ['name', 'goal'],
        properties: {
          name: { type: 'string' },
          goal: { type: 'string', enum: ['lose weight', 'gain muscle', 'maintain', 'custom'] },
          dailyCalorieTarget: { type: 'integer' },
          dailyProteinTarget: { type: 'integer' },
          dailyWaterTarget: { type: 'integer' },
          notes: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            goal: { type: 'string' },
            dailyCalorieTarget: { type: ['integer', 'null'] },
            dailyProteinTarget: { type: ['integer', 'null'] },
            dailyWaterTarget: { type: ['integer', 'null'] },
            notes: { type: ['string', 'null'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { name, goal, dailyCalorieTarget, dailyProteinTarget, dailyWaterTarget, notes } = request.body as {
      name: string;
      goal: 'lose weight' | 'gain muscle' | 'maintain' | 'custom';
      dailyCalorieTarget?: number;
      dailyProteinTarget?: number;
      dailyWaterTarget?: number;
      notes?: string;
    };

    // Deactivate all other plans for this user
    await app.db.update(schema.dietPlans)
      .set({ isActive: false })
      .where(eq(schema.dietPlans.userId, session.user.id));

    // Create new plan as active
    const [plan] = await app.db.insert(schema.dietPlans).values({
      userId: session.user.id,
      name,
      goal,
      dailyCalorieTarget: dailyCalorieTarget || null,
      dailyProteinTarget: dailyProteinTarget || null,
      dailyWaterTarget: dailyWaterTarget || null,
      notes: notes || null,
      isActive: true
    }).returning();

    return reply.status(201).send(plan);
  });

  // PUT /api/diet-plans/:id - Update a diet plan
  app.fastify.put('/api/diet-plans/:id', {
    schema: {
      description: 'Update a diet plan',
      tags: ['diet-plans'],
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
          goal: { type: 'string', enum: ['lose weight', 'gain muscle', 'maintain', 'custom'] },
          dailyCalorieTarget: { type: 'integer' },
          dailyProteinTarget: { type: 'integer' },
          dailyWaterTarget: { type: 'integer' },
          notes: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            goal: { type: 'string' },
            dailyCalorieTarget: { type: ['integer', 'null'] },
            dailyProteinTarget: { type: ['integer', 'null'] },
            dailyWaterTarget: { type: ['integer', 'null'] },
            notes: { type: ['string', 'null'] },
            isActive: { type: 'boolean' },
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
    const { name, goal, dailyCalorieTarget, dailyProteinTarget, dailyWaterTarget, notes, isActive } = request.body as {
      name?: string;
      goal?: 'lose weight' | 'gain muscle' | 'maintain' | 'custom';
      dailyCalorieTarget?: number;
      dailyProteinTarget?: number;
      dailyWaterTarget?: number;
      notes?: string;
      isActive?: boolean;
    };

    // Verify plan ownership
    const plan = await app.db.query.dietPlans.findFirst({
      where: and(
        eq(schema.dietPlans.id, id),
        eq(schema.dietPlans.userId, session.user.id)
      )
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Diet plan not found' });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (goal !== undefined) updates.goal = goal;
    if (dailyCalorieTarget !== undefined) updates.dailyCalorieTarget = dailyCalorieTarget || null;
    if (dailyProteinTarget !== undefined) updates.dailyProteinTarget = dailyProteinTarget || null;
    if (dailyWaterTarget !== undefined) updates.dailyWaterTarget = dailyWaterTarget || null;
    if (notes !== undefined) updates.notes = notes || null;

    // If setting this plan to active, deactivate others
    if (isActive) {
      await app.db.update(schema.dietPlans)
        .set({ isActive: false })
        .where(eq(schema.dietPlans.userId, session.user.id));
      updates.isActive = true;
    } else if (isActive === false) {
      updates.isActive = false;
    }

    const [updatedPlan] = await app.db.update(schema.dietPlans)
      .set(updates)
      .where(eq(schema.dietPlans.id, id))
      .returning();

    return updatedPlan;
  });

  // DELETE /api/diet-plans/:id - Delete a diet plan
  app.fastify.delete('/api/diet-plans/:id', {
    schema: {
      description: 'Delete a diet plan',
      tags: ['diet-plans'],
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

    // Verify plan ownership
    const plan = await app.db.query.dietPlans.findFirst({
      where: and(
        eq(schema.dietPlans.id, id),
        eq(schema.dietPlans.userId, session.user.id)
      )
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Diet plan not found' });
    }

    await app.db.delete(schema.dietPlans).where(eq(schema.dietPlans.id, id));
    return reply.status(204).send();
  });
}
