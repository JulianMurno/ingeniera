/* eslint-env browser */

const API = '/api/v1';

const HK_ESTADOS = [
  'PENDIENTE',
  'EN_PROCESO',
  'LIMPIA',
  'EN_INSPECCION',
  'INSPECCION_OK',
  'INSPECCION_FALLA',
  'CANCELADA',
];
const HK_TIPOS = ['LIMPIEZA', 'LIMPIEZA_PROFUNDA', 'LINNERIA', 'INSPECCION'];
const MT_ESTADOS = ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];
const MT_TIPOS = ['FUGA', 'AVERIA', 'ELECTRICA', 'LIMPIEZA_REACTIVA', 'OTRO'];
const MT_PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

const state = {
  token: localStorage.getItem('hoteToken') || '',
  user: readStoredUser(),
  tab: 'habitaciones',
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('hoteUser') || 'null');
  } catch {
    return null;
  }
}

function el(id) {
  return document.getElementById(id);
}

function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

let toastTimer;
function toast(message, isError = false) {
  const node = el('toast');
  node.textContent = message;
  node.classList.toggle('error', isError);
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.hidden = true;
  }, 3500);
}

function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('hoteToken', token);
  localStorage.setItem('hoteUser', JSON.stringify(user));
}

function clearSession() {
  state.token = '';
  state.user = null;
  localStorage.removeItem('hoteToken');
  localStorage.removeItem('hoteUser');
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const res = await fetch(API + path, { ...options, headers });
  if (res.status === 401) {
    clearSession();
    showLogin();
    throw new Error('Sesión expirada o inválida');
  }
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    const message = data && data.error ? data.error.message : `Error ${res.status}`;
    throw new Error(message);
  }
  return data;
}

function isAdmin() {
  return Boolean(state.user && state.user.rol === 'ADMINISTRADOR');
}

function showLogin() {
  el('login-view').hidden = false;
  el('main-view').hidden = true;
}

function showMain() {
  el('login-view').hidden = true;
  el('main-view').hidden = false;
  el('session-user').textContent = `${state.user.username} · ${state.user.rol}`;
  el('hk-create').hidden = !isAdmin();
}

function populateSelect(select, values, placeholder) {
  const options = placeholder ? [`<option value="">${placeholder}</option>`] : [];
  for (const value of values) {
    options.push(`<option value="${value}">${value}</option>`);
  }
  select.innerHTML = options.join('');
}

function switchTab(tab) {
  state.tab = tab;
  for (const button of document.querySelectorAll('.tab')) {
    button.classList.toggle('active', button.dataset.tab === tab);
  }
  el('panel-habitaciones').hidden = tab !== 'habitaciones';
  el('panel-housekeeping').hidden = tab !== 'housekeeping';
  el('panel-mantenimiento').hidden = tab !== 'mantenimiento';
  if (tab === 'habitaciones') loadRooms();
  if (tab === 'housekeeping') loadHousekeeping();
  if (tab === 'mantenimiento') loadMaintenance();
}

async function loadRooms() {
  try {
    const list = await api('/rooms?page=1&pageSize=100');
    const tbody = el('rooms-table').querySelector('tbody');
    if (!list.data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay habitaciones</td></tr>';
      return;
    }
    tbody.innerHTML = list.data
      .map(
        (room) => `
        <tr>
          <td>${esc(room.numero)}</td>
          <td>${esc(room.tipo)}</td>
          <td>${esc(room.capacidad)}</td>
          <td><span class="badge ${esc(room.estado)}">${esc(room.estado)}</span></td>
          <td>$${Number(room.tarifa).toLocaleString('es-AR')}</td>
          <td><button class="mini" data-action="detail" data-id="${room.id}">Detalle</button></td>
        </tr>`,
      )
      .join('');
  } catch (err) {
    toast(err.message, true);
  }
}

async function showRoomDetail(roomId) {
  try {
    const [room, history] = await Promise.all([
      api(`/rooms/${roomId}`),
      api(`/rooms/${roomId}/housekeeping`),
    ]);
    const rows = history.history
      .map(
        (item) => `
        <tr>
          <td><span class="badge">${esc(item.origen)}</span></td>
          <td>${esc(item.tipo)}</td>
          <td><span class="badge ${esc(item.estado)}">${esc(item.estado)}</span></td>
          <td>${esc(item.prioridad || '—')}</td>
          <td>${fmtDate(item.actualizadoEn || item.creadoEn)}</td>
          <td>${esc(item.observaciones || item.descripcion || '')}</td>
        </tr>`,
      )
      .join('');
    const panel = el('room-detail');
    panel.hidden = false;
    panel.innerHTML = `
      <div class="toolbar">
        <h3>Habitación ${esc(room.numero)} · ${esc(room.tipo)}</h3>
        <button class="mini ghost" data-action="close-detail">Cerrar</button>
      </div>
      <div class="chips">
        <span class="chip">Limpieza: <span class="badge ${esc(room.limpieza)}">${esc(room.limpieza)}</span></span>
        <span class="chip">Incidencias abiertas: <strong>${Number(room.incidenciasAbiertas)}</strong></span>
        <span class="chip">Estado: <span class="badge ${esc(room.estado)}">${esc(room.estado)}</span></span>
      </div>
      <div class="table-wrap">
        <table class="history">
          <thead>
            <tr>
              <th>Origen</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Actividad</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" class="empty">Sin actividad registrada</td></tr>'}</tbody>
        </table>
      </div>`;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    toast(err.message, true);
  }
}

function hkActionButtons(task) {
  const buttons = [];
  const push = (action, label, extra = '') =>
    buttons.push(`<button class="mini ${extra}" data-action="${action}" data-id="${task.id}">${label}</button>`);

  if (task.estado === 'PENDIENTE') {
    push('claim', 'Reclamar');
    if (isAdmin()) push('cancel', 'Cancelar', 'danger');
  } else if (task.estado === 'EN_PROCESO') {
    push('advance', 'Marcar limpia');
    if (isAdmin()) push('cancel', 'Cancelar', 'danger');
  } else if (task.estado === 'LIMPIA') {
    push('advance', 'Enviar a inspección');
    if (isAdmin()) push('cancel', 'Cancelar', 'danger');
  } else if (task.estado === 'EN_INSPECCION') {
    push('ok', 'Inspección OK');
    push('fail', 'Inspección falla');
  } else if (task.estado === 'INSPECCION_FALLA') {
    push('retry', 'Reprocesar');
  }
  return buttons.join('');
}

function nextHkEstado(task, action) {
  if (action === 'claim' || action === 'retry') return 'EN_PROCESO';
  if (action === 'advance') {
    if (task.estado === 'EN_PROCESO') return 'LIMPIA';
    return 'EN_INSPECCION';
  }
  if (action === 'ok') return 'INSPECCION_OK';
  if (action === 'fail') return 'INSPECCION_FALLA';
  if (action === 'cancel') return 'CANCELADA';
  return null;
}

async function loadHousekeeping() {
  try {
    const params = new URLSearchParams();
    const estado = el('hk-filter-estado').value;
    const tipo = el('hk-filter-tipo').value;
    const roomId = el('hk-filter-roomId').value;
    if (estado) params.set('estado', estado);
    if (tipo) params.set('tipo', tipo);
    if (roomId) params.set('roomId', roomId);
    params.set('pageSize', '100');

    const [resumen, list] = await Promise.all([
      api('/housekeeping/resumen'),
      api(`/housekeeping/tasks?${params.toString()}`),
    ]);

    const chips = resumen.porEstado
      .map(
        (item) =>
          `<span class="chip"><span class="badge ${esc(item.estado)}">${esc(item.estado)}</span>: ${item._count}</span>`,
      )
      .join('');
    el('hk-resumen').innerHTML = chips || '<span class="chip">Sin tareas</span>';

    const tbody = el('hk-table').querySelector('tbody');
    if (!list.data.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No hay tareas con esos filtros</td></tr>';
      return;
    }
    tbody.innerHTML = list.data
      .map(
        (task) => `
        <tr>
          <td>${task.id}</td>
          <td>${task.room ? esc(task.room.numero) : task.roomId}</td>
          <td>${esc(task.tipo)}</td>
          <td><span class="badge ${esc(task.estado)}">${esc(task.estado)}</span></td>
          <td>${fmtDate(task.fechaProgramada)}</td>
          <td>${task.asignadoA ? esc(task.asignadoA.username) : '—'}</td>
          <td><div class="actions">${hkActionButtons(task)}</div></td>
        </tr>`,
      )
      .join('');
  } catch (err) {
    toast(err.message, true);
  }
}

async function patchTask(task, action) {
  const estado = nextHkEstado(task, action);
  if (!estado) return;
  const body = { estado };
  if (action === 'claim') body.asignadoAId = state.user.id;
  try {
    await api(`/housekeeping/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    toast(`Tarea ${task.id} → ${estado}`);
    await loadHousekeeping();
  } catch (err) {
    toast(err.message, true);
  }
}

async function createTaskFromForm(event) {
  event.preventDefault();
  const fecha = el('hk-create-fecha').value;
  const body = {
    roomId: Number(el('hk-create-roomId').value),
    tipo: el('hk-create-tipo').value,
    fechaProgramada: new Date(fecha).toISOString(),
  };
  const observaciones = el('hk-create-observaciones').value.trim();
  if (observaciones) body.observaciones = observaciones;
  try {
    const task = await api('/housekeeping/tasks', { method: 'POST', body: JSON.stringify(body) });
    toast(`Tarea ${task.id} creada en PENDIENTE`);
    event.target.reset();
    await loadHousekeeping();
  } catch (err) {
    toast(err.message, true);
  }
}

function mtActionButtons(ticket) {
  const buttons = [];
  const push = (action, label, extra = '') =>
    buttons.push(`<button class="mini ${extra}" data-action="${action}" data-id="${ticket.id}">${label}</button>`);

  if (ticket.estado === 'ABIERTO') {
    push('start', 'Iniciar');
    push('resolve', 'Resolver');
    if (isAdmin()) push('cancel', 'Cancelar', 'danger');
  } else if (ticket.estado === 'EN_PROCESO') {
    push('resolve', 'Resolver');
    if (isAdmin()) push('cancel', 'Cancelar', 'danger');
  }
  return buttons.join('');
}

async function loadMaintenance() {
  try {
    const params = new URLSearchParams();
    const estado = el('mt-filter-estado').value;
    const prioridad = el('mt-filter-prioridad').value;
    const roomId = el('mt-filter-roomId').value;
    if (estado) params.set('estado', estado);
    if (prioridad) params.set('prioridad', prioridad);
    if (roomId) params.set('roomId', roomId);
    params.set('pageSize', '100');

    const list = await api(`/maintenance/tickets?${params.toString()}`);
    const tbody = el('mt-table').querySelector('tbody');
    if (!list.data.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No hay incidencias con esos filtros</td></tr>';
      return;
    }
    tbody.innerHTML = list.data
      .map(
        (ticket) => `
        <tr>
          <td>${ticket.id}</td>
          <td>${ticket.room ? esc(ticket.room.numero) : ticket.roomId}</td>
          <td>${esc(ticket.tipo)}</td>
          <td><span class="badge">${esc(ticket.prioridad)}</span></td>
          <td><span class="badge ${esc(ticket.estado)}">${esc(ticket.estado)}</span></td>
          <td>${esc(ticket.descripcion)}</td>
          <td><div class="actions">${mtActionButtons(ticket)}</div></td>
        </tr>`,
      )
      .join('');
  } catch (err) {
    toast(err.message, true);
  }
}

async function patchTicket(id, body) {
  try {
    const ticket = await api(`/maintenance/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    toast(`Incidencia ${id} → ${ticket.estado}`);
    await loadMaintenance();
  } catch (err) {
    toast(err.message, true);
  }
}

async function handleTicketAction(action, id) {
  if (action === 'start') return patchTicket(id, { estado: 'EN_PROCESO' });
  if (action === 'cancel') {
    if (!window.confirm(`¿Cancelar la incidencia ${id}?`)) return;
    return patchTicket(id, { estado: 'CANCELADO' });
  }
  if (action === 'resolve') {
    const resolucion = window.prompt('Resolución de la incidencia:');
    if (!resolucion || !resolucion.trim()) return;
    return patchTicket(id, { estado: 'RESUELTO', resolucion: resolucion.trim() });
  }
  return undefined;
}

async function createTicketFromForm(event) {
  event.preventDefault();
  const body = {
    roomId: Number(el('mt-create-roomId').value),
    tipo: el('mt-create-tipo').value,
    prioridad: el('mt-create-prioridad').value,
    descripcion: el('mt-create-descripcion').value.trim(),
  };
  try {
    const ticket = await api('/maintenance/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    toast(`Incidencia ${ticket.id} creada en ABIERTO`);
    event.target.reset();
    await loadMaintenance();
  } catch (err) {
    toast(err.message, true);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const errorNode = el('login-error');
  errorNode.hidden = true;
  try {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: el('login-username').value.trim(),
        password: el('login-password').value,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data && data.error ? data.error.message : `Error ${res.status}`);
    }
    saveSession(data.token, data.user);
    showMain();
    switchTab('habitaciones');
  } catch (err) {
    errorNode.textContent = err.message;
    errorNode.hidden = false;
  }
}

async function handleLogout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch {
    // La sesión local se limpia de todos modos
  }
  clearSession();
  showLogin();
}

function bindEvents() {
  el('login-form').addEventListener('submit', handleLogin);
  el('logout-btn').addEventListener('click', handleLogout);

  for (const button of document.querySelectorAll('.tab')) {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  }

  el('rooms-refresh').addEventListener('click', loadRooms);
  el('hk-refresh').addEventListener('click', loadHousekeeping);
  el('mt-refresh').addEventListener('click', loadMaintenance);

  el('rooms-table').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="detail"]');
    if (button) showRoomDetail(Number(button.dataset.id));
  });
  el('room-detail').addEventListener('click', (event) => {
    if (event.target.closest('button[data-action="close-detail"]')) {
      el('room-detail').hidden = true;
    }
  });

  el('hk-filters').addEventListener('submit', (event) => {
    event.preventDefault();
    loadHousekeeping();
  });
  el('hk-create').addEventListener('submit', createTaskFromForm);
  el('hk-table').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const row = button.closest('tr');
    const id = Number(button.dataset.id);
    const task = row
      ? { id, estado: row.querySelector('.badge').textContent.trim() }
      : null;
    if (!task) return;
    if (button.dataset.action === 'cancel') {
      if (!window.confirm(`¿Cancelar la tarea ${id}?`)) return;
    }
    await patchTask(task, button.dataset.action);
  });

  el('mt-filters').addEventListener('submit', (event) => {
    event.preventDefault();
    loadMaintenance();
  });
  el('mt-create').addEventListener('submit', createTicketFromForm);
  el('mt-table').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    await handleTicketAction(button.dataset.action, Number(button.dataset.id));
  });
}

function init() {
  populateSelect(el('hk-filter-estado'), HK_ESTADOS, 'Todos');
  populateSelect(el('hk-filter-tipo'), HK_TIPOS, 'Todos');
  populateSelect(el('hk-create-tipo'), HK_TIPOS);
  populateSelect(el('mt-filter-estado'), MT_ESTADOS, 'Todos');
  populateSelect(el('mt-filter-prioridad'), MT_PRIORIDADES, 'Todas');
  populateSelect(el('mt-create-tipo'), MT_TIPOS);
  populateSelect(el('mt-create-prioridad'), MT_PRIORIDADES);
  bindEvents();

  if (state.token && state.user) {
    showMain();
    switchTab('habitaciones');
  } else {
    showLogin();
  }
}

init();
