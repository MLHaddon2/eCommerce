// Contact form tests: POST /api/contact emails the shop inbox.
// Emails are captured in memory (utils/mailer.js `sentMail`), nothing is sent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeClient, registerUser } from './helpers.js';

const { sentMail } = await import('../utils/mailer.js');

const SHOP_INBOX = 'skelesitesmlh@gmail.com';
const valid = { name: 'Pat Example', email: 'pat@example.com', subject: 'Sizing question', message: 'Do the Chelsea boots run large?' };

test('contact form rejects missing or invalid fields without sending anything', async () => {
  const guest = makeClient();
  sentMail.length = 0;

  const bad = [
    { ...valid, name: '   ' },
    { ...valid, email: 'not-an-email' },
    { ...valid, message: 'too short' },
    { ...valid, message: 'x'.repeat(5001) },
    { ...valid, subject: 'x'.repeat(151) },
    {},
  ];
  for (const body of bad) {
    const res = await guest.post('/api/contact', body);
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
    assert.ok(res.data.message);
  }
  assert.equal(sentMail.length, 0);
});

test('a guest message is emailed to the shop inbox with the visitor as Reply-To', async () => {
  const guest = makeClient();
  sentMail.length = 0;

  const res = await guest.post('/api/contact', valid);
  assert.equal(res.status, 200, JSON.stringify(res.data));

  assert.equal(sentMail.length, 1);
  const [mail] = sentMail;
  assert.equal(mail.to, SHOP_INBOX);
  assert.equal(mail.replyTo, '"Pat Example" <pat@example.com>');
  assert.equal(mail.subject, '[Contact] Sizing question');
  assert.match(mail.text, /Name: Pat Example/);
  assert.match(mail.text, /Email: pat@example\.com/);
  assert.match(mail.text, /Do the Chelsea boots run large\?/);
  assert.doesNotMatch(mail.text, /Account:/);
});

test('line breaks in name and subject cannot add mail headers; logged-in senders are identified', async () => {
  const client = makeClient();
  const creds = await registerUser(client);
  sentMail.length = 0;

  const res = await client.post('/api/contact', {
    name: 'Pat\r\nBcc: victim@example.com',
    email: creds.email,
    subject: 'Hello\nBcc: victim@example.com',
    message: 'First line.\nSecond line.',
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));

  const [mail] = sentMail;
  assert.doesNotMatch(mail.subject, /[\r\n]/);
  assert.doesNotMatch(mail.replyTo, /[\r\n]/);
  assert.match(mail.text, new RegExp(`Account: ${creds.username}`));
  assert.match(mail.text, /First line\.\nSecond line\./, 'the message body keeps its line breaks');
});

test('a filled-in honeypot field is accepted but never emailed', async () => {
  sentMail.length = 0;
  const res = await makeClient().post('/api/contact', { ...valid, leaveBlank: 'http://spam.example' });
  assert.equal(res.status, 200);
  assert.equal(sentMail.length, 0);
});

// Keep this test last: it uses up the per-address allowance for this test run.
test('the contact form stops accepting messages after 5 per hour from one address', async () => {
  const guest = makeClient();
  sentMail.length = 0;

  let accepted = 0;
  let limited = null;
  for (let i = 0; i < 6 && !limited; i += 1) {
    const res = await guest.post('/api/contact', valid);
    if (res.status === 200) accepted += 1;
    else limited = res;
  }

  assert.ok(limited, 'expected to hit the limit');
  assert.equal(limited.status, 429);
  assert.match(limited.data.message, new RegExp(SHOP_INBOX));
  // Two messages were accepted by the earlier tests in this file.
  assert.equal(accepted, 3);
  assert.equal(sentMail.length, 3);
});
