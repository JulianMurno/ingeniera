const { z } = require('zod');

const tiposValidos = ['FUGA', 'AVERIA', 'ELECTRICA', 'LIMPIEZA_REACTIVA', 'OTRO'];
const prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
const estadosValidos = ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];

const createTicketSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  tipo: z.enum(tiposValidos),
  prioridad: z.enum(prioridadesValidas),
  descripcion: z.string().min(1),
});

const updateTicketSchema = z.object({
  estado: z.enum(estadosValidos).optional(),
  asignadoAId: z.coerce.number().int().positive().nullable().optional(),
  resolucion: z.string().optional(),
});

const ticketQuerySchema = z.object({
  estado: z.enum(estadosValidos).optional(),
  prioridad: z.enum(prioridadesValidas).optional(),
  roomId: z.coerce.number().int().positive().optional(),
  tipo: z.enum(tiposValidos).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  ticketQuerySchema,
  tiposValidos,
  prioridadesValidas,
};
