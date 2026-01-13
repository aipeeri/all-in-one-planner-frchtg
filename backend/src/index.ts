import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import { registerFolderRoutes } from './routes/folders.js';
import { registerNotesRoutes } from './routes/notes.js';
import { registerMediaRoutes } from './routes/media.js';
import { registerAppointmentRoutes } from './routes/appointments.js';
import { registerDietRoutes } from './routes/diet.js';

// Combine app schema with auth schema
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

// Enable storage for media uploads
app.withStorage();

// Register all route modules
registerFolderRoutes(app);
registerNotesRoutes(app);
registerMediaRoutes(app);
registerAppointmentRoutes(app);
registerDietRoutes(app);

await app.run();
app.logger.info('Application running with all routes registered');
