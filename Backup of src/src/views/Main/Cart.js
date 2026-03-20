import React from 'react';
import { Container, Row, Col, Table, Button, Form } from 'react-bootstrap';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

// FIXED:
// - Removed duplicate "Continue Shopping" button that appeared immediately above
//   "Proceed to Checkout" in the non-empty cart view. There was no gap between them.
// - Added mt-2 spacing between the two action buttons.
// - Removed { replace: true } from continueShopping navigation — replacing the
//   history entry here means the user can't go back to the cart from the browse
//   page, which is unexpected UX. replace: true is only appropriate post-purchase.

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();

  const continueShopping = () => {
    navigate('/browse');
  };

  const proceedToCheckout = () => {
    navigate('/checkout');
  };

  const shippingCost = cartItems.length > 0 ? 5.0 : 0;

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
            <Table striped bordered hover>
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
                    <td>${item.price}</td>
                    <td>
                      <Form.Control
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                      />
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
                  <td>Shipping:</td>
                  <td>${shippingCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Total:</strong>
                  </td>
                  <td>
                    <strong>${(getCartTotal() + shippingCost).toFixed(2)}</strong>
                  </td>
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
