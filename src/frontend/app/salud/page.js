'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Badge, Btn, Card, ErrorMsg, Loading, Table, fmtDateTime } from '@/components/ui';

export default function SaludPage() {
  const [state, setState] = useState(null);

  async function check() {
    setState({ loading: true, data: null, error: null });
    try {
      const data = await api('/health', { auth: false });
      setState({ loading: false, data, error: null });
    } catch (err) {
      setState({ loading: false, data: null, error: err });
    }
  }

  return (
    <>
      <h1>Salud del sistema</h1>
      <Card title="Health check">
        <Btn variant="primary" onClick={check}>Comprobar ahora</Btn>
        {state?.loading && <Loading />}
        {state?.error && (
          <div style={{ marginTop: 12 }}>
            <ErrorMsg error={state.error} />
            {state.error.status === 503 && (
              <p className="danger-text">La base de datos no responde ({state.error.code || 'db down'}).</p>
            )}
          </div>
        )}
        {state?.data && (
          <div style={{ marginTop: 12 }}>
            <Table headers={['Componente', 'Estado']} empty="">
              <tr>
                <td>API</td>
                <td><Badge kind={state.data.api === 'ok' ? 'ok' : 'down'} /></td>
              </tr>
              <tr>
                <td>Base de datos</td>
                <td><Badge kind={state.data.db === 'ok' ? 'ok' : 'down'} /></td>
              </tr>
              <tr>
                <td>Timestamp</td>
                <td>{fmtDateTime(state.data.timestamp)}</td>
              </tr>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}