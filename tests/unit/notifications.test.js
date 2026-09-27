jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn(async () => ({ messageId: 'msg-1' })) })),
}));

const nodemailer = require('nodemailer');
const { getTransport, sendEmail } = require('../../src/services/notifications.service');

const previousEnv = {
  SMTP_URL: process.env.SMTP_URL,
  NOTIFICATIONS_FROM: process.env.NOTIFICATIONS_FROM,
};
let consoleSpy;

beforeEach(() => {
  nodemailer.createTransport.mockClear();
  delete process.env.SMTP_URL;
  delete process.env.NOTIFICATIONS_FROM;
  consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe('transporte por defecto (log)', () => {
  test('sin SMTP_URL no se crea un transporte SMTP', () => {
    expect(getTransport().name).toBe('log');
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  test('sendEmail registra el destinatario, el asunto y el cuerpo', async () => {
    const resultado = await sendEmail(
      'huesped@example.com',
      'Reserva confirmada HR-ABC123',
      'Cuerpo',
    );

    expect(resultado).toEqual({
      transport: 'log',
      to: 'huesped@example.com',
      subject: 'Reserva confirmada HR-ABC123',
    });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logged = consoleSpy.mock.calls[0][0];
    expect(logged).toContain('huesped@example.com');
    expect(logged).toContain('Reserva confirmada HR-ABC123');
    expect(logged).toContain('Cuerpo');
  });

  test('sin destinatario falla', async () => {
    await expect(sendEmail('', 'asunto', 'cuerpo')).rejects.toThrow(/destinatario/i);
  });
});

describe('transporte SMTP', () => {
  test('con SMTP_URL definido usa nodemailer con el remitente configurado', async () => {
    process.env.SMTP_URL = 'smtp://usuario:clave@localhost:1025';
    process.env.NOTIFICATIONS_FROM = 'reservas@hotel.test';

    expect(getTransport().name).toBe('smtp');
    expect(nodemailer.createTransport).toHaveBeenCalledWith('smtp://usuario:clave@localhost:1025');

    const resultado = await sendEmail(
      'huesped@example.com',
      'Reserva cancelada HR-ABC123',
      'Cuerpo',
    );

    const [{ sendMail }] = nodemailer.createTransport.mock.results.slice(-1).map((r) => r.value);
    expect(sendMail).toHaveBeenCalledWith({
      from: 'reservas@hotel.test',
      to: 'huesped@example.com',
      subject: 'Reserva cancelada HR-ABC123',
      text: 'Cuerpo',
    });
    expect(resultado).toMatchObject({ transport: 'smtp', messageId: 'msg-1' });
  });

  test('con SMTP_URL vacío cae en el transporte log', () => {
    process.env.SMTP_URL = '';

    expect(getTransport().name).toBe('log');
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});
