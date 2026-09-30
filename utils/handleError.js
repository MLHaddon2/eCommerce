// Shared 500 handler for controllers. The full error is always logged server-side,
// but raw DB/Sequelize messages are only sent to the client outside production.
export const handleError = (res, context, error) => {
  console.error(context, error);
  const body = { message: `${context} failed` };
  if (process.env.NODE_ENV !== 'production') {
    body.error = error?.message || String(error);
  }
  return res.status(500).json(body);
};
