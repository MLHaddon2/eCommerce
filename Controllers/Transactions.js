import Transactions from "../models/transactionModel.js";
import { handleError } from '../utils/handleError.js';


export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transactions.findAll({
      attributes: ['id', 'orderId', 'customerId', 'amount', 'status', 'timestamp', 'paymentMethod', 'lastFour', 'timeline', 'processorPaymentId'],
    });
    res.json(transactions);
  } catch (error) {
    return handleError(res, 'Get all transactions', error);
  }
};

export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transactions.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'orderId', 'customerId', 'amount', 'status', 'timestamp', 'paymentMethod', 'lastFour', 'timeline', 'processorPaymentId'],
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (error) {
    return handleError(res, 'Get transaction', error);
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
    return handleError(res, 'Create transaction', error);
  }
};

// Only the fields that are sent are changed. A status change is appended to the timeline.
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transactions.findOne({
      where: { id: req.params.id },
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const editable = ['orderId', 'customerId', 'amount', 'status', 'timestamp', 'paymentMethod', 'lastFour', 'timeline'];
    const updates = {};
    for (const field of editable) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (updates.status && updates.status !== transaction.status && req.body.timeline === undefined) {
      const timeline = Array.isArray(transaction.timeline) ? transaction.timeline : [];
      updates.timeline = [...timeline, { status: updates.status, date: new Date().toISOString() }];
    }

    await transaction.update(updates);
    res.status(200).json({ message: 'Transaction updated successfully', updatedTransaction: transaction });
  } catch (error) {
    return handleError(res, 'Update transaction', error);
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
    return handleError(res, 'Delete transaction', error);
  }
};