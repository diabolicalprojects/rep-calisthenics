import { z } from 'zod';

export const ExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().optional(),
  recorded_by: z.string().optional()
});

export const TransactionSchema = z.object({
  total_amount: z.number().nonnegative(),
  payment_method: z.string(),
  cashier_name: z.string().optional(),
  register_id: z.string().uuid().optional(),
  type: z.string().optional(),
  items: z.array(z.any()).optional()
});

export const MemberSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  plan: z.string(),
  status: z.enum(['Activo', 'Inactivo']).optional(),
  joinDate: z.string().optional(),
  cutoffDate: z.string().optional()
});

export const UserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6).optional(), // Optional for updates
  role: z.enum(['developer', 'admin', 'coach']),
  permissions: z.record(z.boolean()).optional()
});

export const InventorySchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().nonnegative(),
  category: z.string().optional()
});
