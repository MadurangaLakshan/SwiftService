import { NextFunction, Request, Response } from "express";
import { verifyFirebaseToken } from "../config/firebase";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const result = await verifyFirebaseToken(token);

    if (!result.success) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = { uid: result.uid!, email: result.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};
