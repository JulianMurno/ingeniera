require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = bcrypt.hashSync(process.env.SEED_PASSWORD || '123456', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { activo: true },
    create: { username: 'admin', password, rol: 'ADMINISTRADOR', activo: true },
  });

  await prisma.user.upsert({
    where: { username: 'recepcionista' },
    update: { activo: true },
    create: { username: 'recepcionista', password, rol: 'RECEPCIONISTA', activo: true },
  });

  const guestEmail = 'huesped@hotel.local';
  const guestPassword = bcrypt.hashSync(process.env.SEED_GUEST_PASSWORD || 'huesped123', 10);
  const guest = await prisma.guest.upsert({
    where: { dni: '12345678Z' },
    update: {
      nombre: 'Huésped Demo',
      email: guestEmail,
      telefono: '600111222',
      activo: true,
    },
    create: {
      nombre: 'Huésped Demo',
      email: guestEmail,
      dni: '12345678Z',
      telefono: '600111222',
    },
  });

  await prisma.user.upsert({
    where: { username: guestEmail },
    update: { password: guestPassword, rol: 'HUESPED', activo: true, guestId: guest.id },
    create: {
      username: guestEmail,
      password: guestPassword,
      rol: 'HUESPED',
      activo: true,
      guestId: guest.id,
    },
  });

  const catalogo = [
    {
      codigo: 'ROOM-SERVICE',
      nombre: 'Room service',
      categoria: 'ALIMENTOS',
      precio: 1500,
      unidad: 'POR_UNIDAD',
      descripcion: 'Servicio de comidas y bebidas a la habitación',
    },
    {
      codigo: 'LAVANDERIA',
      nombre: 'Lavandería',
      categoria: 'LAVANDERIA',
      precio: 800,
      unidad: 'POR_UNIDAD',
      descripcion: 'Lavado y planchado de prendas',
    },
    {
      codigo: 'MINIBAR',
      nombre: 'Minibar',
      categoria: 'ALIMENTOS',
      precio: 500,
      unidad: 'POR_UNIDAD',
      descripcion: 'Consumo del minibar de la habitación',
    },
    {
      codigo: 'PARKING',
      nombre: 'Parking',
      categoria: 'TRANSPORTE',
      precio: 1200,
      unidad: 'NOCHE',
      descripcion: 'Estacionamiento por noche',
    },
    {
      codigo: 'LATE-CHECKOUT',
      nombre: 'Late check-out',
      categoria: 'SERVICIOS',
      precio: 3000,
      unidad: 'ESTANCIA',
      descripcion: 'Salida tardía de la habitación',
    },
  ];

  for (const extra of catalogo) {
    await prisma.hotelExtra.upsert({
      where: { codigo: extra.codigo },
      update: {
        nombre: extra.nombre,
        categoria: extra.categoria,
        precio: extra.precio,
        unidad: extra.unidad,
        descripcion: extra.descripcion,
      },
      create: extra,
    });
  }

  console.log('Usuarios sembrados: admin (ADMINISTRADOR) y recepcionista (RECEPCIONISTA)');
  console.log(`Huésped sembrado: ${guestEmail} (HUESPED, DNI 12345678Z)`);
  console.log(`Catálogo de servicios sembrado: ${catalogo.length} extras`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
