const paymentService = require('../services/payment.service');

async function registerPayment(req, res, next) {
  try {
    const payment = await paymentService.registerPayment(req.params.id, req.body);
    return res.status(201).json(payment);
  } catch (err) {
    return next(err);
  }
}

async function getInvoice(req, res, next) {
  try {
    const invoice = await paymentService.buildInvoice(req.params.id);
    return res.json(invoice);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getInvoice, registerPayment };
