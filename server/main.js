// server/main.js
// Publications — Tasks collection is already available from lib/tasks.js

Meteor.publish('tasks', function() {
  if (!this.userId) {
    return this.ready();
  }
  return Tasks.find(
    { userId: this.userId },
    { sort: { order: 1 } }
  );
});

// Deny direct client-side writes — all writes go through methods
Tasks.deny({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; },
});
