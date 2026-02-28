const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for easy querying
      required: true,
    },
    time: {
      type: String, // Stored as HH:MM
      required: true,
    },
    method: {
      type: String,
      enum: ['QR'],
      default: 'QR',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ memberId: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ memberId: 1, date: 1 }, { unique: true }); // Ensure 1 check-in per day per member

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
