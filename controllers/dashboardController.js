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

    // Single aggregation for member metrics
    const memberMetrics = await Member.aggregate([
      {
        $facet: {
          activeMembers: [
            { $match: { status: 'active' } },
            { $count: 'count' }
          ],
          expiringSoon: [
            {
              $match: {
                status: 'active',
                expiryDate: { $gte: today, $lte: nextWeek }
              }
            },
            { $count: 'count' }
          ],
          expiredCount: [
            { $match: { status: 'expired' } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Aggregate attendance metrics and get populated check-in list
    const attendanceStats = await Attendance.aggregate([
      { $match: { date: formattedDate } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          checkinsList: [
            {
              $lookup: {
                from: 'members',
                localField: 'memberId',
                foreignField: '_id',
                as: 'member'
              }
            },
            { $unwind: '$member' },
            {
              $project: {
                _id: 1,
                time: 1,
                method: 1,
                memberId: 1,
                memberName: '$member.name',
                memberPhone: '$member.phone',
                memberPhoto: '$member.photoUrl'
              }
            }
          ]
        }
      }
    ]);

    const activeMembersCount = memberMetrics[0].activeMembers[0]?.count || 0;
    const expiringMembersCount = memberMetrics[0].expiringSoon[0]?.count || 0;
    const expiredMembersCount = memberMetrics[0].expiredCount[0]?.count || 0;

    const todaysAttendanceCount = attendanceStats[0].totalCount[0]?.count || 0;
    const todayCheckinsList = attendanceStats[0].checkinsList || [];

    res.json({
      success: true,
      data: {
        activeMembers: activeMembersCount,
        presentToday: todaysAttendanceCount,
        expiringSoon: expiringMembersCount,
        expiredCount: expiredMembersCount,
        todayCheckinsList
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardData };
