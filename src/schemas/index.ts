import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const RoleEnum = z.enum(["DOCTOR", "USER", "PHARMACY_STAFF", "ADMIN"]);

// Frontend validation schema (not used in backend)
export const PasswordConfirmationSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Backend schemas (without confirmPassword)
export const UserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  contactNo: z.string().min(10, "Contact number must be 10 digits"),
  role: RoleEnum.default("USER"),
  image: z.union([
    z.string().url().optional(),
    z.custom<File>((file) => file instanceof File, {
      message: "Image must be a file",
    }),
  ]),
});

export const DoctorSchema = z.object({
  licenseNumber: z
    .string()
    .min(5, "License number must be at least 5 characters"),
  name: z.string().min(3, "Full name must be at least 3 characters"),
  contactNo: z.string().min(10, "Contact number must be 10 digits"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  speciality: z.string().min(3, "Speciality must be at least 3 characters"),
  role: RoleEnum.default("DOCTOR"),
  group: z.string().optional(),
  organisationName: z
    .string()
    .min(3, "Organisation name must be at least 3 characters"),
  image: z.union([
    z.string().url().optional(),
    z.custom<File>((file) => file instanceof File, {
      message: "Image must be a file",
    }),
  ]),
});

export const ForgetPasswordSchema = z.object({
  email: z.string().email(),
});

export const CategorySchema = z.object({
  name: z.string().min(3, "Category name must be at least 3 characters"),
  parentId: z.string().optional(),
});
export const ProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number()
      .int("Price must be a non decimal number")
      .positive("Price must be greater than zero")
      .min(1, "Price must be at least 1")
  ),
  categoryId: z.string().uuid().optional(),
  subCategory: z.string().optional(),
  availability: z.enum(["IN_STOCK", "OUT_OF_STOCK"]),
  requiresPrescription: z.boolean().default(false),
  details: z.string().optional(),
  medicineCode: z.string().min(1, "Medicine Code name must be required"),
  weight: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number()
      .positive("Weight must be greater than zero")
      .min(0.01, "Weight must be at least 0.01")
  ),
  imageUrl: z.union([
    z.string().url().optional(),
    z.custom<File>((file) => file instanceof File, {
      message: "Image must be a file",
    }),
  ]),
});

export const AddressSchema = z.object({
  addressLine: z
    .string()
    .min(5, "Address line must be at least 5 characters long"),
  town: z.string().min(2, "Town must be at least 2 characters long"),
  municipality: z
    .string()
    .min(2, "Municipality must be at least 2 characters long"),
  province: z.string().min(2, "Province must be at least 2 characters long"),
  country: z.string().default("Cuba"),
  manualInstructions: z.string().optional(),
});

export const PatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email().optional().or(z.literal("")), 
  phone: z.string().optional(), 
  birthDate: z.string().optional(),
});
