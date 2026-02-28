const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { checkinValidation } = require('../middleware/validators');
const { validateRequest } = require('../middleware/validateInput');
const { checkinLimiter } = require('../middleware/rateLimiter');

router.post(
  '/',
  checkinLimiter,
  checkinValidation,
  validateRequest,
  checkinController.processCheckin
);
router.get('/today', checkinController.getTodayAttendance);
router.get('/:memberId', checkinController.getMemberAttendance);

module.exports = router;
