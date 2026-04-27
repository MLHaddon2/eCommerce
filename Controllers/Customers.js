import Customers from "../models/customerModel.js";

const handleError = (res, context, error) => {
  console.error(context, error);
  return res.status(500).json({
    message: `${context} failed`,
    error: error?.message || String(error)
  });
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customers.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'cartItems', 'lastLogin', 'ipHistory', 'totalOrders', 'totalSpent']
    });
    return res.status(200).json(customers);
  } catch (error) {
    return handleError(res, 'Get customers', error);
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await Customers.findOne({
      where: { id: req.params.id },
        });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({message: "Customer found", customer});
  } catch (error) {
    return handleError(res, 'Get customer', error);
  }
};

export const createCustomer = async (req, res) => {
  const { firstName, lastName, email, address, cartItems, lastLogin, ipHistory, totalOrders, totalSpent } = req.body;

  try {
    const customer = await Customers.create({
      firstName,
      lastName,
      email,
      address,
      cartItems,
      lastLogin,
      ipHistory,
      totalOrders,
      totalSpent
    });

    res.status(201).json({ message: "Customer created successfully", customer });
  } catch (error) {
    return handleError(res, 'Create customer', error);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const id = req.params.id;
    const customer = await Customers.findOne({ where: { id } });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const { firstName, lastName, email, address, cartItems, lastLogin, ipHistory, totalOrders, totalSpent, recordLogin } = req.body;

    const updateData = {};
    if (firstName   !== undefined) updateData.firstName   = firstName;
    if (lastName    !== undefined) updateData.lastName    = lastName;
    if (email       !== undefined) updateData.email       = email;
    if (address     !== undefined) updateData.address     = address;
    if (cartItems   !== undefined) updateData.cartItems   = cartItems;
    if (totalOrders !== undefined) updateData.totalOrders = totalOrders;
    if (totalSpent  !== undefined) updateData.totalSpent  = totalSpent;

    // If the client signals a login event, update lastLogin server-side
    if (recordLogin || lastLogin) {
      updateData.lastLogin = new Date().toUTCString();
    }

    const updatedCustomer = await Customers.update(updateData, { where: { id } });
    res.status(200).json({ message: "Customer updated successfully", updatedCustomer });
  } catch (error) {
    return handleError(res, 'Update customer', error);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customers.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'cartItems', 'lastLogin', 'ipHistory', 'totalOrders', 'totalSpent']
    });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    await Customers.destroy({
      where: { id: req.params.id }
    });
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    return handleError(res, 'Delete customer', error);
  }
};