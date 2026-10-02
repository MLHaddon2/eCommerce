import { sendMail } from '../utils/mailer.js';
import { handleError } from '../utils/handleError.js';

// Contact form (POST /api/contact). Public, so guests can write in too.
// Messages go to the shop inbox with the visitor's address as Reply-To, so replying
// from the inbox answers them directly. The From address stays MAIL_FROM: mail
// providers reject messages that claim to come from someone else's address.

// Keep the default in sync with CONTACT_EMAIL in client/src/views/Main/Contact.js.
const contactEmail = () => process.env.CONTACT_EMAIL || 'skelesitesmlh@gmail.com';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 100, email: 255, subject: 150, message: 5000 };
const MIN_MESSAGE_LENGTH = 10;

// The endpoint sends email without a login, so cap how many messages one address can send.
// In memory: it resets on restart and isn't shared between server processes.
const MAX_MESSAGES = 5;
const WINDOW_MS = 60 * 60 * 1000;
const recentByIp = new Map(); // ip → timestamps of accepted messages

const recentMessages = (ip) => {
  const cutoff = Date.now() - WINDOW_MS;
  if (recentByIp.size > 1000) {
    for (const [key, times] of recentByIp) {
      if (!times.some((t) => t > cutoff)) recentByIp.delete(key);
    }
  }
  const times = (recentByIp.get(ip) || []).filter((t) => t > cutoff);
  recentByIp.set(ip, times);
  return times;
};

// Name and subject end up in mail headers / one-line fields: no line breaks.
const oneLine = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');

export const sendContactMessage = async (req, res) => {
  try {
    // Hidden field real visitors never see. Bots fill it in: pretend it worked, send nothing.
    const body = req.body || {};
    if (body.leaveBlank) return res.status(200).json({ message: 'Message sent' });

    const name = oneLine(body.name);
    const email = oneLine(body.email);
    const subject = oneLine(body.subject);
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name) return res.status(400).json({ message: 'Please enter your name' });
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
    if (message.length < MIN_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Please enter a message of at least ${MIN_MESSAGE_LENGTH} characters` });
    }
    for (const [field, value] of Object.entries({ name, email, subject, message })) {
      if (value.length > LIMITS[field]) {
        return res.status(400).json({ message: `Your ${field} is too long (${LIMITS[field]} characters at most)` });
      }
    }

    const sent = recentMessages(req.ip);
    if (sent.length >= MAX_MESSAGES) {
      return res.status(429).json({ message: `You've sent several messages recently. Please try again later or email ${contactEmail()} directly.` });
    }

    const info = await sendMail({
      to: contactEmail(),
      replyTo: `"${name.replace(/["\\]/g, '')}" <${email}>`,
      subject: `[Contact] ${subject || `Message from ${name}`}`,
      text: [
        `New message from the contact form.`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        req.username ? `Account: ${req.username}` : null,
        subject ? `Subject: ${subject}` : null,
        ``,
        message,
      ].filter((line) => line !== null).join('\n'),
    });

    // sendMail never throws; null means the message did not go out.
    if (!info) {
      return res.status(502).json({ message: `We couldn't send your message right now. Please email ${contactEmail()} directly.` });
    }

    sent.push(Date.now());
    res.status(200).json({ message: 'Message sent' });
  } catch (error) {
    return handleError(res, 'Send contact message', error);
  }
};
