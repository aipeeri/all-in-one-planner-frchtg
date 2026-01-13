import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerMediaRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // POST /api/notes/:noteId/media - Upload media to a note
  app.fastify.post('/api/notes/:noteId/media', {
    schema: {
      description: 'Upload media (image or video) to a note',
      tags: ['media'],
      params: {
        type: 'object',
        properties: {
          noteId: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            noteId: { type: 'string' },
            userId: { type: 'string' },
            mediaKey: { type: 'string' },
            mediaType: { type: 'string' },
            filename: { type: 'string' },
            fileSize: { type: ['integer', 'null'] },
            url: { type: 'string' },
            createdAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { noteId } = request.params as { noteId: string };

    // Verify note ownership
    const note = await app.db.query.notes.findFirst({
      where: and(
        eq(schema.notes.id, noteId),
        eq(schema.notes.userId, session.user.id)
      )
    });

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    // Get file from request
    const data = await request.file({
      limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for media
    });

    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch (err) {
      return reply.status(413).send({ error: 'File too large' });
    }

    // Determine media type from mime
    const mimeType = data.mimetype.toLowerCase();
    let mediaType: 'image' | 'video';

    if (mimeType.startsWith('image/')) {
      mediaType = 'image';
    } else if (mimeType.startsWith('video/')) {
      mediaType = 'video';
    } else {
      return reply.status(400).send({ error: 'Invalid file type. Only images and videos are allowed.' });
    }

    // Upload file to storage
    const mediaKey = `media/${session.user.id}/${noteId}/${Date.now()}-${data.filename}`;
    const uploadedKey = await app.storage.upload(mediaKey, buffer);

    // Get signed URL
    const { url } = await app.storage.getSignedUrl(uploadedKey);

    // Save media record to database
    const [media] = await app.db.insert(schema.noteMedia).values({
      noteId,
      userId: session.user.id,
      mediaKey: uploadedKey,
      mediaType,
      filename: data.filename,
      fileSize: buffer.length
    }).returning();

    return reply.status(201).send({
      ...media,
      url
    });
  });

  // GET /api/notes/:noteId/media - Get all media for a note
  app.fastify.get('/api/notes/:noteId/media', {
    schema: {
      description: 'Get all media for a note',
      tags: ['media'],
      params: {
        type: 'object',
        properties: {
          noteId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              noteId: { type: 'string' },
              userId: { type: 'string' },
              mediaKey: { type: 'string' },
              mediaType: { type: 'string' },
              filename: { type: 'string' },
              fileSize: { type: ['integer', 'null'] },
              url: { type: 'string' },
              createdAt: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { noteId } = request.params as { noteId: string };

    // Verify note ownership
    const note = await app.db.query.notes.findFirst({
      where: and(
        eq(schema.notes.id, noteId),
        eq(schema.notes.userId, session.user.id)
      )
    });

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    // Get all media for this note
    const mediaList = await app.db.select().from(schema.noteMedia)
      .where(eq(schema.noteMedia.noteId, noteId));

    // Generate signed URLs for each media
    const mediaWithUrls = await Promise.all(
      mediaList.map(async (m) => {
        const { url } = await app.storage.getSignedUrl(m.mediaKey);
        return { ...m, url };
      })
    );

    return mediaWithUrls;
  });

  // DELETE /api/media/:mediaId - Delete media
  app.fastify.delete('/api/media/:mediaId', {
    schema: {
      description: 'Delete media from a note',
      tags: ['media'],
      params: {
        type: 'object',
        properties: {
          mediaId: { type: 'string' }
        }
      },
      response: {
        204: { type: 'null' }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { mediaId } = request.params as { mediaId: string };

    // Verify media ownership
    const media = await app.db.query.noteMedia.findFirst({
      where: eq(schema.noteMedia.id, mediaId)
    });

    if (!media || media.userId !== session.user.id) {
      return reply.status(404).send({ error: 'Media not found' });
    }

    // Delete from storage
    await app.storage.delete(media.mediaKey);

    // Delete from database
    await app.db.delete(schema.noteMedia).where(eq(schema.noteMedia.id, mediaId));

    return reply.status(204).send();
  });
}
