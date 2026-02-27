import React, { useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useCart } from '../../contexts/CartContext';

//! TODO Add a "Featured Products" on the Home page.
//! TODO Add a "Seasonal Products" on the home page.

function ECommerceHome() {
  const { products, getProducts } = useData();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchAndUpdateProducts = async () => {
      try {
        await getProducts();
      } catch (error) {
        console.error("Error fetching from context:", error);
      }
    };
    fetchAndUpdateProducts();
  }, []); 

  return (
    <>
      <Container className="mt-4">
        <Carousel className="mb-4">
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://i.ibb.co/fxZbtg6/d20ceb5382fe76b8faf69f80a57111a0bc8545cbcc4f7cb54ff79e01b72b926d.png" 
              alt="First slide"
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
              alt="Second slide"
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
            <Col key={product.id} md={4} className="mb-4">
              <Card className="h-100">
                <Card.Img 
                  variant="top" 
                  src={product.product_img || "https://i.ibb.co/123pvjr/300x200.png"} 
                  alt={"https://i.ibb.co/123pvjr/300x200.png"} 
                  style={{ height: '200px', objectFit: 'contain' }}
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text className="text-muted">{product.summary}</Card.Text>
                  <div className="mt-auto">
                    <p className="h5 mb-3">${product.price.toFixed(2)}</p>
                    <div className="d-flex gap-2">
                      <Link 
                        to={`/product/${product.id}`} 
                        className="text-decoration-none"
                      >
                        <Button variant="primary">View Details</Button>
                      </Link>
                      <Button 
                        variant="success"
                        onClick={() => {
                          addToCart(product);
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="mt-4">
          <Col md={6}>
            <h3>About Us</h3>
            <p>We are an eCommerce store dedicated to providing high-quality products at competitive prices. Our goal is to ensure customer satisfaction with every purchase.</p>
          </Col>
          <Col md={6}>
            <h3>Customer Service</h3>
            <p>Our customer service team is available 24/7 to assist you with any questions or concerns. Feel free to contact us anytime!</p>
            <Button variant="secondary">Contact Us</Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default ECommerceHome;