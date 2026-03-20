import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, ListGroup } from 'react-bootstrap';
import { StarFill, Star } from 'react-bootstrap-icons';
import { useData } from '../../contexts/DataContext';
import { useCart } from '../../contexts/CartContext';

// FIXED:
// - Guarded averageRating calculation against empty reviews array.
//   Previously divided by reviews.length when it could be 0, producing NaN
//   which crashed .toFixed() and renderStars(Math.round(NaN)).

const ProductPage = () => {
  const { id } = useParams();
  const { product, getProduct } = useData();
  const { addToCart } = useCart();

  useEffect(() => {
    getProduct(id);
  }, [id, getProduct]);

  if (!product) {
    return (
      <Container className="py-5">
        <h2>Loading...</h2>
      </Container>
    );
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) =>
      index < rating ? (
        <StarFill key={index} className="text-warning me-1" />
      ) : (
        <Star key={index} className="text-warning me-1" />
      )
    );
  };

  // Guard: if there are no reviews, default to 0 instead of producing NaN
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
        product.reviews.length
      : 0;

  return (
    <Container className="py-5">
      <Row>
        <Col md={6}>
          <Card>
            <Card.Img
              variant="top"
              src={product.product_img || 'https://i.ibb.co/123pvjr/300x200.png'}
              alt={product.name}
              style={{ height: '400px', objectFit: 'contain' }}
            />
          </Card>
        </Col>

        <Col md={6}>
          <h1>{product.name}</h1>
          <h2 className="text-primary mb-4">${product.price.toFixed(2)}</h2>

          <div className="mb-3">
            {product.category.map((cat, index) => (
              <Badge bg="secondary" className="me-2" key={index}>
                {cat}
              </Badge>
            ))}
          </div>

          <p className="lead mb-4">{product.summary}</p>

          <div className="mb-4">
            <h4>Description</h4>
            <p>{product.description}</p>
            <div className="d-flex gap-2 mb-4">
              <Button
                variant="primary"
                size="lg"
                className="flex-grow-1"
                onClick={() => addToCart(product)}
              >
                Add to Cart
              </Button>
              <Link to="/cart">
                <Button variant="success" size="lg" onClick={() => addToCart(product)}>
                  Buy Now
                </Button>
              </Link>
            </div>

            <h4>Customer Reviews</h4>
            {product.reviews.length === 0 ? (
              <p className="text-muted">No reviews yet.</p>
            ) : (
              <>
                <div className="mb-2">
                  <span className="h5 me-2">
                    Average Rating: {averageRating.toFixed(1)}
                  </span>
                  {renderStars(Math.round(averageRating))}
                </div>
                <ListGroup>
                  {product.reviews.map((review, index) => (
                    <ListGroup.Item key={index}>
                      <div className="d-flex mb-1">{renderStars(review.rating)}</div>
                      <p className="mb-0">{review.comment}</p>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductPage;
