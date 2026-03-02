const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { registerValidation, resetPinValidation } = require('../middleware/validators');
const { validateRequest } = require('../middleware/validateInput');
const multer = require('multer');

// Configure Multer for memory storage (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png)!'));
    }
  },
});

router.post(
  '/register',
  upload.single('photo'),
  registerValidation,
  validateRequest,
  memberController.registerMember
);

router.get('/', memberController.getMembers);
router.get('/expiring', memberController.getExpiringMembers);

router.post(
  '/reset-pin',
  resetPinValidation,
  validateRequest,
  memberController.resetPin
);

router.post('/:id/renew', memberController.renewMembership);

const checkinController = require('../controllers/checkinController');
router.get('/:id/attendance', checkinController.getMemberAttendance);

module.exports = router;
