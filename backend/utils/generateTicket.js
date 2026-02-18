const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Ticket = require('../models/Ticket');

const generateTicket = async (registrationId, eventId, userId, eventName, userName) => {
  const ticketId = 'TKT-' + uuidv4().slice(0, 8).toUpperCase();

  // data embedded in QR code
  const qrData = JSON.stringify({
    ticketId,
    eventId: eventId.toString(),
    userId: userId.toString(),
    eventName,
    participant: userName
  });

  const qrCode = await QRCode.toDataURL(qrData);

  const ticket = await Ticket.create({
    ticketId,
    registrationId,
    eventId,
    userId,
    qrCode
  });

  return ticket;
};

module.exports = generateTicket;
