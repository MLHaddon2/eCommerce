import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form } from 'react-bootstrap';
import { useCart, maxQuantityFor } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

// FIXED:
// - Removed duplicate "Continue Shopping" button that appeared immediately above
//   "Proceed to Checkout" in the non-empty cart view. There was no gap between them.
// - Added mt-2 spacing between the two action buttons.
// - Removed { replace: true } from continueShopping navigation — replacing the
//   history entry here means the user can't go back to the cart from the browse
//   page, which is unexpected UX. replace: true is only appropriate post-purchase.

// The field keeps its own text while it's being edited, so it can be cleared and
// retyped; the cart only changes once the text is a whole number of 1 or more.
// Quantities above the stock are capped (see maxQuantityFor in CartContext).
function QuantityInput({ item, onChange }) {
  const [text, setText] = useState(String(item.quantity));
  const max = maxQuantityFor(item);

  // Follow the cart when it changes elsewhere (header dropdown, stock cap, reload).
  useEffect(() => {
    setText(String(item.quantity));
  }, [item.quantity]);

  return (
    <Form.Control
      type="number"
      min="1"
      max={Number.isFinite(max) ? Math.max(1, max) : undefined}
      aria-label={`Quantity of ${item.name}`}
      value={text}
      onChange={(e) => {
        // Input values are strings; the cart (and the server) need whole numbers.
        const quantity = parseInt(e.target.value, 10);
        if (quantity >= 1) {
          const capped = Math.min(quantity, Math.max(1, max));
          setText(String(capped));
          onChange(item.id, capped);
        } else {
          setText(e.target.value);
        }
      }}
      onBlur={() => setText(String(item.quantity))}
    />
  );
}

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();

  const continueShopping = () => {
    navigate('/browse');
  };

  const proceedToCheckout = () => {
    navigate('/checkout');
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Your Cart</h2>
      {cartItems.length === 0 ? (
        <div className="text-center">
          <h4>Your cart is empty</h4>
          <Button variant="primary" onClick={continueShopping}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <Row>
          <Col md={8}>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>${Number(item.price).toFixed(2)}</td>
                    <td>
                      <QuantityInput item={item} onChange={updateQuantity} />
                    </td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
          <Col md={4}>
            <h4>Order Summary</h4>
            <Table>
              <tbody>
                <tr>
                  <td>Subtotal:</td>
                  <td>${getCartTotal().toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Tax:</td>
                  <td className="text-muted">Calculated at checkout</td>
                </tr>
              </tbody>
            </Table>
            <Button variant="outline-secondary" className="w-100" onClick={continueShopping}>
              Continue Shopping
            </Button>
            <Button
              variant="primary"
              className="w-100 mt-2"
              onClick={proceedToCheckout}
            >
              Proceed to Checkout
            </Button>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Cart;
