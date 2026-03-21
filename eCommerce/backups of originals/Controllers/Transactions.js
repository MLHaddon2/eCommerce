import Transactions from "../models/transactionModel.js";

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transactions.findAll({
      attributes: ['id', 'orderId', 'customerId', 'amount', 'status', 'timestamp', 'paymentMethod', 'lastFour', 'timeline'],
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({ message: "Internal server error getting ALL transactions", error });
  }
};

export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transactions.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'orderId', 'customerId', 'amount', 'status', 'timestamp', 'paymentMethod', 'lastFour', 'timeline'],
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (error) {
    console.error('Error in getTransaction:', error);
    res.status(500).json({ message: "Internal server error getting transaction", error });
  }
};

export const createTransaction = async (req, res) => {
  const { orderId, customerId, amount, status, timestamp, paymentMethod, lastFour, timeline } = req.body;
  try {
    const transaction = await Transactions.create({
      orderId,
      customerId,
      amount,
      status,
      timestamp,
      paymentMethod,
      lastFour,
      timeline
    });
    res.status(200).json(transaction);
  } catch (error) {
    console.error('Error in createTransaction:', error);
    res.status(500).json({ message: "Internal server error creating transaction", error });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transactions.findOne({
      where: { id: req.body.id },
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    const { orderId, customerId, amount, status, timestamp, paymentMethod, lastFour, timeline } = req.body;
    const updatedTransaction = await transaction.update({
      where: { id: transaction.id },
      orderId,
      customerId,
      amount,
      status,
      timestamp,
      paymentMethod,
      lastFour,
      timeline
    });
    res.status(200).json({message: 'Transaction updated successfully', updatedTransaction});
  } catch (error) {
    console.error('Error in updateTransaction:', error);
    res.status(500).json({ message: "Internal server error updating transaction", error });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transactions.findOne({
      where: { id: req.params.id },
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    await transaction.destroy();
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    res.status(500).json({ message: "Internal server error deleting transaction", error });
  }
};