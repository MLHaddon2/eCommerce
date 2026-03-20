import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from '../api/axios';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transaction, setTransaction] = useState(null);
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [ipHistories, setIpHistories] = useState([]);
  const [ipHistory, setIpHistory] = useState(null);
  
  // Add loading states
  const [loading, setLoading] = useState({
    products: false,
    product: false,
    customers: false,
    customer: false,
    transactions: false,
    transaction: false,
    orders: false,
    order: false,
    ipHistories: false,
    ipHistory: false
  });
  
  // Add error states
  const [errors, setErrors] = useState({
    products: null,
    product: null,
    customers: null,
    customer: null,
    transactions: null,
    transaction: null,
    orders: null,
    order: null,
    ipHistories: null,
    ipHistory: null
  });

  // Utility function to handle API errors
  const handleApiError = (error, context) => {
    const errorMessage = error.response?.data?.message || error.message || `Failed to ${context}`;
    console.error(`Error ${context}:`, error);
    return errorMessage;
  };

  // Products API functions
  const getProducts = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setErrors(prev => ({ ...prev, products: null }));
      
      const res = await axios.get('/api/products/getallhistory');
      console.log("Products fetched:", res.data);
      setProducts(res.data || []);
      return res.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching products');
      setErrors(prev => ({ ...prev, products: errorMessage }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  const getProduct = useCallback(async (id) => {
    try {
      setLoading(prev => ({ ...prev, product: true }));
      setErrors(prev => ({ ...prev, product: null }));
      
      const res = await axios.get(`/api/products/get/${id}`);
      if (res.status === 200) {
        console.log(res);
        setProduct(res.data.product);
        return res.data.product;
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching product');
      setErrors(prev => ({ ...prev, product: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, product: false }));
    }
  }, []);

  const createProduct = useCallback(async (productData) => {
    try {
      const res = await axios.post('/api/products/create', productData);
      if (res.status === 200 || res.status === 201) {
        const newProduct = res.data.product || res.data;
        setProducts(prev => [...prev, newProduct]);
        return newProduct;
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'creating product');
      throw new Error(errorMessage);
    }
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    try {
      const res = await axios.put(`/api/products/update/${id}`, productData);
      if (res.status === 200) {
        const updatedProduct = res.data.product || res.data;
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        if (product && product.id === id) {
          setProduct(updatedProduct);
        }
        return updatedProduct;
      } else {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'updating product');
      throw new Error(errorMessage);
    }
  }, [product]);

  const deleteProduct = useCallback(async (id) => {
    try {
      const res = await axios.delete(`/api/products/delete/${id}`);
      if (res.status === 200) {
        setProducts(prev => prev.filter(p => p.id !== id));
        if (product && product.id === id) {
          setProduct(null);
        }
        return true;
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'deleting product');
      throw new Error(errorMessage);
    }
  }, [product]);

  // Review management functions (placeholder until backend is implemented)
  const addProductReview = useCallback(async (productId, reviewData) => {
    try {
      const res = await axios.post(`/api/products/${productId}/reviews`, reviewData);
      if (res.status === 200 || res.status === 201) {
        const updatedProduct = res.data;
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        return updatedProduct;
      } else {
        throw new Error('Failed to add review');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'adding review');
      throw new Error(errorMessage);
    }
  }, []);

  const updateProductReview = useCallback(async (productId, reviewId, reviewData) => {
    try {
      const res = await axios.put(`/api/products/${productId}/reviews/${reviewId}`, reviewData);
      if (res.status === 200) {
        const updatedProduct = res.data;
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        return updatedProduct;
      } else {
        throw new Error('Failed to update review');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'updating review');
      throw new Error(errorMessage);
    }
  }, []);

  const deleteProductReview = useCallback(async (productId, reviewId) => {
    try {
      const res = await axios.delete(`/api/products/${productId}/reviews/${reviewId}`);
      if (res.status === 200) {
        const updatedProduct = res.data;
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        return updatedProduct;
      } else {
        throw new Error('Failed to delete review');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'deleting review');
      throw new Error(errorMessage);
    }
  }, []);

  // Customers API functions
  const getCustomers = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, customers: true }));
      setErrors(prev => ({ ...prev, customers: null }));
      
      const res = await axios.get('/api/customers/get');
      console.log("Customers fetched:", res.data);
      setCustomers(res.data || []);
      return res.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching customers');
      setErrors(prev => ({ ...prev, customers: errorMessage }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  }, []);

  const getCustomer = useCallback(async (id) => {
    try {
      setLoading(prev => ({ ...prev, customer: true }));
      setErrors(prev => ({ ...prev, customer: null }));
      
      const res = await axios.get(`/api/customers/get/${id}`);
      if (res.status === 200) {
        setCustomer(res.data);
        return res.data;
      } else {
        throw new Error('Customer not found');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching customer');
      setErrors(prev => ({ ...prev, customer: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, customer: false }));
    }
  }, []);

  const createCustomer = useCallback(async (customerData) => {
    try {
      const res = await axios.post('/api/customers/create', customerData);
      if (res.status === 200 || res.status === 201) {
        const newCustomer = res.data.customer || res.data;
        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'creating customer');
      throw new Error(errorMessage);
    }
  }, []);

  const updateCustomer = useCallback(async (id, customerData) => {
    try {
      const res = await axios.put(`/api/customers/update/${id}`, { ...customerData, id });
      if (res.status === 200) {
        const updatedCustomer = res.data.updatedCustomer || res.data;
        setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
        if (customer && customer.id === id) {
          setCustomer(updatedCustomer);
        }
        return updatedCustomer;
      } else {
        throw new Error('Failed to update customer');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'updating customer');
      throw new Error(errorMessage);
    }
  }, [customer]);

  const deleteCustomer = useCallback(async (id) => {
    try {
      const res = await axios.delete(`/api/customers/delete/${id}`);
      if (res.status === 200) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        if (customer && customer.id === id) {
          setCustomer(null);
        }
        return true;
      } else {
        throw new Error('Failed to delete customer');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'deleting customer');
      throw new Error(errorMessage);
    }
  }, [customer]);

  // Transactions API functions
  const getTransactions = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      setErrors(prev => ({ ...prev, transactions: null }));
      
      const res = await axios.get('/api/transactions/get');
      console.log("Transactions fetched:", res.data);
      setTransactions(res.data || []);
      return res.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching transactions');
      setErrors(prev => ({ ...prev, transactions: errorMessage }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, []);

  const getTransaction = useCallback(async (id) => {
    try {
      setLoading(prev => ({ ...prev, transaction: true }));
      setErrors(prev => ({ ...prev, transaction: null }));
      
      const res = await axios.get(`/api/transactions/get/${id}`);
      if (res.status === 200) {
        setTransaction(res.data);
        return res.data;
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching transaction');
      setErrors(prev => ({ ...prev, transaction: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, transaction: false }));
    }
  }, []);

  const createTransaction = useCallback(async (transactionData) => {
    try {
      const res = await axios.post('/api/transactions/create', transactionData);
      if (res.status === 200 || res.status === 201) {
        const newTransaction = res.data;
        setTransactions(prev => [...prev, newTransaction]);
        return newTransaction;
      } else {
        throw new Error('Failed to create transaction');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'creating transaction');
      throw new Error(errorMessage);
    }
  }, []);

  const updateTransaction = useCallback(async (id, transactionData) => {
    try {
      const res = await axios.put(`/api/transactions/update/${id}`, { ...transactionData, id });
      if (res.status === 200) {
        const updatedTransaction = res.data.updatedTransaction || res.data;
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        if (transaction && transaction.id === id) {
          setTransaction(updatedTransaction);
        }
        return updatedTransaction;
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'updating transaction');
      throw new Error(errorMessage);
    }
  }, [transaction]);

  const updateTransactionStatus = useCallback(async (id, status) => {
    try {
      const res = await axios.put(`/api/transactions/update/${id}`, { id, status });
      if (res.status === 200) {
        const updatedTransaction = res.data.updatedTransaction || res.data;
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        if (transaction && transaction.id === id) {
          setTransaction(updatedTransaction);
        }
        return updatedTransaction;
      } else {
        throw new Error('Failed to update transaction status');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'updating transaction status');
      throw new Error(errorMessage);
    }
  }, [transaction]);

  const deleteTransaction = useCallback(async (id) => {
    try {
      const res = await axios.delete(`/api/transactions/delete/${id}`);
      if (res.status === 200) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        if (transaction && transaction.id === id) {
          setTransaction(null);
        }
        return true;
      } else {
        throw new Error('Failed to delete transaction');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'deleting transaction');
      throw new Error(errorMessage);
    }
  }, [transaction]);

  // Orders API functions
  const getOrders = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, orders: true }));
      setErrors(prev => ({ ...prev, orders: null }));
      
      const res = await axios.get('/api/orders/get');
      console.log("Orders fetched:", res.data);
      setOrders(res.data || []);
      return res.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching orders');
      setErrors(prev => ({ ...prev, orders: errorMessage }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  }, []);

  const getOrder = useCallback(async (id) => {
    try {
      setLoading(prev => ({ ...prev, order: true }));
      setErrors(prev => ({ ...prev, order: null }));
      
      const res = await axios.get(`/api/orders/get/${id}`);
      if (res.status === 200) {
        setOrder(res.data);
        return res.data;
      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching order');
      setErrors(prev => ({ ...prev, order: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, order: false }));
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    try {
      const res = await axios.post('/api/orders/create', orderData);
      if (res.status === 200 || res.status === 201) {
        const newOrder = res.data;
        setOrders(prev => [...prev, newOrder]);
        return newOrder;
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'creating order');
      throw new Error(errorMessage);
    }
  }, []);

  const updateOrder = useCallback(async (id, orderData) => {
    try {
      const res = await axios.put(`/api/orders/update/${id}`, { ...orderData, id });
      if (res.status === 200) {
        const updatedOrder = res.data.updatedOrder || res.data;
        setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
        if (order && order.id === id) {
          setOrder(updatedOrder);
        }
        return updatedOrder;
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'updating order');
      throw new Error(errorMessage);
    }
  }, [order]);

  const updateOrderStatus = useCallback(async (id, status) => {
    try {
      const res = await axios.put(`/api/orders/update/${id}`, { id, status });
      if (res.status === 200) {
        const updatedOrder = res.data.updatedOrder || res.data;
        setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
        if (order && order.id === id) {
          setOrder(updatedOrder);
        }
        return updatedOrder;
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'updating order status');
      throw new Error(errorMessage);
    }
  }, [order]);

  const deleteOrder = useCallback(async (id) => {
    try {
      const res = await axios.delete(`/api/orders/delete/${id}`);
      if (res.status === 200) {
        setOrders(prev => prev.filter(o => o.id !== id));
        if (order && order.id === id) {
          setOrder(null);
        }
        return true;
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'deleting order');
      throw new Error(errorMessage);
    }
  }, [order]);

  // IP History API functions
  const getIpHistories = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, ipHistories: true }));
      setErrors(prev => ({ ...prev, ipHistories: null }));
      
      const res = await axios.get('/api/ip-history');
      console.log("IP Histories fetched:", res.data);
      setIpHistories(res.data || []);
      return res.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching IP histories');
      setErrors(prev => ({ ...prev, ipHistories: errorMessage }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, ipHistories: false }));
    }
  }, []);

  const getIpHistory = useCallback(async (ip) => {
    try {
      setLoading(prev => ({ ...prev, ipHistory: true }));
      setErrors(prev => ({ ...prev, ipHistory: null }));
      
      const res = await axios.get(`/api/ip-history/${ip}`);
      if (res.status === 200) {
        setIpHistory(res.data);
        return res.data;
      } else {
        throw new Error('IP History not found');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching IP history');
      setErrors(prev => ({ ...prev, ipHistory: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, ipHistory: false }));
    }
  }, []);

  const createIpHistory = useCallback(async (ipHistoryData) => {
    try {
      const res = await axios.post('/api/ip-history/create', ipHistoryData);
      if (res.status === 200 || res.status === 201) {
        const newIpHistory = res.data;
        setIpHistories(prev => [...prev, newIpHistory]);
        return newIpHistory;
      } else {
        throw new Error('Failed to create IP history');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'creating IP history');
      throw new Error(errorMessage);
    }
  }, []);

  const updateIpHistory = useCallback(async (id, ipHistoryData) => {
    try {
      const res = await axios.put(`/api/ip-history/update/${id}`, ipHistoryData);
      if (res.status === 200) {
        const updatedIpHistory = res.data;
        setIpHistories(prev => prev.map(ip => ip.id === id ? updatedIpHistory : ip));
        if (ipHistory && ipHistory.id === id) {
          setIpHistory(updatedIpHistory);
        }
        return updatedIpHistory;
      } else {
        throw new Error('Failed to update IP history');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'updating IP history');
      throw new Error(errorMessage);
    }
  }, [ipHistory]);

  const deleteIpHistory = useCallback(async (id, ip) => {
    try {
      const res = await axios.delete(`/api/ip-history/delete/${ip}`);
      if (res.status === 200) {
        setIpHistories(prev => prev.filter(ip => ip.id !== id));
        if (ipHistory && ipHistory.id === id) {
          setIpHistory(null);
        }
        return true;
      } else {
        throw new Error('Failed to delete IP history');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'deleting IP history');
      throw new Error(errorMessage);
    }
  }, [ipHistory]);

  // Checks that all local state arrays are populated and logs a summary report
  const localDataCheck = useCallback(() => {
    const checks = {
      products:     { count: products.length,     loaded: products.length > 0 },
      customers:    { count: customers.length,    loaded: customers.length > 0 },
      transactions: { count: transactions.length, loaded: transactions.length > 0 },
      orders:       { count: orders.length,       loaded: orders.length > 0 },
      ipHistories:  { count: ipHistories.length,  loaded: ipHistories.length > 0 },
    };

    const allLoaded = Object.values(checks).every(c => c.loaded);
    const anyErrors = Object.values(errors).some(e => e !== null);

    console.group('📋 LocalDataCheck Report');
    Object.entries(checks).forEach(([key, { count, loaded }]) => {
      const icon = loaded ? '✅' : '⚠️';
      console.log(`${icon} ${key}: ${count} record(s) ${loaded ? 'loaded' : 'EMPTY'}`);
    });
    if (anyErrors) {
      console.group('❌ Active Errors');
      Object.entries(errors).forEach(([key, err]) => {
        if (err) console.warn(`  ${key}:`, err);
      });
      console.groupEnd();
    }
    console.log(allLoaded && !anyErrors ? '✅ All data loaded successfully.' : '⚠️ Some data is missing or has errors.');
    console.groupEnd();

    return { checks, allLoaded, anyErrors };
  }, [products, customers, transactions, orders, ipHistories, errors]);

  // Initialize all data
  const initializeData = useCallback(async () => {
    try {
      await Promise.all([
        getProducts(),
        getCustomers(),
        getTransactions(),
        getOrders(),
        getIpHistories()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }, [getProducts, getCustomers, getTransactions, getOrders, getIpHistories]);

  // Clear all data
  const clearData = useCallback(() => {
    setProducts([]);
    setProduct(null);
    setCustomers([]);
    setCustomer(null);
    setTransactions([]);
    setTransaction(null);
    setOrders([]);
    setOrder(null);
    setIpHistories([]);
    setIpHistory(null);
    setLoading({
      products: false,
      product: false,
      customers: false,
      customer: false,
      transactions: false,
      transaction: false,
      orders: false,
      order: false,
      ipHistories: false,
      ipHistory: false
    });
    setErrors({
      products: null,
      product: null,
      customers: null,
      customer: null,
      transactions: null,
      transaction: null,
      orders: null,
      order: null,
      ipHistories: null,
      ipHistory: null
    });
  }, []);

  // Refresh functions for individual entities
  const refreshProducts = useCallback(async () => {
    return await getProducts();
  }, [getProducts]);

  const refreshCustomers = useCallback(async () => {
    return await getCustomers();
  }, [getCustomers]);

  const refreshTransactions = useCallback(async () => {
    return await getTransactions();
  }, [getTransactions]);

  const refreshOrders = useCallback(async () => {
    return await getOrders();
  }, [getOrders]);

  const refreshIpHistories = useCallback(async () => {
    return await getIpHistories();
  }, [getIpHistories]);
  
  return (
    <DataContext.Provider 
      value={{
        // Data
        products,
        product,
        customers,
        customer,
        transactions,
        transaction,
        orders,
        order,
        ipHistories,
        ipHistory,
        
        // Loading states
        loading,
        
        // Error states
        errors,
        
        // Product actions
        getProducts,
        getProduct,
        createProduct,
        updateProduct,
        deleteProduct,
        
        // Review actions
        addProductReview,
        updateProductReview,
        deleteProductReview,
        
        // Customer actions
        getCustomers,
        getCustomer,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        
        // Transaction actions
        getTransactions,
        getTransaction,
        createTransaction,
        updateTransaction,
        updateTransactionStatus,
        deleteTransaction,
        
        // Order actions
        getOrders,
        getOrder,
        createOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,

        // IP History Actions
        getIpHistories,
        getIpHistory,
        createIpHistory,
        updateIpHistory,
        deleteIpHistory,
        
        // Utility actions
        initializeData,
        clearData,
        localDataCheck,
        refreshProducts,
        refreshCustomers,
        refreshTransactions,
        refreshOrders,
        refreshIpHistories,
        
        // Setters (for direct state manipulation if needed)
        setProducts,
        setProduct,
        setCustomers,
        setCustomer,
        setTransactions,
        setTransaction,
        setOrders,
        setOrder,
        setIpHistories,
        setIpHistory,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};