// tredex-backend/src/types/express-session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string; // Add other session variables here if needed
  }
}
