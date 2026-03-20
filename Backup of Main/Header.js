import {React, useState, useEffect} from "react";
import { Link } from 'react-router-dom';
import { Offcanvas, OffcanvasHeader, OffcanvasBody, OffcanvasTitle, Button} from "react-bootstrap";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from "react-bootstrap/NavDropdown";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { ShoppingCart, X } from 'lucide-react';
import axios from '../../api/axios.js';

// !- When a user logs in, check for cart items in their last login and apply them to the current iphistory.

// Ad Component for reusability
const AdSpace = ({ adId, className = "", style = {}, children }) => (
  <div 
    className={`ad-space ${className}`} 
    data-ad-id={adId}
    style={{
      minHeight: '60px',
      backgroundColor: '#f8f9fa',
      border: '1px dashed #dee2e6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }}
  >
    {children || (
      <small className="text-muted"> - Ad Space - {adId}</small>
    )}
  </div>
);

function Header() {
  const { isAuthenticated, username, logout } = useAuth();
  const { cartItems, getCartTotal, getCartCount, removeFromCart, loadCartFromDatabase } = useCart();
  const [showSidebar, setShowSidebar] = useState(false);

  const NavLinks = () => (
    <>
      <Nav.Link as={Link} to="/home" className="nav-item px-3">Home</Nav.Link>
      <Nav.Link as={Link} to="/browse" className="nav-item px-3">Products</Nav.Link>
      <Nav.Link as={Link} to="/cart" className="nav-item px-3">Cart</Nav.Link>
      <Nav.Link as={Link} to="/checkout" className="nav-item px-3">Checkout</Nav.Link>
      <Nav.Link as={Link} to="/account" className="nav-item px-3">Profile</Nav.Link>
    </>
  );

  const LoggedOutNavLinks = () => (
    <>
      <Nav.Link as={Link} to="/home" className="nav-item px-3">Home</Nav.Link>
      <Nav.Link as={Link} to="/browse" className="nav-item px-3">Products</Nav.Link>
      <Nav.Link as={Link} to="/cart" className="nav-item px-3">Cart</Nav.Link>
      <Nav.Link as={Link} to="/checkout" className="nav-item px-3">Checkout</Nav.Link>
    </>
  );
  
  useEffect(() => {
      loadCartFromDatabase();
  }, []);
  

  const CartPreview = () => {
    if (!isAuthenticated & !cartItems) return null;

    const itemCount = getCartCount();
    const cartTotal = getCartTotal();
    
    const handleDelete = (itemId) => {
      removeFromCart(itemId);
    };
    
    return (
      <NavDropdown 
        title={
          <div className="d-inline-block position-relative">
            <ShoppingCart className="text-primary" size={24} />
            {itemCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {itemCount}
              </span>
            )}
          </div>
        }
        align="end"
        className="nav-item px-3"
      >
        <div className="px-3 py-2" style={{ minWidth: '400px' }}>
          {/* Cart Ad Space */}
          <AdSpace 
            adId="cart-dropdown-top" 
            className="mb-3"
            style={{ minHeight: '80px' }}
          />
          
          {cartItems.length === 0 ? (
            <p className="text-muted mb-0">Your cart is empty</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-sm mb-2">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.slice(0, 3).map((item) => (
                      <tr key={item.id}>
                        <td className="img-thumbnail">                            
                          <img 
                                src={item.product_img}
                                alt=''
                                style={{ width: '50px', height: '30px', objectFit: 'scale-down' }}
                          />
                        </td>
                        <td className="text-truncate" style={{ maxWidth: '120px' }}>{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">${item.price}</td>
                        <td className="text-end">${(item.quantity * item.price).toFixed(2)}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-link btn-sm p-0 text-danger"
                            onClick={() => handleDelete(item.id)}
                            aria-label="Remove item"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cartItems.length > 3 && (
                <small className="text-muted d-block mb-2">
                  And {cartItems.length - 3} more items...
                </small>
              )}
              <div className="border-top pt-2">
                <p className="mb-2 text-end">
                  <strong>Total: ${cartTotal.toFixed(2)}</strong>
                </p>
              </div>
            </>
          )}
          <div className="border-top pt-2">
            <Button 
              as={Link} 
              to="/cart" 
              variant="primary" 
              className="w-100"
            >
              View Cart
            </Button>
          </div>
        </div>
      </NavDropdown>
    );
  };

  const handleClose = () => setShowSidebar(false);
  const handleShow = () => setShowSidebar(true);

  return (
    <>
      {/* Top Banner Ad */}
      <AdSpace 
        adId="header-banner-top" 
        className="w-100"
        style={{ 
          minHeight: '90px',
          backgroundColor: '#e9ecef',
          borderRadius: '0',
          border: 'none',
          borderBottom: '1px solid #dee2e6'
        }}
      />

      <Navbar expand="lg" bg="white" variant="light" className="shadow-sm py-2">
        <Container fluid>
          <Button variant='outline-primary' className="navbar-toggler-icon" onClick={handleShow} />
          <Navbar.Brand as={Link} to="/" className="font-weight-bold px-3">
            Welcome
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto d-flex align-items-center">
              {isAuthenticated ? <NavLinks /> : <LoggedOutNavLinks/>}
              {isAuthenticated && (
                <>
                  {/* Navigation ad space - only visible on larger screens */}
                  <div className="d-none d-xl-block ms-3">
                    <AdSpace 
                      adId="nav-inline" 
                      style={{ 
                        minHeight: '35px', 
                        width: '150px',
                        fontSize: '0.8rem'
                      }}
                    />
                  </div>
                </>
              )}
            </Nav>
            <Nav className="d-flex align-items-center">
              <CartPreview />
              {isAuthenticated ? (
                <>
                  <Navbar.Text className="px-3">
                    Welcome, <span className="fw-bold">{username}</span>
                  </Navbar.Text>
                  <Nav.Item className="px-3">
                    <Button variant="outline-primary" size="sm" onClick={logout}>Log Out</Button>
                  </Nav.Item>
                </>
              ) : (
                <NavDropdown title="Login/Signup" id="auth-dropdown" align="end" className="nav-item px-3">
                  <NavDropdown.Item as={Link} to="/login" className="px-3">Login</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/signup" className="px-3">Signup</NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Sidebar with Ad Spaces */}
      <Offcanvas show={showSidebar} onHide={handleClose}>
        <OffcanvasHeader closeButton>
          <OffcanvasTitle>Menu</OffcanvasTitle>
        </OffcanvasHeader>
        <OffcanvasBody>
          {/* Sidebar top ad */}
          <AdSpace 
            adId="sidebar-top" 
            className="mb-4"
            style={{ minHeight: '120px' }}
          />
          
          {/* Sidebar navigation content */}
          <Nav className="flex-column">
            {isAuthenticated ? <NavLinks /> : <LoggedOutNavLinks/>}
          </Nav>
          
          {/* Sidebar middle ad */}
          <AdSpace 
            adId="sidebar-middle" 
            className="my-4"
            style={{ minHeight: '100px' }}
          />
          
          {/* Additional sidebar content can go here */}
          
          {/* Sidebar bottom ad */}
          <div className="mt-auto">
            <AdSpace 
              adId="sidebar-bottom" 
              className="mt-4"
              style={{ minHeight: '80px' }}
            />
          </div>
        </OffcanvasBody>
      </Offcanvas>

      {/* Sub-header banner ad */}
      <AdSpace 
        adId="header-banner-bottom" 
        className="w-100"
        style={{ 
          minHeight: '60px',
          backgroundColor: '#f8f9fa',
          borderRadius: '0',
          border: 'none',
          borderBottom: '1px solid #dee2e6'
        }}
      />
    </>
  );
}

export default Header;