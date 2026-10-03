import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Shown for any URL that doesn't match a route (App.js), instead of a blank page.
function NotFound() {
  return (
    <Container className="mt-5 text-center">
      <h2 className="mb-3">Page not found</h2>
      <p className="text-muted">We couldn't find the page you were looking for.</p>
      <Button as={Link} to="/browse" variant="primary" className="me-2">Browse Products</Button>
      <Button as={Link} to="/" variant="outline-secondary">Go Home</Button>
    </Container>
  );
}

export default NotFound;
