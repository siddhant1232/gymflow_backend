const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const bcrypt = require('bcrypt');

// Helper to get formatted date YYYY-MM-DD
const getFormattedDate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

// Helper to get formatted time HH:MM
const getFormattedTime = () => {
  const d = new Date();
  return d.toTimeString().split(' ')[0].substring(0, 5);
};

// @desc    Process Member Check-in
// @route   POST /api/checkin
// @access  Public
const processCheckin = async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({ success: false, message: 'Phone and PIN are required' });
    }

    // 1. Find Member
    const member = await Member.findOne({ phone });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // 2. Check PIN
    const isMatch = await bcrypt.compare(pin, member.pinHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid PIN' });
    }

    // 3. Check Expiry
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    if (member.expiryDate < today) {
      // Update status to expired if it isn't already
      if (member.status === 'active') {
        member.status = 'expired';
        await member.save();
      }
      return res.status(403).json({ success: false, message: 'Membership expired' });
    }

    // 4. Ensure one check-in per day
    const formattedDate = getFormattedDate();
    const existingAttendance = await Attendance.findOne({
      memberId: member._id,
      date: formattedDate,
    });

    if (existingAttendance) {
      return res.status(400).json({ success: false, message: 'Already checked in today' });
    }

    // 5. Create Attendance Record
    await Attendance.create({
      memberId: member._id,
      date: formattedDate,
      time: getFormattedTime(),
      method: 'QR',
    });

    // 6. Return success response
    res.json({
      success: true,
      data: {
        name: member.name,
        photoUrl: member.photoUrl,
        expiryDate: member.expiryDate,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get today's total attendance
// @route   GET /api/checkin/today
// @access  Public
const getTodayAttendance = async (req, res) => {
  try {
    const formattedDate = getFormattedDate();
    const count = await Attendance.countDocuments({ date: formattedDate });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get specific member's attendance
// @route   GET /api/checkin/:memberId
// @access  Public
const getMemberAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ memberId: req.params.memberId }).sort({ createdAt: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  processCheckin,
  getTodayAttendance,
  getMemberAttendance,
};
