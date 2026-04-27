import React from 'react';
import { Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

/**
 * Shared ProductCard component used by both Home.js and Browse.js.
 * Previously duplicated in both files — now a single source of truth.
 */
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <Col md={4} className="mb-4">
      <Card className="h-100">
        <Card.Img
          variant="top"
          src={product.product_img || 'https://i.ibb.co/123pvjr/300x200.png'}
          alt={product.name}
          style={{ height: '200px', objectFit: 'contain' }}
        />
        <Card.Body className="d-flex flex-column">
          <Card.Title>{product.name}</Card.Title>
          <Card.Text className="text-muted">{product.summary}</Card.Text>
          <div className="mt-auto">
            <p className="h5 mb-3">${product.price}</p>
            <div className="d-flex gap-2">
              <Link to={`/product/${product.id}`} className="text-decoration-none">
                <Button variant="primary">View Details</Button>
              </Link>
              <Button variant="success" onClick={() => addToCart(product)}>
                Add to Cart
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default ProductCard;
