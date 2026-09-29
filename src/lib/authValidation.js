import { z } from "zod";

export const signinSchema = z.object({
    usernameOrEmail: z
        .string()
        .trim()
        .min(1, "Enter your username or email")
        .transform((value) => value.toLowerCase()),
    password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters"),
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only")
        .transform((value) => value.toLowerCase()),
    jobTitle: z
        .string()
        .trim()
        .min(2, "Job title must be at least 2 characters"),
    gender: z.enum(["male", "female", "other"], {
        errorMap: () => ({ message: "Please select a gender" }),
    }),
    dateOfBirth: z
        .string()
        .min(1, "Birthdate is required")
        .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date")
        .refine((value) => new Date(value) <= new Date(), "Birthdate can't be in the future"),
    location: z
        .string()
        .trim()
        .min(2, "Location must be at least 2 characters")
        .regex(/^[^,]+,\s*[^,]+$/, "Location must be in the format City, Country"),
    email: z
        .string()
        .trim()
        .email("Enter a valid email")
        .transform((value) => value.toLowerCase()),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters"),
});
