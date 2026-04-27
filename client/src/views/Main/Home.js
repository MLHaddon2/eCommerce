import React, { useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Carousel } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ProductCard';

// FIXED:
// - Replaced duplicated inline card JSX with shared <ProductCard> component
// - Added `getProducts` to useEffect dependency array (was missing, caused lint warning)
// - Removed incorrect alt attribute (was set to a URL string instead of descriptive text;
//   now handled correctly inside ProductCard using product.name)

function ECommerceHome() {
  const { products, getProducts } = useData();

  // Wrap in useCallback so it's stable across renders and safe to list as a dependency
  const fetchProducts = useCallback(async () => {
    try {
      await getProducts();
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [getProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <Container className="mt-4">
        <Carousel className="mb-4">
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://i.ibb.co/fxZbtg6/d20ceb5382fe76b8faf69f80a57111a0bc8545cbcc4f7cb54ff79e01b72b926d.png"
              alt="Welcome to our store — promotional banner"
            />
            <Carousel.Caption>
              <h3>Welcome to Our Store</h3>
              <p>Discover amazing products at great prices!</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://i.ibb.co/kmXg224/34b20d15848f0808c7ba98686cd098590b255f8bfaab5716a4685bcce4176122.png"
              alt="New arrivals — promotional banner"
            />
            <Carousel.Caption>
              <h3>New Arrivals</h3>
              <p>Check out our latest products!</p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>

        <h2 className="mb-4">Featured Products</h2>
        <Row>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Row>

        <Row className="mt-4">
          <Col md={6}>
            <h3>About Us</h3>
            <p>
              We are an eCommerce store dedicated to providing high-quality products at
              competitive prices. Our goal is to ensure customer satisfaction with every
              purchase.
            </p>
          </Col>
          <Col md={6}>
            <h3>Customer Service</h3>
            <p>
              Our customer service team is available 24/7 to assist you with any questions
              or concerns. Feel free to contact us anytime!
            </p>
            <Button variant="secondary">Contact Us</Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default ECommerceHome;
