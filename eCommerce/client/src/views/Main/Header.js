import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
  Search,
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
  const { cartItems, getCartTotal, getCartCount, removeFromCart, loadCartFromDatabase } = useCart();
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    loadCartFromDatabase();
  }, []);

  /**
   * NavLinks component — renders navigation with icons for intuitive, discoverable UX.
   */
  const NavLinks = () => (
    <>
      <Nav.Link as={Link} to="/home" className="nav-link d-flex align-items-center px-3 py-2">
        <Home size={18} className="me-2" />
        <span className="d-none d-sm-inline">Home</span>
      </Nav.Link>
      <Nav.Link as={Link} to="/browse" className="nav-link d-flex align-items-center px-3 py-2">
        <Package size={18} className="me-2" />
        <span className="d-none d-sm-inline">Products</span>
      </Nav.Link>
      <Nav.Link as={Link} to="/cart" className="nav-link d-flex align-items-center px-3 py-2">
        <ShoppingCart size={18} className="me-2" />
        <span className="d-none d-sm-inline">Cart</span>
      </Nav.Link>
      <Nav.Link as={Link} to="/checkout" className="nav-link d-flex align-items-center px-3 py-2">
        <CreditCard size={18} className="me-2" />
        <span className="d-none d-sm-inline">Checkout</span>
      </Nav.Link>
      {isAuthenticated && (
        <Nav.Link as={Link} to="/account" className="nav-link d-flex align-items-center px-3 py-2">
          <User size={18} className="me-2" />
          <span className="d-none d-sm-inline">Profile</span>
        </Nav.Link>
      )}
    </>
  );

  const CartPreview = () => {
    if (!isAuthenticated && !cartItems) return null;

    const itemCount = getCartCount();
    const cartTotal = getCartTotal();

    return (
      <NavDropdown
        title={
          <div className="d-flex align-items-center position-relative">
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
                        src={item.product_img}
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
          <Button as={Link} to="/cart" variant="primary" size="sm" className="w-100">
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

          <Navbar.Toggle
            aria-controls="responsive-navbar-nav"
            className="border-0"
            onClick={() => setShowSidebar(true)}
          >
            <Menu size={20} />
          </Navbar.Toggle>

          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto d-flex align-items-center">
              <NavLinks />
            </Nav>
            <Nav className="d-flex align-items-center">
              <CartPreview />
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
                    <div className="d-flex align-items-center">
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

      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
        <OffcanvasHeader closeButton>
          <OffcanvasTitle className="d-flex align-items-center">
            <Menu size={20} className="me-2" />
            Menu
          </OffcanvasTitle>
        </OffcanvasHeader>
        <OffcanvasBody>
          <Nav className="flex-column">
            <NavLinks />
          </Nav>
          {isAuthenticated && (
            <div className="mt-3 pt-3 border-top">
              <p className="text-muted small mb-2">Welcome, {username}</p>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  logout();
                  setShowSidebar(false);
                }}
                className="w-100 d-flex align-items-center justify-content-center"
              >
                <LogOut size={16} className="me-2" />
                Logout
              </Button>
            </div>
          )}
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
}

export default Header;
