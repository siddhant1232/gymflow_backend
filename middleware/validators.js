const { body } = require('express-validator');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone')
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone must be exactly 10 digits')
    .isNumeric()
    .withMessage('Phone must contain only numbers'),
  body('pin')
    .trim()
    .isLength({ min: 4, max: 4 })
    .withMessage('PIN must be exactly 4 digits')
    .isNumeric()
    .withMessage('PIN must contain only numbers'),
  body('durationMonths')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
];

const checkinValidation = [
  body('phone')
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone must be exactly 10 digits')
    .isNumeric()
    .withMessage('Phone must contain only numbers'),
  body('pin')
    .trim()
    .isLength({ min: 4, max: 4 })
    .withMessage('PIN must be exactly 4 digits')
    .isNumeric()
    .withMessage('PIN must contain only numbers'),
];

const resetPinValidation = [
  body('phone')
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone must be exactly 10 digits')
    .isNumeric()
    .withMessage('Phone must contain only numbers'),
  body('newPin')
    .trim()
    .isLength({ min: 4, max: 4 })
    .withMessage('PIN must be exactly 4 digits')
    .isNumeric()
    .withMessage('PIN must contain only numbers'),
];

module.exports = {
  registerValidation,
  checkinValidation,
  resetPinValidation,
};
