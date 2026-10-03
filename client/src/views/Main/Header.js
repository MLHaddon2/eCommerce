import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Navbar,
  Nav,
  NavDropdown,
  Button,
  Badge,
  Offcanvas,
  OffcanvasHeader,
  OffcanvasTitle,
  OffcanvasBody,
  Row,
  Col,
} from 'react-bootstrap';
import {
  ShoppingCart,
  User,
  Home,
  Package,
  CreditCard,
  LogOut,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

// FIXED:
// - Fixed bitwise `&` bug → logical `&&` in CartPreview guard:
//     Before: if (!isAuthenticated & !cartItems) — bitwise, coerces values, unreliable
//     After:  if (!isAuthenticated && !cartItems) — correct logical AND
// - Merged NavLinks and LoggedOutNavLinks into a single NavLinks component with a
//   conditional "Profile" link, eliminating the near-duplicate.

function Header() {
  const { isAuthenticated, username, logout } = useAuth();
  // The cart is loaded by AuthContext once it knows whether the user is logged in.
  const { cartItems, getCartTotal, getCartCount, removeFromCart } = useCart();
  const [showSidebar, setShowSidebar] = useState(false);
  const closeSidebar = () => setShowSidebar(false);

  // The nav links and the cart preview are plain render functions, not components declared
  // in here: a component declared inside Header is a new type on every render, so React
  // remounts it — which closed the open cart dropdown whenever the cart changed.

  /**
   * Navigation links with icons. In the sidebar the labels are always shown and a
   * click closes the sidebar; in the top bar the labels collapse on very narrow widths.
   */
  const renderNavLinks = (inSidebar = false) => {
    const labelClass = inSidebar ? '' : 'd-none d-sm-inline';
    const onClick = inSidebar ? closeSidebar : undefined;
    return (
    <>
      <Nav.Link as={Link} to="/home" onClick={onClick} className="nav-link d-flex align-items-center px-3 py-2">
        <Home size={18} className="me-2" />
        <span className={labelClass}>Home</span>
      </Nav.Link>
      <Nav.Link as={Link} to="/browse" onClick={onClick} className="nav-link d-flex align-items-center px-3 py-2">
        <Package size={18} className="me-2" />
        <span className={labelClass}>Products</span>
      </Nav.Link>
      <Nav.Link as={Link} to="/cart" onClick={onClick} className="nav-link d-flex align-items-center px-3 py-2">
        <ShoppingCart size={18} className="me-2" />
        <span className={labelClass}>Cart</span>
      </Nav.Link>
      <Nav.Link as={Link} to="/checkout" onClick={onClick} className="nav-link d-flex align-items-center px-3 py-2">
        <CreditCard size={18} className="me-2" />
        <span className={labelClass}>Checkout</span>
      </Nav.Link>
      {isAuthenticated && (
        <Nav.Link as={Link} to="/account" onClick={onClick} className="nav-link d-flex align-items-center px-3 py-2">
          <User size={18} className="me-2" />
          <span className={labelClass}>Profile</span>
        </Nav.Link>
      )}
      <Nav.Link as={Link} to="/contact" onClick={onClick} className="nav-link d-flex align-items-center px-3 py-2">
        <Mail size={18} className="me-2" />
        <span className={labelClass}>Contact</span>
      </Nav.Link>
    </>
    );
  };

  const renderCartPreview = (id, onNavigate) => {
    if (!isAuthenticated && !cartItems) return null;

    const itemCount = getCartCount();
    const cartTotal = getCartTotal();

    return (
      <NavDropdown
        id={id}
        title={
          // inline-flex keeps the dropdown caret on the same line as the icon.
          <div className="d-inline-flex align-items-center position-relative">
            <ShoppingCart size={20} className="text-primary" />
            {itemCount > 0 && (
              <Badge
                bg="danger"
                className="position-absolute top-0 start-100 translate-middle rounded-pill"
                style={{ fontSize: '0.7rem' }}
              >
                {itemCount}
              </Badge>
            )}
          </div>
        }
        align="end"
        className="nav-link px-3"
      >
        <div className="px-3 py-2" style={{ minWidth: '280px' }}>
          {cartItems.length === 0 ? (
            <p className="text-muted mb-2 text-center">Your cart is empty</p>
          ) : (
            <>
              <div className="mb-3">
                {cartItems.slice(0, 3).map((item) => (
                  <Row key={item.id} className="align-items-center mb-2">
                    <Col xs={3}>
                      <img
                        src={item.product_img || 'https://i.ibb.co/123pvjr/300x200.png'}
                        alt={item.name}
                        className="img-fluid rounded"
                        style={{ maxHeight: '40px', objectFit: 'cover' }}
                      />
                    </Col>
                    <Col xs={6}>
                      <small className="fw-semibold text-truncate d-block">{item.name}</small>
                      <small className="text-muted">Qty: {item.quantity}</small>
                    </Col>
                    <Col xs={2} className="text-end">
                      <small className="fw-bold">${(item.quantity * item.price).toFixed(2)}</small>
                    </Col>
                    <Col xs={1}>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-danger"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <X size={14} />
                      </Button>
                    </Col>
                  </Row>
                ))}
              </div>
              {cartItems.length > 3 && (
                <small className="text-muted d-block mb-2">
                  And {cartItems.length - 3} more items...
                </small>
              )}
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">Total:</span>
                <span className="fw-bold text-primary">${cartTotal.toFixed(2)}</span>
              </div>
            </>
          )}
          <Button as={Link} to="/cart" onClick={onNavigate} variant="primary" size="sm" className="w-100">
            View Cart
          </Button>
        </div>
      </NavDropdown>
    );
  };

  return (
    <>
      <Navbar
        expand="lg"
        bg="light"
        variant="light"
        className="shadow-sm border-bottom"
        sticky="top"
      >
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-primary d-flex align-items-center">
            <Package size={24} className="me-2" />
            <span className="d-none d-md-inline">ECommerce</span>
          </Navbar.Brand>

          {/* Plain button rather than Navbar.Toggle: Navbar.Toggle also expands
              Navbar.Collapse, which opened an inline dropdown alongside the sidebar. */}
          <button
            type="button"
            className="navbar-toggler border-0"
            aria-label="Open menu"
            onClick={() => setShowSidebar(true)}
          >
            <Menu size={20} />
          </button>

          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto d-flex align-items-center">
              {renderNavLinks()}
            </Nav>
            <Nav className="d-flex align-items-center">
              {renderCartPreview('cart-dropdown')}
              {isAuthenticated ? (
                <>
                  <Navbar.Text className="px-3 d-none d-lg-block">
                    Welcome, <span className="fw-semibold">{username}</span>
                  </Navbar.Text>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={logout}
                    className="d-flex align-items-center ms-2"
                  >
                    <LogOut size={16} className="me-1" />
                    <span className="d-none d-sm-inline">Logout</span>
                  </Button>
                </>
              ) : (
                <NavDropdown
                  title={
                    <div className="d-inline-flex align-items-center">
                      <User size={18} className="me-1" />
                      <span className="d-none d-sm-inline">Account</span>
                    </div>
                  }
                  id="auth-dropdown"
                  align="end"
                  className="nav-link px-3"
                >
                  <NavDropdown.Item as={Link} to="/login" className="d-flex align-items-center">
                    <User size={16} className="me-2" />
                    Login
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/signup" className="d-flex align-items-center">
                    <User size={16} className="me-2" />
                    Signup
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Offcanvas show={showSidebar} onHide={closeSidebar} placement="start">
        <OffcanvasHeader closeButton>
          <OffcanvasTitle className="d-flex align-items-center">
            <Menu size={20} className="me-2" />
            Menu
          </OffcanvasTitle>
        </OffcanvasHeader>
        <OffcanvasBody>
          <Nav className="flex-column">
            {renderNavLinks(true)}
          </Nav>
          <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2">
            {renderCartPreview('cart-dropdown-sidebar', closeSidebar)}
            {isAuthenticated ? (
              <>
                <span className="text-muted small">Welcome, {username}</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => { logout(); closeSidebar(); }}
                  className="d-flex align-items-center ms-auto"
                >
                  <LogOut size={16} className="me-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" onClick={closeSidebar} className="d-flex align-items-center">
                  <User size={16} className="me-2" />Login
                </Nav.Link>
                <Nav.Link as={Link} to="/signup" onClick={closeSidebar} className="d-flex align-items-center">
                  <User size={16} className="me-2" />Signup
                </Nav.Link>
              </>
            )}
          </div>
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
}

export default Header;
