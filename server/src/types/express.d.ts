import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        userType?: "provider" | "customer";
      };
    }
  }
}

export {};
