import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ListGroup,
  Modal,
  Form
} from 'react-bootstrap';
import { StarFill, Star } from 'react-bootstrap-icons';
import { useData } from '../../contexts/DataContext.js';
import { useCart } from '../../contexts/CartContext.js';
import axios from '../../api/axios.js';

const ProductPage = () => {
  const { id } = useParams();
  const { product, getProduct } = useData();
  const { addToCart } = useCart();

  // --- REVIEW MODAL STATE ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
        product.reviews.length
      : 0;

  // --- SUBMIT REVIEW ---
  const submitReview = async () => {
    try {
      setSubmittingReview(true);

      const newReview = {
        rating: reviewRating,
        comment: reviewComment,
        date: new Date().toISOString()
      };

      await axios.put(`api/products/update/${id}`, {
        reviews: [...product.reviews, newReview]
      });

      await getProduct(id);

      setReviewRating(0);
      setReviewComment('');
      setShowReviewModal(false);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

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

            {/* --- WRITE REVIEW BUTTON --- */}
            <Button
              variant="outline-primary"
              className="mb-3"
              onClick={() => setShowReviewModal(true)}
            >
              Write a Review
            </Button>

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

      {/* --- REVIEW MODAL --- */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Write a Review</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rating</Form.Label>
              <div className="d-flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Button
                    key={num}
                    variant={reviewRating === num ? 'warning' : 'outline-warning'}
                    onClick={() => setReviewRating(num)}
                  >
                    {num} ★
                  </Button>
                ))}
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write your review..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={submittingReview || reviewRating === 0}
            onClick={submitReview}
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductPage;