const Member = require('../models/Member');
const Attendance = require('../models/Attendance');

// @desc    Get dashboard summary metrics
// @route   GET /api/dashboard
// @access  Public
const getDashboardData = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const formattedDate = new Date().toISOString().split('T')[0];

    // Execute queries concurrently
    const [
      activeMembersCount,
      todaysAttendanceCount,
      expiringMembersCount,
      expiredMembersCount
    ] = await Promise.all([
      Member.countDocuments({ status: 'active' }),
      Attendance.countDocuments({ date: formattedDate }),
      Member.countDocuments({
        status: 'active',
        expiryDate: { $gte: today, $lte: nextWeek }
      }),
      Member.countDocuments({ status: 'expired' })
    ]);

    res.json({
      success: true,
      data: {
        activeMembersCount,
        todaysAttendanceCount,
        expiringMembersCount,
        expiredMembersCount,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardData };
