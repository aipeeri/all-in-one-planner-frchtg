import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerCalendarRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/calendar/events - Get calendar events for a date range (appointments and diet entries)
  app.fastify.get('/api/calendar/events', {
    schema: {
      description: 'Get calendar events (appointments and diet entries) for a date range',
      tags: ['calendar'],
      querystring: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          startDate: { type: 'string', description: 'ISO date string for start of date range' },
          endDate: { type: 'string', description: 'ISO date string for end of date range' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            appointments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string', enum: ['appointment'] },
                  title: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  date: { type: 'string' },
                  location: { type: ['string', 'null'] },
                  reminderMinutes: { type: 'integer' },
                  reminderEnabled: { type: 'boolean' }
                }
              }
            },
            dietEntries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string', enum: ['diet'] },
                  date: { type: 'string' },
                  mealType: { type: 'string' },
                  foodName: { type: 'string' },
                  calories: { type: ['integer', 'null'] }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { startDate, endDate } = request.query as { startDate: string; endDate: string };

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get appointments
    const appointments = await app.db.select().from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.userId, session.user.id),
          gte(schema.appointments.date, start),
          lte(schema.appointments.date, end)
        )
      );

    // Get diet entries
    const dietEntries = await app.db.select().from(schema.dietEntries)
      .where(
        and(
          eq(schema.dietEntries.userId, session.user.id),
          gte(schema.dietEntries.date, start),
          lte(schema.dietEntries.date, end)
        )
      );

    return {
      appointments: appointments.map(apt => ({
        ...apt,
        type: 'appointment'
      })),
      dietEntries: dietEntries.map(entry => ({
        ...entry,
        type: 'diet'
      }))
    };
  });

  // GET /api/calendar/day/:date - Get detailed view for a specific day
  app.fastify.get('/api/calendar/day/:date', {
    schema: {
      description: 'Get detailed calendar view for a specific day',
      tags: ['calendar'],
      params: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'ISO date string (YYYY-MM-DD)' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            appointments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  date: { type: 'string' },
                  location: { type: ['string', 'null'] },
                  reminderMinutes: { type: 'integer' },
                  reminderEnabled: { type: 'boolean' }
                }
              }
            },
            dietEntries: {
              type: 'object',
              properties: {
                breakfast: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      foodName: { type: 'string' },
                      calories: { type: ['integer', 'null'] },
                      notes: { type: ['string', 'null'] }
                    }
                  }
                },
                lunch: { type: 'array' },
                dinner: { type: 'array' },
                snack: { type: 'array' }
              }
            },
            dailyStats: {
              type: 'object',
              properties: {
                totalCalories: { type: 'integer' },
                mealCount: { type: 'integer' },
                appointmentCount: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { date } = request.params as { date: string };

    // Parse the date and create start/end boundaries for the day
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    // Get appointments for the day
    const appointments = await app.db.select().from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.userId, session.user.id),
          gte(schema.appointments.date, dayStart),
          lte(schema.appointments.date, dayEnd)
        )
      );

    // Get diet entries for the day
    const dietEntries = await app.db.select().from(schema.dietEntries)
      .where(
        and(
          eq(schema.dietEntries.userId, session.user.id),
          gte(schema.dietEntries.date, dayStart),
          lte(schema.dietEntries.date, dayEnd)
        )
      );

    // Group diet entries by meal type
    const dietByMeal = {
      breakfast: dietEntries.filter(e => e.mealType === 'breakfast'),
      lunch: dietEntries.filter(e => e.mealType === 'lunch'),
      dinner: dietEntries.filter(e => e.mealType === 'dinner'),
      snack: dietEntries.filter(e => e.mealType === 'snack')
    };

    // Calculate daily stats
    const totalCalories = dietEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
    const mealCount = dietEntries.length;
    const appointmentCount = appointments.length;

    return {
      date,
      appointments,
      dietEntries: dietByMeal,
      dailyStats: {
        totalCalories,
        mealCount,
        appointmentCount
      }
    };
  });

  // GET /api/calendar/month/:yearMonth - Get overview for a specific month
  app.fastify.get('/api/calendar/month/:yearMonth', {
    schema: {
      description: 'Get calendar overview for a specific month',
      tags: ['calendar'],
      params: {
        type: 'object',
        properties: {
          yearMonth: { type: 'string', description: 'Month in YYYY-MM format' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            month: { type: 'string' },
            days: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  appointmentCount: { type: 'integer' },
                  totalCalories: { type: 'integer' },
                  mealCount: { type: 'integer' },
                  hasEvents: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { yearMonth } = request.params as { yearMonth: string };

    // Parse year and month
    const [year, month] = yearMonth.split('-').map(Number);
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Get all appointments and diet entries for the month
    const appointments = await app.db.select().from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.userId, session.user.id),
          gte(schema.appointments.date, monthStart),
          lte(schema.appointments.date, monthEnd)
        )
      );

    const dietEntries = await app.db.select().from(schema.dietEntries)
      .where(
        and(
          eq(schema.dietEntries.userId, session.user.id),
          gte(schema.dietEntries.date, monthStart),
          lte(schema.dietEntries.date, monthEnd)
        )
      );

    // Build a map of days with event counts
    const daysMap = new Map<string, {
      appointmentCount: number;
      totalCalories: number;
      mealCount: number;
    }>();

    // Process appointments
    appointments.forEach(apt => {
      const dateStr = apt.date.toISOString().split('T')[0];
      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, { appointmentCount: 0, totalCalories: 0, mealCount: 0 });
      }
      const day = daysMap.get(dateStr)!;
      day.appointmentCount += 1;
    });

    // Process diet entries
    dietEntries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0];
      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, { appointmentCount: 0, totalCalories: 0, mealCount: 0 });
      }
      const day = daysMap.get(dateStr)!;
      day.totalCalories += entry.calories || 0;
      day.mealCount += 1;
    });

    // Convert map to array
    const days = Array.from(daysMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
      hasEvents: stats.appointmentCount > 0 || stats.mealCount > 0
    }));

    return {
      month: yearMonth,
      days: days.sort((a, b) => a.date.localeCompare(b.date))
    };
  });
}
