import { SquareClient } from "square";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

// Initialize Square client globally to avoid recreating it
let squareClient = null;
let paymentsApi = null;
dotenv.config();

export const initializeSquareClient = () => {
    if (!squareClient) {
        squareClient = new SquareClient({
            accessToken: process.env.SQUARE_ACCESS_TOKEN,
            environment: process.env.SQUARE_NODE_ENV || 'sandbox'
        });
        paymentsApi = squareClient.paymentsApi;
    }
    return { squareClient, paymentsApi };
};

export const initializeSquareClientEndpoint = async (req, res) => {
    try {
        const { squareClient: client, paymentsApi: api } = initializeSquareClient();
        
        if (!client || !api) {
            return res.status(500).json({
                success: false,
                message: "Error accessing Square client server API"
            });
        }

        // Test the connection
        try {
            // Try to list locations to verify the connection
            const locationsApi = client.locationsApi;
            await locationsApi.listLocations();
            
            return res.status(200).json({
                success: true,
                message: "Square client initialized successfully"
            });
        } catch (testError) {
            console.error('Square API test error:', testError);
            return res.status(500).json({
                success: false,
                message: "Square API connection test failed",
                error: testError.message
            });
        }
    } catch (error) {
        console.error('Square client initialization error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error Accessing Square API", 
            error: error.message
        });
    }
};

export const getPayment = async (req, res) => {
    try {
        const { squareClient: client, paymentsApi } = initializeSquareClient();
        const { paymentId } = req.params;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment ID is required'
            });
        }

        const response = await paymentsApi.getPayment(paymentId);

        if (response.result.payment) {
            return res.status(200).json({
                success: true,
                payment: response.result.payment,
                message: 'Payment retrieved successfully'
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

    } catch (error) {
        console.error('Error retrieving payment:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment',
            error: error.message || 'Internal server error'
        });
    }
};

export const updatePayment = async (req, res) => {
    try {
        const { squareClient: client, paymentsApi } = initializeSquareClient();
        const { paymentId } = req.params;
        const { tipMoney, versionToken } = req.body;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment ID is required'
            });
        }

        const updatePaymentRequest = {
            payment: {
                tipMoney: tipMoney ? {
                    amount: tipMoney.amount,
                    currency: tipMoney.currency || 'USD'
                } : undefined,
                versionToken: versionToken
            },
            idempotencyKey: randomUUID()
        };

        const response = await paymentsApi.updatePayment(paymentId, updatePaymentRequest);

        if (response.result.payment) {
            return res.status(200).json({
                success: true,
                payment: response.result.payment,
                message: 'Payment updated successfully'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to update payment'
            });
        }

    } catch (error) {
        console.error('Error updating payment:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to update payment',
            error: error.message || 'Internal server error'
        });
    }
};

export const cancelPayment = async (req, res) => {
    try {
        const { squareClient: client, paymentsApi } = initializeSquareClient();
        const { paymentId } = req.params;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment ID is required'
            });
        }

        const cancelPaymentRequest = {
            idempotencyKey: randomUUID()
        };

        const response = await paymentsApi.cancelPayment(paymentId, cancelPaymentRequest);

        if (response.result.payment) {
            return res.status(200).json({
                success: true,
                payment: response.result.payment,
                message: 'Payment cancelled successfully'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to cancel payment'
            });
        }

    } catch (error) {
        console.error('Error cancelling payment:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel payment',
            error: error.message || 'Internal server error'
        });
    }
};

export const completePayment = async (req, res) => {
    try {
        const { squareClient: client, paymentsApi } = initializeSquareClient();
        const { paymentId } = req.params;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment ID is required'
            });
        }

        const completePaymentRequest = {
            idempotencyKey: randomUUID()
        };

        const response = await paymentsApi.completePayment(paymentId, completePaymentRequest);

        if (response.result.payment) {
            return res.status(200).json({
                success: true,
                payment: response.result.payment,
                message: 'Payment completed successfully'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to complete payment'
            });
        }

    } catch (error) {
        console.error('Error completing payment:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to complete payment',
            error: error.message || 'Internal server error'
        });
    }
};

// Main function to create payment (this is what your frontend calls)
export const createPayment = async (req, res) => {
    try {
        const { squareClient: client, paymentsApi } = initializeSquareClient();
        const { sourceId, amount, currency = 'USD', taxAmount, shippingState, items, paymentDetails } = req.body;

        console.log('Creating payment with data:', {
            sourceId: sourceId?.substring(0, 20) + '...',
            amount,
            currency,
            taxAmount,
            shippingState,
            itemCount: items?.length || 0
        });

        if (!sourceId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Source ID and amount are required'
            });
        }

        // Validate location ID
        if (!process.env.REACT_APP_SQUARE_LOCATION_ID) {
            return res.status(500).json({
                success: false,
                message: 'Square location ID not configured'
            });
        }

        const createPaymentRequest = {
            sourceId,
            idempotencyKey: randomUUID(),
            amountMoney: {
                amount: parseInt(amount), // Ensure it's an integer
                currency: currency
            },
            locationId: process.env.REACT_APP_SQUARE_LOCATION_ID,
            note: `Payment for order - ${items?.length || 0} items`,
            autocomplete: true, // Set to false if you want to authorize first, then complete later
            acceptPartialAuthorization: false,
            buyerEmailAddress: req.body.buyerEmail || undefined,
            billingAddress: req.body.billingAddress || undefined,
            shippingAddress: req.body.shippingAddress || undefined,
            taxMoney: taxAmount ? {
                amount: parseInt(taxAmount),
                currency: currency
            } : undefined
        };

        // Add order info if items are provided
        if (items && items.length > 0) {
            createPaymentRequest.orderInfo = {
                lineItems: items.map((item, index) => ({
                    name: item.name,
                    quantity: item.quantity.toString(),
                    basePriceMoney: {
                        amount: parseInt(item.basePriceMoney.amount),
                        currency: item.basePriceMoney.currency
                    }
                }))
            };
        }

        console.log('Sending payment request to Square...');
        const response = await paymentsApi.createPayment(createPaymentRequest);
        console.log('Square API response status:', response.statusCode);

        if (response.result.payment) {
            console.log('Payment created successfully:', response.result.payment.id);
            return res.status(201).json({
                success: true,
                payment: response.result.payment,
                message: 'Payment created successfully'
            });
        } else {
            console.error('Payment creation failed:', response.result.errors);
            return res.status(400).json({
                success: false,
                message: 'Failed to create payment',
                errors: response.result.errors
            });
        }

    } catch (error) {
        console.error('Error creating payment:', error);
        
        // Handle specific Square API errors
        if (error.errors && Array.isArray(error.errors)) {
            const errorMessages = error.errors.map(err => err.detail || err.code).join(', ');
            return res.status(400).json({
                success: false,
                message: 'Payment processing failed',
                error: errorMessages,
                details: error.errors
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Failed to create payment',
            error: error.message || 'Internal server error'
        });
    }
};

// Function to refund a payment
export const refundPayment = async (req, res) => {
    try {
        const { squareClient: client } = initializeSquareClient();
        const { paymentId } = req.params;
        const { amountMoney, reason } = req.body;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment ID is required'
            });
        }

        const refundRequest = {
            idempotencyKey: randomUUID(),
            amountMoney: amountMoney || undefined, // If not provided, will refund full amount
            paymentId: paymentId,
            reason: reason || 'Customer requested refund'
        };

        const refundsApi = client.refundsApi;
        const response = await refundsApi.refundPayment(refundRequest);

        if (response.result.refund) {
            return res.status(201).json({
                success: true,
                refund: response.result.refund,
                message: 'Refund processed successfully'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to process refund',
                errors: response.result.errors
            });
        }

    } catch (error) {
        console.error('Error processing refund:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: error.message || 'Internal server error'
        });
    }
};

// Function to list payments
export const listPayments = async (req, res) => {
    try {
        const { squareClient: client, paymentsApi } = initializeSquareClient();
        const { beginTime, endTime, sortOrder, cursor, locationId } = req.query;

        const listPaymentsRequest = {
            beginTime: beginTime || undefined,
            endTime: endTime || undefined,
            sortOrder: sortOrder || 'DESC',
            cursor: cursor || undefined,
            locationId: locationId || process.env.REACT_APP_SQUARE_LOCATION_ID
        };

        const response = await paymentsApi.listPayments(listPaymentsRequest);

        return res.status(200).json({
            success: true,
            payments: response.result.payments || [],
            cursor: response.result.cursor || null,
            message: 'Payments retrieved successfully'
        });

    } catch (error) {
        console.error('Error listing payments:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to list payments',
            error: error.message || 'Internal server error'
        });
    }
};