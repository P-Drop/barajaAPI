declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      routePrefix?: string;
    }
  }
}

export {};
