import Customer from '../models/customerModel.js';
import IpHistory from '../models/ipHistoryModel.js';

export const updateCartItems = async (req, res) => {
    try {
        const { cartItems } = req.body;
        const userId = req.params.id;
        const ipAddress = req.params.ipAddress;
        
        let finalCartItems = cartItems;
        
        // Handle logged-in user (userId !== '0000')
        if (userId !== '0000') {
            const customer = await Customer.findOne({ where: { id: userId } });
            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }
            
            const existingCartItems = customer.cartItems;
            
            // If customer has existing cart items, merge them with incoming cart
            if (existingCartItems && existingCartItems.length > 0) {
                finalCartItems = mergeCartItems(existingCartItems, cartItems);
            }
            
            // Update customer's cart
            await customer.update({ cartItems: finalCartItems });
        }
        
        // Update IP history
        await IpHistory.upsert({
            ipAddress: ipAddress,
            lastLogin: new Date().toUTCString(),
            cartItems: finalCartItems
        });
        
        res.status(200).json({ cartItems: finalCartItems });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to merge cart items
const mergeCartItems = (existingItems, newItems) => {
    const merged = [...existingItems];
    
    newItems.forEach(newItem => {
        const existingIndex = merged.findIndex(item => item.id === newItem.id);
        if (existingIndex >= 0) {
            // Update quantity if item exists
            merged[existingIndex].quantity += newItem.quantity;
        } else {
            // Add new item
            merged.push(newItem);
        }
    });
    
    return merged;
};

export const getCartItems = async (req, res) => {
    try {
        const userId = req.params.id;
        const ipAddress = req.params.ipAddress;
        
        let cartItems = req.params.cartItems;
        
        if (userId !== '0000') {
            const customer = await Customer.findOne({ where: { id: userId } });
            if (customer && customer.cartItems) {
                cartItems = customer.cartItems;
            }
            res.status(200).json({ message: "Cart items retrieved from existing customer", customer })
        } else {
            const ipHistory = await IpHistory.findOne({ where: { ipAddress } });
            if (ipHistory && ipHistory.cartItems) {
                cartItems = ipHistory.cartItems;
            }
            res.status(200).json({ message: "Cart items retrieved from IP history", ipHistory });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCartItem = async (req, res) => {
    try {
        const userId = req.params.id;
        const productId = req.params.productId;
        const ipAddress = req.params.ipAddress;
        
        // Handle logged-in user
        if (userId !== '0000') {
            const customer = await Customer.findOne({ where: { id: userId } });
            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }
            
            cartItems = customer.cartItems;
            if (cartItems[productId].quantity > 1) {
                cartItems[productId].quantity -= 1;
            } else {
                cartItems = cartItems.filter(item => item.id !== productId);
            };
            await customer.update({ cartItems: cartItems });
            res.status(200).json({ message: 'Item removed from Customer cart', cartItems });
        }
        
        // Update IP history
        const ipHistory = await IpHistory.findOne({ where: { ipAddress } });
        if (ipHistory) {
            cartItems = ipHistory.cartItems;
            if (cartItems[productId].quantity > 1) {
                cartItems[productId].quantity -= 1;
            } else {
                cartItems = cartItems.filter(item => item.id !== productId);
            };
            await ipHistory.update({ cartItems: cartItems });
            res.status(200).json({ message: 'Item removed from IP Address cart', cartItems });
        }

        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};