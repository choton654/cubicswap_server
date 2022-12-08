const PushNotifications = require("@pusher/push-notifications-server");

const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID,
  secretKey: process.env.PUSHER_SECRET_KEY,
});

module.exports = { beamsClient };
