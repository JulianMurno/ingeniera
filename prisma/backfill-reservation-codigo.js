require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { generateReservationCode, normalizeCode } = require('../src/lib/reservationCode');

const prisma = new PrismaClient();
const MAX_ATTEMPTS = 20;

async function main() {
  const existentes = await prisma.reservation.findMany({
    where: { OR: [{ codigo: null }, { codigo: '' }] },
    orderBy: { id: 'asc' },
  });

  if (existentes.length === 0) {
    console.log('No hay reservas sin código: nada que completar.');
    return;
  }

  const tomados = new Set(
    (
      await prisma.reservation.findMany({
        where: { codigo: { not: null } },
        select: { codigo: true },
      })
    )
      .map((row) => normalizeCode(row.codigo))
      .filter(Boolean),
  );

  let asignados = 0;
  for (const reserva of existentes) {
    let codigo = null;
    for (let intento = 0; intento < MAX_ATTEMPTS && codigo === null; intento += 1) {
      const candidato = generateReservationCode();
      if (!tomados.has(candidato)) {
        codigo = candidato;
      }
    }
    if (codigo === null) {
      throw new Error(`No se pudo generar un código único para la reserva ${reserva.id}`);
    }
    await prisma.reservation.update({ where: { id: reserva.id }, data: { codigo } });
    tomados.add(codigo);
    asignados += 1;
  }

  console.log(`Códigos de confirmación asignados: ${asignados}`);
}

function verificar() {
  return Promise.all([
    prisma.reservation.count({ where: { OR: [{ codigo: null }, { codigo: '' }] } }),
    prisma.reservation.findMany({ select: { codigo: true } }),
  ]).then(([nulos, rows]) => {
    const codigos = rows.map((row) => normalizeCode(row.codigo)).filter(Boolean);
    const duplicados = codigos.filter((codigo, i) => codigos.indexOf(codigo) !== i);
    if (nulos > 0 || duplicados.length > 0) {
      throw new Error(
        `Backfill incompleto: ${nulos} reserva(s) sin código y ${duplicados.length} código(s) duplicados`,
      );
    }
    console.log(`Verificación OK: ${codigos.length} reserva(s) con código único.`);
  });
}

main()
  .then(verificar)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
