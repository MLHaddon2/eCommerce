import Customers from "../models/customerModel.js";

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customers.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'cartItems', 'lastLogin', 'ipHistory', 'totalOrders', 'totalSpent']
    });
    res.json(customers);
  } catch (error) {
    console.error('Error in getCustomers:', error);
    res.status(500).json({ message: "Internal server error" });
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
    console.error('Error in getCustomer:', error);
    res.status(500).json({ message: "Internal server error" });
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
    console.error('Error in Customer creation: ', error);
    res.status(500).json({ message: "Error creating customer", error });
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
    console.error('Error in Customer update: ', error);
    res.status(500).json({ message: "Error updating customer", error });
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
    console.error('Error in Customer deletion: ', error);
    res.status(500).json ({message: "Internal Server Error Deleting Customer", error});
  }
};