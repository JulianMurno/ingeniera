'use client';

import { useState } from 'react';
import { api, todayISO } from '@/lib/api';
import {
  Btn,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Msg,
  Select,
  Table,
  fmtDate,
  fmtMoney,
  DIAS,
  ROOM_TYPES,
} from '@/components/ui';
import { useData } from '@/lib/useData';

export default function TarifasPage() {
  const [tab, setTab] = useState('seasons');
  return (
    <>
      <h1>Tarifas</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        <Btn variant={tab === 'seasons' ? 'primary' : ''} onClick={() => setTab('seasons')}>
          Temporadas
        </Btn>
        <Btn variant={tab === 'weekdays' ? 'primary' : ''} onClick={() => setTab('weekdays')}>
          Días de semana
        </Btn>
        <Btn variant={tab === 'quote' ? 'primary' : ''} onClick={() => setTab('quote')}>
          Cotización
        </Btn>
      </div>
      {tab === 'seasons' && <Seasons />}
      {tab === 'weekdays' && <Weekdays />}
      {tab === 'quote' && <Quote />}
    </>
  );
}

function Seasons() {
  const [filtro, setFiltro] = useState('');
  const { data, loading, error, reload } = useData(
    `/api/v1/rates/seasons${filtro ? `?roomType=${filtro}` : ''}`,
  );
  const [form, setForm] = useState({
    roomType: 'SINGLE',
    fechaInicio: todayISO(),
    fechaFin: todayISO(),
    tarifa: '',
  });
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setOk('');
    try {
      await api('/api/v1/rates/seasons', {
        method: 'POST',
        body: { ...form, tarifa: Number(form.tarifa) },
      });
      setOk('Temporada creada.');
      reload();
    } catch (errApi) {
      setErr(errApi);
    }
  }

  async function eliminar(s) {
    if (!window.confirm('Eliminar la temporada?')) return;
    try {
      await api(`/api/v1/rates/seasons/${s.id}`, { method: 'DELETE' });
      reload();
    } catch (errApi) {
      window.alert(errApi.message);
    }
  }

  return (
    <div className="grid grid-2">
      <Card title="Nueva temporada">
        <ErrorMsg error={err} />
        <Msg>{ok}</Msg>
        <form onSubmit={submit}>
          <Field label="Tipo de habitación">
            <Select value={form.roomType} onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))}>
              {Object.values(ROOM_TYPES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <div className="row">
            <Field label="Inicio">
              <Input type="date" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))} required />
            </Field>
            <Field label="Fin (excluido)">
              <Input type="date" value={form.fechaFin} onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))} required />
            </Field>
          </div>
          <Field label="Tarifa por noche">
            <Input type="number" min="1" value={form.tarifa} onChange={(e) => setForm((f) => ({ ...f, tarifa: e.target.value }))} required />
          </Field>
          <Btn type="submit" variant="primary">Crear</Btn>
        </form>
      </Card>
      <Card
        title="Temporadas"
        actions={
          <Select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todas</option>
            {Object.values(ROOM_TYPES).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        }
      >
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMsg error={error} />
        ) : (
          <Table headers={['Tipo', 'Desde', 'Hasta', 'Tarifa', '']} empty="Sin temporadas">
            {(data || []).map((s) => (
              <tr key={s.id}>
                <td>{s.roomType}</td>
                <td>{fmtDate(s.fechaInicio)}</td>
                <td>{fmtDate(s.fechaFin)}</td>
                <td className="money">{fmtMoney(s.tarifa)}</td>
                <td><Btn variant="sm btn-danger" onClick={() => eliminar(s)}>Eliminar</Btn></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function Weekdays() {
  const [filtro, setFiltro] = useState('');
  const { data, loading, error, reload } = useData(
    `/api/v1/rates/weekdays${filtro ? `?roomType=${filtro}` : ''}`,
  );
  const [form, setForm] = useState({ roomType: 'SINGLE', diaSemana: '1', tarifa: '' });
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setOk('');
    try {
      await api('/api/v1/rates/weekdays', {
        method: 'POST',
        body: { roomType: form.roomType, diaSemana: Number(form.diaSemana), tarifa: Number(form.tarifa) },
      });
      setOk('Tarifa por día creada.');
      reload();
    } catch (errApi) {
      setErr(errApi);
    }
  }

  async function eliminar(w) {
    if (!window.confirm('Eliminar la tarifa?')) return;
    try {
      await api(`/api/v1/rates/weekdays/${w.id}`, { method: 'DELETE' });
      reload();
    } catch (errApi) {
      window.alert(errApi.message);
    }
  }

  return (
    <div className="grid grid-2">
      <Card title="Nueva tarifa por día">
        <ErrorMsg error={err} />
        <Msg>{ok}</Msg>
        <form onSubmit={submit}>
          <Field label="Tipo de habitación">
            <Select value={form.roomType} onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))}>
              {Object.values(ROOM_TYPES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Día de la semana">
            <Select value={form.diaSemana} onChange={(e) => setForm((f) => ({ ...f, diaSemana: e.target.value }))}>
              {DIAS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tarifa por noche">
            <Input type="number" min="1" value={form.tarifa} onChange={(e) => setForm((f) => ({ ...f, tarifa: e.target.value }))} required />
          </Field>
          <Btn type="submit" variant="primary">Crear</Btn>
        </form>
      </Card>
      <Card
        title="Tarifas por día"
        actions={
          <Select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todas</option>
            {Object.values(ROOM_TYPES).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        }
      >
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMsg error={error} />
        ) : (
          <Table headers={['Tipo', 'Día', 'Tarifa', '']} empty="Sin tarifas">
            {(data || []).map((w) => (
              <tr key={w.id}>
                <td>{w.roomType}</td>
                <td>{DIAS[w.diaSemana]}</td>
                <td className="money">{fmtMoney(w.tarifa)}</td>
                <td><Btn variant="sm btn-danger" onClick={() => eliminar(w)}>Eliminar</Btn></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function Quote() {
  const [form, setForm] = useState({
    roomType: 'SINGLE',
    checkIn: todayISO(),
    checkOut: todayISO(),
  });
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function consultar(e) {
    e.preventDefault();
    setErr(null);
    setQuote(null);
    setBusy(true);
    try {
      const q = new URLSearchParams(form);
      setQuote(await api(`/api/v1/rates/quote?${q.toString()}`));
    } catch (errApi) {
      setErr(errApi);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Cotización (tarifa vigente por tipo y rango)">
      <form onSubmit={consultar} className="row">
        <Field label="Tipo">
          <Select value={form.roomType} onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))}>
            {Object.values(ROOM_TYPES).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Check-in">
          <Input type="date" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} required />
        </Field>
        <Field label="Check-out">
          <Input type="date" value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} required />
        </Field>
        <Btn type="submit" variant="primary" disabled={busy}>Cotizar</Btn>
      </form>
      <ErrorMsg error={err} />
      {quote && (
        <div style={{ marginTop: 8 }}>
          <p>
            <strong>Total ({quote.noches} noches):</strong>{' '}
            <span className="money">{fmtMoney(quote.total)}</span>
            <span className="muted"> · tarifa base {fmtMoney(quote.tarifaBase)}</span>
          </p>
          <Table headers={['Fecha', 'Día', 'Tarifa', 'Origen']} empty="">
            {(quote.detalle || []).map((n, i) => (
              <tr key={i}>
                <td>{fmtDate(n.fecha)}</td>
                <td>{n.dia}</td>
                <td className="money">{fmtMoney(n.tarifa)}</td>
                <td>{n.origen}</td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </Card>
  );
}