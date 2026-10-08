const { z } = require('zod');

const tiposValidos = ['LIMPIEZA', 'LIMPIEZA_PROFUNDA', 'LINNERIA', 'INSPECCION'];
const estadosValidos = [
  'PENDIENTE',
  'EN_PROCESO',
  'LIMPIA',
  'EN_INSPECCION',
  'INSPECCION_OK',
  'INSPECCION_FALLA',
  'CANCELADA',
];

const createTaskSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  tipo: z.enum(tiposValidos),
  fechaProgramada: z.coerce.date(),
  asignadoAId: z.coerce.number().int().positive().optional(),
  observaciones: z.string().optional(),
});

const updateTaskSchema = z.object({
  estado: z.enum(estadosValidos).optional(),
  asignadoAId: z.coerce.number().int().positive().nullable().optional(),
  observaciones: z.string().optional(),
  fechaProgramada: z.coerce.date().optional(),
});

const taskQuerySchema = z.object({
  estado: z.enum(estadosValidos).optional(),
  tipo: z.enum(tiposValidos).optional(),
  roomId: z.coerce.number().int().positive().optional(),
  asignadoAId: z.coerce.number().int().positive().optional(),
  fecha: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const resumenQuerySchema = z.object({
  fecha: z.string().optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  resumenQuerySchema,
};
