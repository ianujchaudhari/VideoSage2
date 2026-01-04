import { signinValidation } from "@/validations/userValidation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface signinBody {
  username: string;
  password: string;
}
export async function POST(req: NextRequest) {
  try {
    console.log("[Signin API] Request received");

    const SECRETKEY = process.env.JWT_SECRET;
    if (!SECRETKEY) {
      console.error("[Signin API] JWT_SECRET is missing from environment");
      return NextResponse.json(
        {
          message: "Internal Server Error",
          debug: "JWT_SECRET missing",
        },
        { status: 500 }
      );
    }

    let body: signinBody;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
      console.error("[Signin API] Error parsing JSON body:", e);
    }

    console.log("[Signin API] Validating body for:", body.username);
    const validatedBody = signinValidation(body);
    const { username, password } = validatedBody;

    console.log("[Signin API] Checking database connection...");
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { username },
      });
    } catch (dbError: unknown) {
      console.error("[Signin API] Database Error:", dbError);
      return NextResponse.json(
        {
          message: "Database connection error",
          debug: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    if (!user) {
      console.log("[Signin API] User not found:", username);
      return NextResponse.json(
        { message: "Invalid username or password!" },
        { status: 401 }
      );
    }

    console.log("[Signin API] Comparing passwords...");
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      console.log("[Signin API] Password incorrect for:", username);
      return NextResponse.json(
        { message: "Invalid username or password!" },
        { status: 401 }
      );
    }

    console.log("[Signin API] Generating JWT...");
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      SECRETKEY,
      { expiresIn: "1d" }
    );

    console.log("[Signin API] Login successful:", username);
    return NextResponse.json(
      {
        message: "Login Successful!",
        user: {
          user_id: user.user_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: user.created_at,
        },
        token: token,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Signin API] Unexpected Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
