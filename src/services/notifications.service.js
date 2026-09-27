const { getNotificationsFrom } = require('../config/reservationRules');

const logTransport = {
  name: 'log',
  async send(message) {
    console.log(
      `[notificaciones:log] to=${message.to} subject="${message.subject}"\n${message.text}`,
    );
    return { transport: 'log', to: message.to, subject: message.subject };
  },
};

function createSmtpTransport(url) {
  // Requerimiento diferido: sin SMTP_URL no hace falta tener nodemailer cargado.
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport(url);

  return {
    name: 'smtp',
    async send(message) {
      const info = await transporter.sendMail({
        from: getNotificationsFrom(),
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
      return {
        transport: 'smtp',
        to: message.to,
        subject: message.subject,
        messageId: info.messageId,
      };
    },
  };
}

function getTransport() {
  const smtpUrl = process.env.SMTP_URL;
  return smtpUrl ? createSmtpTransport(smtpUrl) : logTransport;
}

async function sendEmail(to, subject, body) {
  if (!to) {
    throw new Error('sendEmail requiere un destinatario');
  }
  return getTransport().send({ to, subject, text: body });
}

module.exports = { getTransport, sendEmail };
