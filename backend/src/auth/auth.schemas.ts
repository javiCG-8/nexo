import { z } from 'zod';

export const loginSchema = z.strictObject({
  organizationSlug: z.string().trim().toLowerCase().min(1, 'Organización requerida').max(63)
    .regex(/^[a-z0-9-]+$/, 'Organización no válida'),
  email: z.email({ error: 'Correo no válido' }).trim().max(254),
  password: z.string().min(1, 'Contraseña requerida').max(128)
});

export type LoginInput = z.infer<typeof loginSchema>;
