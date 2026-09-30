import IpHistory from '../models/ipHistoryModel.js';
import { handleError } from '../utils/handleError.js';

// Admin-only (see routes/ipHistoryRoutes.js). Records are created automatically
// by Login and by cart requests; these endpoints are for viewing and managing them.

const GUEST_USER_ID = '0000'; // userId column is NOT NULL

export const getIpHistory = async (req, res) => {
  try {
    const ipHistory = await IpHistory.findOne({ where: { ipAddress: req.params.ipAddress } });
    if (!ipHistory) return res.status(404).json({ message: 'IP history not found' });

    return res.status(200).json(ipHistory);
  } catch (error) {
    return handleError(res, 'Get IP history', error);
  }
};

export const getIpHistories = async (req, res) => {
  try {
    const ipHistories = await IpHistory.findAll();
    return res.status(200).json(ipHistories);
  } catch (error) {
    return handleError(res, 'Get IP histories', error);
  }
};

export const createIpHistory = async (req, res) => {
  try {
    const { ipAddress, lastLogin, cartItems, userId } = req.body;
    if (!ipAddress) return res.status(400).json({ message: 'ipAddress is required' });

    const ipHistory = await IpHistory.create({
      ipAddress,
      userId: userId || GUEST_USER_ID,
      lastLogin,
      cartItems: cartItems || []
    });

    return res.status(201).json(ipHistory);
  } catch (error) {
    return handleError(res, 'Create IP history', error);
  }
};

export const updateIpHistory = async (req, res) => {
  try {
    const { ipAddress, lastLogin, cartItems, userId } = req.body;

    const [affected] = await IpHistory.update(
      { ipAddress, lastLogin, cartItems, userId: userId || GUEST_USER_ID },
      { where: { ipAddress: req.params.ipAddress } }
    );

    if (affected === 0) {
      const newIp = await IpHistory.create({
        ipAddress: ipAddress || req.params.ipAddress,
        userId: userId || GUEST_USER_ID,
        lastLogin,
        cartItems: cartItems || []
      });

      return res.status(200).json({
        message: 'IP history not found, created new entry.',
        newIp
      });
    }

    return res.status(200).json({ message: 'IP history updated successfully.' });

  } catch (error) {
    return handleError(res, 'Update IP history', error);
  }
};

export const deleteIpHistory = async (req, res) => {
  try {
    const deleted = await IpHistory.destroy({ where: { ipAddress: req.params.ipAddress } });
    if (!deleted) return res.status(404).json({ message: 'IP history not found' });

    return res.status(200).json({ message: 'IP history deleted successfully.' });
  } catch (error) {
    return handleError(res, 'Delete IP history', error);
  }
};
