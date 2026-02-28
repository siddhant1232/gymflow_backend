const Member = require('../models/Member');
const bcrypt = require('bcrypt');
const { uploadToS3 } = require('../services/s3Service');

// @desc    Register a new member
// @route   POST /api/members/register
// @access  Public
const registerMember = async (req, res, next) => {
  try {
    const { name, phone, pin, durationMonths } = req.body;

    const memberExists = await Member.findOne({ phone });

    if (memberExists) {
      return res.status(400).json({ success: false, message: 'Member with this phone already exists' });
    }

    // Hash PIN
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);

    // Calculate expiry date
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(durationMonths));

    let photoUrl = '';
    if (req.file) {
      photoUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const member = await Member.create({
      name,
      phone,
      pinHash,
      photoUrl,
      startDate,
      expiryDate,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      data: {
        _id: member._id,
        name: member.name,
        phone: member.phone,
        expiryDate: member.expiryDate,
        photoUrl: member.photoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all members
// @route   GET /api/members
// @access  Public
const getMembers = async (req, res) => {
  try {
    const members = await Member.find({}).sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expiring members (within 7 days)
// @route   GET /api/members/expiring
// @access  Public
const getExpiringMembers = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const members = await Member.find({
      expiryDate: {
        $gte: today,
        $lte: nextWeek,
      },
      status: 'active',
    });

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset PIN for a member
// @route   POST /api/members/reset-pin
// @access  Public
const resetPin = async (req, res) => {
  try {
    const { phone, newPin } = req.body;

    const member = await Member.findOne({ phone });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(newPin, salt);

    member.pinHash = pinHash;
    member.pinResetAt = new Date();

    await member.save();

    res.json({ message: 'PIN reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerMember,
  getMembers,
  getExpiringMembers,
  resetPin,
};
