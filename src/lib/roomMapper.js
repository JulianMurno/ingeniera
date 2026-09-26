const JSON_FIELDS = ['comodidades', 'fotos'];

function serializeList(value) {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

function parseList(value) {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toPersistence(data) {
  return Object.entries(data).reduce((payload, [key, value]) => {
    if (value === undefined) return payload;
    payload[key] = JSON_FIELDS.includes(key) ? serializeList(value) : value;
    return payload;
  }, {});
}

function fromPersistence(room) {
  if (!room) return room;
  const result = { ...room };
  for (const field of JSON_FIELDS) {
    result[field] = parseList(result[field]);
  }
  return result;
}

module.exports = { toPersistence, fromPersistence };
