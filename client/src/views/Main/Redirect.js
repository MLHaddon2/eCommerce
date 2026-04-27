import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// FIXED:
// - Moved navigate() call into useEffect so it runs after render, not during it.
//   Calling navigate() directly in the render body causes a side effect on every
//   render cycle and triggers React warnings about state updates during rendering.

function Redirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/home', { replace: true });
  }, [navigate]);

  return null;
}

export default Redirect;
