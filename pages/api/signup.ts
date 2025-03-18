/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { getVerificationEmailTemplate } from "@/lib/emailTemplates";
const EMAIL = process.env.EMAIL;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    // Hash password and create verification token
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expires in 24 hours
    try {
      await db.collection("users").insertOne({
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        isVerified: false,
        verificationToken,
        verificationExpires,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }
      throw error;
    }
    // response immediately
    res.status(201).json({
      success: true,
      message: "User created successfully. Please check your email.",
    });

    // Email transporter configuration
    setImmediate(async () => {
      try {
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: EMAIL,
            pass: EMAIL_PASSWORD,
          },
        });

        // Send verification email
        const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${verificationToken}`;
        const mailOptions = {
          from: EMAIL,
          to: email,
          subject: "Verify Your Email",
          html: getVerificationEmailTemplate(name, verificationUrl),
        };

        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.log("email sending error", error);
      }
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
