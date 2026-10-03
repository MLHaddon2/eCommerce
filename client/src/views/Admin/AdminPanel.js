import React, { useState } from 'react';
import { Container, Tabs, Tab, Card, Table, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { PlusCircle, Edit, Trash, User, Clock, CreditCard } from 'lucide-react';
import { useData } from '../../contexts/DataContext.js';
import OrderStatusEditor from '../../components/admin/OrderStatusEditor.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


// Order lines from checkout carry price (dollars) and unitPriceCents; older rows may have only one.
const itemPrice = (item) => Number(item.price ?? (item.unitPriceCents ?? 0) / 100) || 0;

// "$308.10", not "$308.1" — amounts arrive as numbers or DECIMAL strings.
const money = (value) => `$${(Number(value) || 0).toFixed(2)}`;

// Dates arrive as ISO strings or (customers.lastLogin) UTC strings; show them in local time.
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const customerName = (customer) =>
  customer
    ? [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.name || customer.email || '—'
    : 'Guest';

// customers.ipHistory is a list of IP strings (see recordLogin in Controllers/Users.js);
// older rows may hold { ip, timestamp } objects.
const ipEntries = (customer) =>
  (Array.isArray(customer?.ipHistory) ? customer.ipHistory : []).map((entry) =>
    typeof entry === 'string' ? { ip: entry } : entry
  );

const AdminPanel = () => {

  // isAdmin comes from the server-signed token (see AuthContext). This only decides
  // what to render — every admin API route is also protected by verifyAdmin on the server.
  const { authChecked, isAuthenticated, isAdmin } = useAuth();
  const authError = !authChecked ? null : !isAuthenticated ? "NOT_AUTHENTICATED" : !isAdmin ? "NOT_ADMIN" : null;
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    price: 0,
    summary: '',
    description: '',
    availability: 0,
    reviews: [],
    category: [],
    product_img: '',
  });
  
  // Data from context - consistent approach for all data types
  const { 
    products, 
    customers, 
    transactions, 
    orders,
    getProducts, 
    getCustomers, 
    getTransactions, 
    getOrders,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductReview,
    updateTransactionStatus,
    localDataCheck 
  } = useData();
  
  const navigate = useNavigate();
  // Modal states

  // Review moderation — admins can delete any review.
  const handleDeleteReview = async (productId, reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteProductReview(productId, reviewId);
    } catch (error) {
      window.alert(error.message);
    }
  };

  // Product management functions - simplified to match other data handling
  const handleAddProduct = async () => {
    try {
      // The category field is typed as "a, b, c": drop the stray spaces and empty tags.
      const product = {
        ...currentProduct,
        category: currentProduct.category.map((tag) => String(tag).trim()).filter(Boolean)
      };
      if (product.id) {
        // Edit existing product
        await updateProduct(product.id, product);
      } else {
        // Add new product
        await createProduct(product);
      }
      // Refresh products data
      await getProducts();
      setShowProductModal(false);
      resetProductForm();
    } catch (error) {
      console.error('Error adding/editing product:', error);
      window.alert(`Could not save the product: ${error.message}`);
    }
  };

  const handleEditProduct = (product) => {
    setCurrentProduct({
      ...product,
      category: Array.isArray(product.category) ? product.category : [],
      reviews: Array.isArray(product.reviews)
        ? product.reviews
        : (() => { try { return JSON.parse(product.reviews); } catch { return []; } })()
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      // Refresh products data
      await getProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      window.alert(`Could not delete the product: ${error.message}`);
    }
  };

  const resetProductForm = () => {
    setCurrentProduct({
      name: '',
      price: 0,
      summary: '',
      description: '',
      availability: 0,
      reviews: [],
      category: [],
      product_img: '',
    });
  };

  // Customer detail view
  const handleViewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  // Transaction detail view
  const handleViewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Helper function for status colors
  const getStatusColor = (status) => {
    const statusColors = {
      'Completed': 'success',
      'Processing': 'primary',
      'On Hold': 'warning',
      'Failed': 'danger',
      'Refunded': 'secondary'
    };
    return statusColors[status] || 'primary';
  };

  // Transaction status update handler
  const handleUpdateStatus = async (transactionId, newStatus) => {
    try {
      const updated = await updateTransactionStatus(transactionId, newStatus);
      setSelectedTransaction(updated);
    } catch (error) {
      window.alert(error.message);
    }
  };

  // Export transaction details — downloads a JSON file with the transaction, its order and customer.
  const handleExportTransaction = (transaction) => {
    const customer = customers.find(c => c.id === transaction.customerId);
    const exportData = {
      ...transaction,
      customerName: customer ? customerName(customer) : null,
      customerEmail: customer?.email ?? null,
      order: orders.find(o => o.id === transaction.orderId) ?? null,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-${transaction.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };


 
  const initializeData = async () => {
    try {
      await Promise.all([
        getProducts(),
        getCustomers(),
        getTransactions(),
        getOrders()
      ]);
      
      localDataCheck();

    } catch (error) {
      console.error("Error initializing data:", error);
    }
  };

  // Load admin data once the server has confirmed this user is an admin
  useEffect(() => {
    if (authChecked && isAdmin) initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, isAdmin]);

  if (!authChecked) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" size="sm" /> Checking authentication…
      </Container>
    );
  }

  if (authError === "NOT_AUTHENTICATED") {
    return (
      <Container className="mt-5 text-center">
        <h2 className="mb-4">Please log in as an admin to access this page.</h2>
        <Button variant="primary" className="me-2" onClick={() => navigate('/login')}>Log in</Button>
        <Button variant="outline-secondary" onClick={() => navigate('/home')}>Return to Home</Button>
      </Container>
    );
  }

  if (authError === "NOT_ADMIN") {
    return (
      <Container className="mt-5 text-center">
        <h2 className="mb-4">You do not have permission to access this page.</h2>
        <Button variant="primary" onClick={() => navigate('/home')}>Return to Home</Button>
      </Container>
    );
  }

if (!authError) {
  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">E-Commerce Admin Panel</h1>
      <Tabs defaultActiveKey="products" className="mb-3">
        {/* Products Tab */}
        <Tab eventKey="products" title="Products">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4>Products</h4>
                <Button 
                  variant="success" 
                  onClick={() => {
                    resetProductForm();
                    setShowProductModal(true);
                  }}
                >
                  <PlusCircle size={18} className="me-1" /> Add Product
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {products && products.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Summary</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Reviews</th>
                      <th>Availability</th>
                      <th>Category</th>
                      <th>Image</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{product.summary}</td>
                        <td>{product.description}</td>
                        <td>{money(product.price)}</td>
                        <td>
                          <div style={{ 
                            maxHeight: '200px', 
                            overflowY: 'scroll', 
                            position: 'relative',
                            width: '100%' 
                          }}>
                            {(() => {
                              const reviews = Array.isArray(product.reviews)
                                ? product.reviews
                                : (() => { try { return JSON.parse(product.reviews); } catch { return []; } })();
                              return reviews.length > 0
                                ? reviews.map((review, index) => (
                                    <div key={index} style={{ 
                                      borderBottom: '1px solid #dee2e6', 
                                      padding: '8px'
                                    }}>
                                      <strong>Rating: </strong>{review.rating}
                                      {review.username && <> by {review.username}</>}<br/>
                                      <strong>Comment: </strong>{review.comment}
                                      {review.id && (
                                        <div>
                                          <Button
                                            size="sm"
                                            variant="link"
                                            className="text-danger p-0"
                                            onClick={() => handleDeleteReview(product.id, review.id)}
                                          >
                                            Delete review
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                : "No Reviews";
                            })()}
                          </div>
                        </td>
                        <td>{product.availability}</td>
                        <td>{Array.isArray(product.category) ? product.category.join(", ") : product.category}</td>
                        <td>
                            <img 
                              src={product.product_img || 'https://i.ibb.co/123pvjr/300x200.png'}
                              alt={product.name}
                              style={{ width: '50px', height: '50px', objectFit: 'scale-down' }}
                            />
                        </td>
                        <td>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="me-2"
                            aria-label={`Edit ${product.name}`}
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            aria-label={`Delete ${product.name}`}
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No products available.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Customers Tab */}
        <Tab eventKey="customers" title="Customers">
          <Card>
            <Card.Header>
              <h4>Customer Management</h4>
            </Card.Header>
            <Card.Body>
              {customers && customers.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Last Login</th>
                      <th>IP History</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(customer => (
                      <tr key={customer.id}>
                        <td>{customer.id}</td>
                        <td>{customerName(customer)}</td>
                        <td>{customer.email}</td>
                        <td>{formatDate(customer.lastLogin)}</td>
                        <td>
                          <div style={{ 
                            maxHeight: '100px', 
                            overflowY: 'scroll', 
                            position: 'relative',
                            width: '100%'
                          }}>
                            <table className="table table-striped table-bordered mb-0">
                              <thead>
                                <tr>
                                  <th>IP</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ipEntries(customer).map((history, index) => (
                                  <tr key={index}>
                                    <td>{history.ip}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                        <td>{customer.totalOrders}</td>
                        <td>{money(customer.totalSpent)}</td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm"
                            onClick={() => handleViewCustomerDetails(customer)}
                          >
                            <User size={16} className="me-1" /> View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No customers available.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Transactions Tab */}
        <Tab eventKey="transactions" title="Transactions">
          <Card>
            <Card.Header>
              <h4>Transaction History</h4>
            </Card.Header>
            <Card.Body>
              {transactions && transactions.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                      <th>Payment Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{transaction.orderId}</td>
                        <td>{transaction.customerId ?? 'Guest'}</td>
                        <td>{money(transaction.amount)}</td>
                        <td>{transaction.status}</td>
                        <td>{formatDate(transaction.timestamp)}</td>
                        <td>{transaction.paymentMethod}</td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm"
                            onClick={() => handleViewTransactionDetails(transaction)}
                          >
                            <CreditCard size={16} className="me-1" /> View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No transactions available.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Orders Tab */}
        <Tab eventKey="orders" title="Orders">
          <Card>
            <Card.Header>
              <h4>Orders</h4>
            </Card.Header>
            <Card.Body>              
              {orders && orders.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Order Date</th>
                      <th>Order Items</th>
                      <th>Total</th>
                      <th>Shipping Address</th>
                      <th>Payment Method</th>
                      <th>Status / Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>
                          {order.customerId ?? 'Guest'}
                          {order.customerEmail && <div className="small text-muted">{order.customerEmail}</div>}
                        </td>
                        <td>{new Date(order.orderDate).toLocaleString()}</td>
                        <td>
                          <div style={{ 
                            maxHeight: '100px', 
                            overflowY: 'scroll', 
                            position: 'relative',
                            width: '100%'
                          }}>
                            <table className="table table-striped table-bordered mb-0">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Quantity</th>
                                  <th>Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.orderItems?.map((item, index) => (
                                  <tr key={index}>
                                    <td>{item.name ? `${item.name} (#${item.productId})` : item.productId}</td>
                                    <td>{item.quantity}</td>
                                    <td>${itemPrice(item).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                        <td>{money(order.totalAmount)}</td>
                        <td>{order.shippingAddress}</td>
                        <td>{order.paymentMethod}</td>
                        <td><OrderStatusEditor order={order} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No orders available.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Product Modal */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentProduct.id ? 'Edit Product' : 'Add New Product'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Product Name</Form.Label>
              <Form.Control 
                type="text" 
                value={currentProduct.name}
                onChange={(e) => setCurrentProduct({
                  ...currentProduct, 
                  name: e.target.value
                })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control 
                type="number" 
                step="0.01"
                value={currentProduct.price}
                onChange={(e) => setCurrentProduct({
                  ...currentProduct, 
                  price: parseFloat(e.target.value) || 0
                })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Summary</Form.Label>
              <Form.Control 
                type="text" 
                value={currentProduct.summary}
                onChange={(e) => setCurrentProduct({
                  ...currentProduct, 
                  summary: e.target.value
                })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Description</Form.Label>
              <Form.Control 
                as="textarea"
                rows={3}
                value={currentProduct.description}
                onChange={(e) => setCurrentProduct({
                  ...currentProduct, 
                  description: e.target.value
                })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Availability</Form.Label>
              <Form.Control 
                type="number" 
                value={currentProduct.availability}
                onChange={(e) => setCurrentProduct({
                  ...currentProduct, 
                  availability: parseInt(e.target.value) || 0
                })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category (comma-separated)</Form.Label>
              <Form.Control 
                type="text" 
                value={currentProduct.category}
                onChange={(e) => setCurrentProduct({
                  ...currentProduct, 
                  category: e.target.value.split(',')
                })}
                placeholder="Electronics, Gadgets, Accessories"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Image URL</Form.Label>
              <Form.Control 
                type="text" 
                value={currentProduct.product_img}
                onChange={(e) => setCurrentProduct({
                  ...currentProduct, 
                  product_img: e.target.value
                })}
                placeholder="https://example.com/image.jpg"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProductModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddProduct}>
            {currentProduct.id ? 'Update Product' : 'Add Product'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Customer Details Modal */}
      <Modal 
        show={showCustomerModal} 
        onHide={() => setShowCustomerModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Customer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <>
              <h5>Basic Information</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <td><strong>Name</strong></td>
                    <td>{customerName(selectedCustomer)}</td>
                  </tr>
                  <tr>
                    <td><strong>Email</strong></td>
                    <td>{selectedCustomer.email}</td>
                  </tr>
                  <tr>
                    <td><strong>Last Login</strong></td>
                    <td>{formatDate(selectedCustomer.lastLogin)}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Orders</strong></td>
                    <td>{selectedCustomer.totalOrders}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Spent</strong></td>
                    <td>{money(selectedCustomer.totalSpent)}</td>
                  </tr>
                </tbody>
              </Table>

              <h5 className="mt-4">IP History</h5>
              {ipEntries(selectedCustomer).length === 0 ? (
                <p className="text-muted">No logins recorded yet.</p>
              ) : (
                <Table striped bordered>
                  <thead>
                    <tr>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ipEntries(selectedCustomer).map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal 
        show={showTransactionModal} 
        onHide={() => setShowTransactionModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Transaction Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <>
              <Table bordered>
                <tbody>
                  <tr>
                    <td><strong>Transaction ID</strong></td>
                    <td>{selectedTransaction.id}</td>
                  </tr>
                  <tr>
                    <td><strong>Order ID</strong></td>
                    <td>{selectedTransaction.orderId}</td>
                  </tr>
                  <tr>
                    <td><strong>Customer</strong></td>
                    <td>{customerName(customers?.find(c => c.id === selectedTransaction.customerId))}</td>
                  </tr>
                  <tr>
                    <td><strong>Amount</strong></td>
                    <td>{money(selectedTransaction.amount)}</td>
                  </tr>
                  <tr>
                    <td><strong>Status</strong></td>
                    <td>
                      <span className={`badge bg-${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Payment Method</strong></td>
                    <td>
                      {selectedTransaction.paymentMethod}
                      {selectedTransaction.lastFour && ` (**** **** **** ${selectedTransaction.lastFour})`}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Timestamp</strong></td>
                    <td>{formatDate(selectedTransaction.timestamp)}</td>
                  </tr>
                </tbody>
              </Table>

              {/* Transaction Timeline */}
              {selectedTransaction.timeline && (
                <>
                  <h6 className="mt-4 mb-3">Transaction Timeline</h6>
                  <div className="transaction-timeline">
                    {selectedTransaction.timeline.map((event, index) => (
                      <div key={index} className="timeline-item d-flex mb-3">
                        <div className="timeline-icon me-3">
                          <Clock size={16} />
                        </div>
                        <div className="timeline-content">
                          <div className="fw-bold">{event.status}</div>
                          <div className="text-muted small">{formatDate(event.date ?? event.timestamp)}</div>
                          {event.notes?.map((note, noteIndex) => (
                            <div key={noteIndex} className="timeline-notes mt-1">{note.details}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Related Order Details */}
              {orders && orders.length > 0 && (
                <>
                  <h6 className="mt-4 mb-3">Order Items</h6>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.find(order => order.id === selectedTransaction.orderId)?.orderItems?.map((item, index) => {
                        const product = products?.find(p => p.id === item.productId);
                        return (
                          <tr key={index}>
                            <td>{product?.name || `Product ${item.productId}`}</td>
                            <td>{item.quantity}</td>
                            <td>${itemPrice(item).toFixed(2)}</td>
                            <td>${(item.quantity * itemPrice(item)).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Total</strong></td>
                        <td><strong>{money(selectedTransaction.amount)}</strong></td>
                      </tr>
                    </tfoot>
                  </Table>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => handleExportTransaction(selectedTransaction)}
          >
            Export Details
          </Button>
          {selectedTransaction?.status === 'Processing' && (
            <>
              <Button 
                variant="warning" 
                size="sm"
                onClick={() => handleUpdateStatus(selectedTransaction.id, 'On Hold')}
              >
                Put on Hold
              </Button>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => handleUpdateStatus(selectedTransaction.id, 'Completed')}
              >
                Mark as Completed
              </Button>
            </>
          )}
          <Button variant="primary" onClick={() => setShowTransactionModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
};

export default AdminPanel;