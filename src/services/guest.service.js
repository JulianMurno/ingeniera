const guestRepo = require('../repositories/guest.repository');
const { HttpError } = require('../lib/httpError');

async function createGuest(data) {
  const existing = await guestRepo.findByDni(data.dni);
  if (existing) {
    throw new HttpError(409, 'CONFLICT', 'Ya existe un huésped con ese DNI');
  }
  return guestRepo.create(data);
}

async function listGuests(params) {
  return guestRepo.findMany(params);
}

async function getGuest(id) {
  const guest = await guestRepo.findActiveById(id);
  if (!guest) {
    throw new HttpError(404, 'NOT_FOUND', 'Huésped no encontrado');
  }
  return guest;
}

async function updateGuest(id, data) {
  await getGuest(id);
  if (data.dni !== undefined) {
    const duplicate = await guestRepo.findByDniExcluding(data.dni, id);
    if (duplicate) {
      throw new HttpError(409, 'CONFLICT', 'Ya existe un huésped con ese DNI');
    }
  }
  return guestRepo.update(id, data);
}

async function deleteGuest(id) {
  await getGuest(id);
  return guestRepo.archive(id);
}

module.exports = { createGuest, listGuests, getGuest, updateGuest, deleteGuest };
