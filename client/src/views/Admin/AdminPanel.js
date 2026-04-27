import React, { useState } from 'react';
import { Container, Tabs, Tab, Card, Table, Button, Form, Modal } from 'react-bootstrap';
import { PlusCircle, Edit, Trash, User, Clock, Globe, CreditCard } from 'lucide-react';
import { useData } from '../../contexts/DataContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie, COOKIE_KEYS } from '../../Utils/cookieUtils.js';


const AdminPanel = () => {

  const [authError, setAuthError] = useState(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
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
    localDataCheck 
  } = useData();
  
  const navigate = useNavigate();
  // Modal states

  // Product management functions - simplified to match other data handling
  const handleAddProduct = async () => {
    try {
      if (currentProduct.id) {
        // Edit existing product
        await updateProduct(currentProduct.id, currentProduct);
      } else {
        // Add new product
        await createProduct(currentProduct);
      }
      // Refresh products data
      await getProducts();
      setShowProductModal(false);
      resetProductForm();
    } catch (error) {
      console.error('Error adding/editing product:', error);
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

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      // Refresh products data
      await getProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
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
      // API call would go here
      console.log(`Updating transaction ${transactionId} to ${newStatus}`);
      // Refresh transactions data after update
      await getTransactions();
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  };

  // Export transaction details handler
  const handleExportTransaction = (transaction) => {
    const exportData = {
      ...transaction,
      customerName: customers.find(c => c.id === transaction.customerId)?.name,
      exportDate: new Date().toISOString()
    };
    
    // In a real implementation, you might want to:
    // 1. Generate a PDF or CSV
    // 2. Use a proper export library
    // 3. Handle the download process
    console.log('Exporting transaction:', exportData);
  };


 
  // --- AUTH CHECK (recursive / polling) ---
  const pollForAdmin = async (attempt = 0) => {
    try {
      // Set the username to cookie for username
      const username = await getCookie(COOKIE_KEYS.USERNAME);
      const isAdmin = username === 'Admin';

      // Set the isAuthenticated boolean to the boolean cookie isAuthenticated
      const isAuthenticated = await getCookie(COOKIE_KEYS.IS_AUTHENTICATED);
      console.log(`Cookie Values - Username: ${username}, IsAuthenticated: ${isAuthenticated}, IsAdmin: ${isAdmin}`);

      // 1. USERNAME MUST EXIST
      if (!username) {
        if (attempt < 10) {
          await new Promise(res => setTimeout(res, 300));
          return pollForAdmin(attempt + 1);
        }
        setAuthError("NOT_AUTHENTICATED");
        setAuthCheckComplete(true);
        return;
      }
      console.log(`Auth check attempt (Username Check) ${attempt + 1}: username=${username}, isAdmin=${isAdmin}`);

      // 2. AUTH CONTEXT MUST BE READY
      if (!isAuthenticated) {
        if (attempt < 10) {
          await new Promise(res => setTimeout(res, 300));
          return pollForAdmin(attempt + 1);
        }
        setAuthError("NOT_AUTHENTICATED");
        setAuthCheckComplete(true);
        return;
      }
      console.log(`Auth check attempt (Auth Context Check) ${attempt + 1}: username=${username}, isAdmin=${isAdmin}`);

      // 3. ADMIN COOKIE MUST BE TRUE
      if (!isAdmin) {
        if (attempt < 10) {
          await new Promise(res => setTimeout(res, 300));
          return pollForAdmin(attempt + 1);
        }
        setAuthError("NOT_ADMIN");
        setAuthCheckComplete(true);
        return;
      }
      console.log(`Auth check attempt (Admin Check) ${attempt + 1}: username=${username}, isAdmin=${isAdmin}`);

      // 4. SUCCESS → LOAD DATA
      await initializeData();
      setAuthCheckComplete(true);

    } catch (err) {
      console.error("Auth check failed:", err);
      setAuthError("NOT_AUTHENTICATED");
      setAuthCheckComplete(true);
    }
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
      setAuthCheckComplete(true);
    }
  };

  // Initialize data on component mount
  useEffect(() => { 
    pollForAdmin();
  }, []);

  if (!authCheckComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="spinner" />
        <p className="mt-4 text-gray-600 text-lg">Checking authentication…</p>
      </div>
    );
  }

  if (authError === "NOT_AUTHENTICATED") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">You must be an admin to access this page.</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate('/home')}
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (authError === "NOT_ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">You do not have permission to access this page.</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate('/home')}
        >
          Return to Home
        </button>
      </div>
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
                  <PlusCircle className="mr-2" /> Add Product
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
                        <td>${product.price || '0.00'}</td>
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
                                      <strong>Rating: </strong>{review.rating}<br/>
                                      <strong>Comment: </strong>{review.comment}
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
                              src={product.product_img}
                              alt='Image not found'
                              style={{ width: '50px', height: '50px', objectFit: 'scale-down' }}
                            />
                        </td>
                        <td>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
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
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.lastLogin}</td>
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
                                  <th>Timestamp</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customer.ipHistory?.map((history, index) => (
                                  <tr key={index}>
                                    <td>{history.ip}</td>
                                    <td>{history.timestamp}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                        <td>{customer.totalOrders}</td>
                        <td>${customer.totalSpent}</td>
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
                        <td>{transaction.customerId}</td>
                        <td>${transaction.amount}</td>
                        <td>{transaction.status}</td>
                        <td>{transaction.timestamp}</td>
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
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.customerId}</td>
                        <td>{order.orderDate}</td>
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
                                  <th>Product ID</th>
                                  <th>Quantity</th>
                                  <th>Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.orderItems?.map(item => (
                                  <tr key={item.productId}>
                                    <td>{item.productId}</td>
                                    <td>{item.quantity}</td>
                                    <td>${item.price?.toFixed(2) || '0.00'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                        <td>${order.totalAmount}</td>
                        <td>{order.shippingAddress}</td>
                        <td>{order.paymentMethod}</td>
                        <td>{order.orderStatus}</td>
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
                    <td>{selectedCustomer.name}</td>
                  </tr>
                  <tr>
                    <td><strong>Email</strong></td>
                    <td>{selectedCustomer.email}</td>
                  </tr>
                  <tr>
                    <td><strong>Last Login</strong></td>
                    <td>{selectedCustomer.lastLogin}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Orders</strong></td>
                    <td>{selectedCustomer.totalOrders}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Spent</strong></td>
                    <td>${selectedCustomer.totalSpent}</td>
                  </tr>
                </tbody>
              </Table>

              <h5 className="mt-4">IP History</h5>
              <Table striped bordered>
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.ipHistory?.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.ip}</td>
                      <td>{entry.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
                    <td>{customers?.find(c => c.id === selectedTransaction.customerId)?.name}</td>
                  </tr>
                  <tr>
                    <td><strong>Amount</strong></td>
                    <td>${selectedTransaction.amount}</td>
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
                    <td>{selectedTransaction.timestamp}</td>
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
                          <div className="text-muted small">{event.timestamp}</div>
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
                            <td>${item.price?.toFixed(2) || '0.00'}</td>
                            <td>${((item.quantity * item.price) || 0).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Total</strong></td>
                        <td><strong>${selectedTransaction.amount}</strong></td>
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