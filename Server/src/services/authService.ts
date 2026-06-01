import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import type { SignupInput, LoginInput } from "../schemas";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export class AuthService {
  static async signup(data: SignupInput) {
    const existingUser = await prisma.user.findFirst({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    return { token, user: { id: user.id, username: user.username, role: user.role } };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findFirst({
      where: { username: data.username },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    return { token, user: { id: user.id, username: user.username, role: user.role } };
  }
}
