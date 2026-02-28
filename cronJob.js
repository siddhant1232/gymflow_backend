const cron = require('node-cron');
const Member = require('./models/Member');

// Mock Twilio sender setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client;
if (accountSid && authToken) {
  client = require('twilio')(accountSid, authToken);
}

// Function to send SMS using Twilio
const sendSMS = async (to, message) => {
  if (process.env.SMS_ENABLED === 'true' && client && twilioPhone) {
    try {
      await client.messages.create({
        body: message,
        from: twilioPhone,
        to: to,
      });
      console.log(`Successfully sent reminder SMS to ${to}`);
    } catch (error) {
      console.error(`Error sending SMS to ${to}:`, error.message);
    }
  } else {
    console.log(`[MOCK SMS] Would send to ${to}: "${message}"`);
  }
};

// Schedule job to run daily at 9:00 AM for Reminders
// "0 9 * * *" refers to 9:00 AM every day
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily cron job for renewal reminders...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 7);

    // End of the target date to cover the entire day
    const endOfTargetDate = new Date(targetDate);
    endOfTargetDate.setHours(23, 59, 59, 999);

    // Find active members whose expiry date is exactly 7 days from now
    // and reminder has not been sent yet
    const expiringMembers = await Member.find({
      status: 'active',
      reminderSent: false,
      expiryDate: {
        $gte: targetDate,
        $lte: endOfTargetDate,
      },
    });

    console.log(`Found ${expiringMembers.length} members with upcoming renewals.`);

    for (const member of expiringMembers) {
      const message = `Hi ${member.name}, your GymFlow membership will expire on ${member.expiryDate.toDateString()}. Please renew soon to continue enjoying our facilities!`;

      await sendSMS(member.phone, message);

      // Mark reminder as sent
      member.reminderSent = true;
      await member.save();
    }
  } catch (error) {
    console.error('Error running cron job for reminders:', error.message);
  }
});

// Schedule job to run daily at Midnight 00:00 to Auto-Expire Members
cron.schedule('0 0 * * *', async () => {
  console.log('Running midnight cron job for expiring overdue members...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Member.updateMany(
      { status: 'active', expiryDate: { $lt: today } },
      { $set: { status: 'expired' } }
    );

    console.log(`Automatically expired ${result.modifiedCount} accounts.`);
  } catch (error) {
    console.error('Error auto-expiring members:', error);
  }
});

console.log('Cron jobs initialized.');
