
declare namespace Express {
  interface User {
    id: string;
    email: string;
    name: string | null;
    sessionId?: string;
  }
}
