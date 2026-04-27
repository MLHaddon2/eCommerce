import express from 'express';
import {
  getIpHistory,
  getIpHistories,
  createIpHistory,
  updateIpHistory
} from '../Controllers/IpHistory.js';

const router = express.Router();

/* ---------------------------------------------------------
   IP HISTORY ROUTES
--------------------------------------------------------- */

// Get a single IP history record
router.get('/:ipAddress', getIpHistory);

// Get all IP history records
router.get('/', getIpHistories);

// Create new IP history record
router.post('/create', createIpHistory);

// Update existing IP history record
router.put('/update/:ipAddress', updateIpHistory);

export default router;
