import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerAppointmentRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/appointments - Get all appointments for user with optional date range filtering
  app.fastify.get('/api/appointments', {
    schema: {
      description: 'Get all appointments for the authenticated user',
      tags: ['appointments'],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'ISO date string for start of date range' },
          endDate: { type: 'string', description: 'ISO date string for end of date range' }
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
              title: { type: 'string' },
              description: { type: ['string', 'null'] },
              date: { type: 'string' },
              location: { type: ['string', 'null'] },
              reminderMinutes: { type: 'integer' },
              reminderEnabled: { type: 'boolean' },
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

    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return app.db.select().from(schema.appointments).where(
        and(
          eq(schema.appointments.userId, session.user.id),
          gte(schema.appointments.date, start),
          lte(schema.appointments.date, end)
        )
      );
    }

    return app.db.select().from(schema.appointments).where(
      eq(schema.appointments.userId, session.user.id)
    );
  });

  // GET /api/appointments/:id - Get a specific appointment
  app.fastify.get('/api/appointments/:id', {
    schema: {
      description: 'Get a specific appointment',
      tags: ['appointments'],
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
            title: { type: 'string' },
            description: { type: ['string', 'null'] },
            date: { type: 'string' },
            location: { type: ['string', 'null'] },
            reminderMinutes: { type: 'integer' },
            reminderEnabled: { type: 'boolean' },
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

    const appointment = await app.db.query.appointments.findFirst({
      where: and(
        eq(schema.appointments.id, id),
        eq(schema.appointments.userId, session.user.id)
      )
    });

    if (!appointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }

    return appointment;
  });

  // POST /api/appointments - Create a new appointment
  app.fastify.post('/api/appointments', {
    schema: {
      description: 'Create a new appointment',
      tags: ['appointments'],
      body: {
        type: 'object',
        required: ['title', 'date'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string' },
          location: { type: 'string' },
          reminderMinutes: { type: 'integer' },
          reminderEnabled: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            description: { type: ['string', 'null'] },
            date: { type: 'string' },
            location: { type: ['string', 'null'] },
            reminderMinutes: { type: 'integer' },
            reminderEnabled: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { title, description, date, location, reminderMinutes, reminderEnabled } = request.body as {
      title: string;
      description?: string;
      date: string;
      location?: string;
      reminderMinutes?: number;
      reminderEnabled?: boolean;
    };

    const [appointment] = await app.db.insert(schema.appointments).values({
      userId: session.user.id,
      title,
      description: description || null,
      date: new Date(date),
      location: location || null,
      reminderMinutes: reminderMinutes || 15,
      reminderEnabled: reminderEnabled !== false
    }).returning();

    return reply.status(201).send(appointment);
  });

  // PUT /api/appointments/:id - Update an appointment
  app.fastify.put('/api/appointments/:id', {
    schema: {
      description: 'Update an appointment',
      tags: ['appointments'],
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
          description: { type: 'string' },
          date: { type: 'string' },
          location: { type: 'string' },
          reminderMinutes: { type: 'integer' },
          reminderEnabled: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            description: { type: ['string', 'null'] },
            date: { type: 'string' },
            location: { type: ['string', 'null'] },
            reminderMinutes: { type: 'integer' },
            reminderEnabled: { type: 'boolean' },
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
    const { title, description, date, location, reminderMinutes, reminderEnabled } = request.body as {
      title?: string;
      description?: string;
      date?: string;
      location?: string;
      reminderMinutes?: number;
      reminderEnabled?: boolean;
    };

    // Verify appointment ownership
    const appointment = await app.db.query.appointments.findFirst({
      where: and(
        eq(schema.appointments.id, id),
        eq(schema.appointments.userId, session.user.id)
      )
    });

    if (!appointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description || null;
    if (date !== undefined) updates.date = new Date(date);
    if (location !== undefined) updates.location = location || null;
    if (reminderMinutes !== undefined) updates.reminderMinutes = reminderMinutes;
    if (reminderEnabled !== undefined) updates.reminderEnabled = reminderEnabled;

    const [updatedAppointment] = await app.db.update(schema.appointments)
      .set(updates)
      .where(eq(schema.appointments.id, id))
      .returning();

    return updatedAppointment;
  });

  // DELETE /api/appointments/:id - Delete an appointment
  app.fastify.delete('/api/appointments/:id', {
    schema: {
      description: 'Delete an appointment',
      tags: ['appointments'],
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

    // Verify appointment ownership
    const appointment = await app.db.query.appointments.findFirst({
      where: and(
        eq(schema.appointments.id, id),
        eq(schema.appointments.userId, session.user.id)
      )
    });

    if (!appointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }

    await app.db.delete(schema.appointments).where(eq(schema.appointments.id, id));
    return reply.status(204).send();
  });
}
