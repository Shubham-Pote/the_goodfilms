import type { Request, Response } from "express";
import { AuthService } from "../services/authService.js";
import { signupSchema, loginSchema } from "../schemas/index.js";

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const body = signupSchema.parse(req.body);
      const result = await AuthService.signup(body);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Username already exists") {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid data", details: error });
      }
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const body = loginSchema.parse(req.body);
      const result = await AuthService.login(body);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Invalid credentials") {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid data", details: error });
      }
    }
  }
}
