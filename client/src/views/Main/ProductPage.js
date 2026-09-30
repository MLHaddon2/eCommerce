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
import { useAuth } from '../../contexts/AuthContext.js';
import axios from '../../api/axios.js';

const ProductPage = () => {
  const { id } = useParams();
  const { product, getProduct } = useData();
  const { addToCart } = useCart();
  const { isAuthenticated, isAdmin, userId } = useAuth();

  // --- REVIEW MODAL STATE ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null); // null = writing a new review

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

  const isOwnReview = (review) => userId != null && String(review.userId) === String(userId);

  const openReviewModal = (review = null) => {
    setEditingReviewId(review ? review.id : null);
    setReviewRating(review ? review.rating : 0);
    setReviewComment(review ? review.comment : '');
    setReviewError('');
    setShowReviewModal(true);
  };

  // --- SUBMIT (NEW OR EDITED) REVIEW ---
  const submitReview = async () => {
    try {
      setSubmittingReview(true);
      setReviewError('');

      // Author and date are set by the server from the logged-in user.
      const body = { rating: reviewRating, comment: reviewComment };
      if (editingReviewId) {
        await axios.put(`/api/products/${id}/reviews/${editingReviewId}`, body);
      } else {
        await axios.post(`/api/products/${id}/reviews`, body);
      }

      await getProduct(id);

      setReviewRating(0);
      setReviewComment('');
      setEditingReviewId(null);
      setShowReviewModal(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError(err.response?.data?.message || 'Could not submit your review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await axios.delete(`/api/products/${id}/reviews/${review.id}`);
      await getProduct(id);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not delete the review.');
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
            {isAuthenticated ? (
              <Button
                variant="outline-primary"
                className="mb-3"
                onClick={() => openReviewModal()}
              >
                Write a Review
              </Button>
            ) : (
              <p className="text-muted mb-3">
                <Link to="/login">Log in</Link> to write a review.
              </p>
            )}

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
                    <ListGroup.Item key={review.id || index}>
                      <div className="d-flex align-items-center mb-1">
                        {renderStars(review.rating)}
                        {review.username && <small className="text-muted ms-2">{review.username}</small>}
                        {review.editedAt && <small className="text-muted ms-2">(edited)</small>}
                        {review.id && (isOwnReview(review) || isAdmin) && (
                          <span className="ms-auto d-flex gap-2">
                            {isOwnReview(review) && (
                              <Button size="sm" variant="outline-secondary" onClick={() => openReviewModal(review)}>
                                Edit
                              </Button>
                            )}
                            <Button size="sm" variant="outline-danger" onClick={() => deleteReview(review)}>
                              Delete
                            </Button>
                          </span>
                        )}
                      </div>
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
          <Modal.Title>{editingReviewId ? 'Edit Your Review' : 'Write a Review'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {reviewError && <p className="text-danger">{reviewError}</p>}
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
            {submittingReview ? 'Saving...' : editingReviewId ? 'Save Changes' : 'Submit Review'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductPage;