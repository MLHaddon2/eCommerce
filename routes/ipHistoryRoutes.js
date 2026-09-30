import express from 'express';
import {
  getIpHistory,
  getIpHistories,
  createIpHistory,
  updateIpHistory,
  deleteIpHistory
} from '../Controllers/IpHistory.js';
import { verifyAdmin } from '../middleware/VerifyToken.js';

const router = express.Router();

/* ---------------------------------------------------------
   IP HISTORY ROUTES (admin only)
--------------------------------------------------------- */

router.use(verifyAdmin);

// Get all IP history records
router.get('/', getIpHistories);

// Get a single IP history record
router.get('/:ipAddress', getIpHistory);

// Create new IP history record
router.post('/create', createIpHistory);

// Update existing IP history record
router.put('/update/:ipAddress', updateIpHistory);

// Delete an IP history record
router.delete('/delete/:ipAddress', deleteIpHistory);

export default router;
