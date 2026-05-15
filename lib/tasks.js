// lib/tasks.js
// Shared between client and server — loaded eagerly by Meteor.
Tasks = new Mongo.Collection('tasks');

CATEGORIES = {
  personal: { label: 'Personal', color: '#4f8ef7' },
  work:     { label: 'Work',     color: '#f7874f' },
  urgent:   { label: 'Urgent',   color: '#e74c3c' },
  study:    { label: 'Study',    color: '#27ae60' },
  other:    { label: 'Other',    color: '#8e44ad' },
};

CATEGORY_KEYS = Object.keys(CATEGORIES);

// ── Methods (run on both client for optimistic UI, and server) ───────────────

function getMaxOrder(userId) {
  var last = Tasks.findOne(
    { userId: userId },
    { sort: { order: -1 }, fields: { order: 1 } }
  );
  return last ? last.order : 0;
}

Meteor.methods({
  'tasks.insert': function(text, category) {
    check(text, String);
    if (typeof category === 'undefined') category = 'personal';
    check(category, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to add tasks.');
    }
    if (!text.trim()) {
      throw new Meteor.Error('invalid-text', 'Task text cannot be empty.');
    }
    if (CATEGORY_KEYS.indexOf(category) === -1) {
      throw new Meteor.Error('invalid-category', 'Unknown category: ' + category);
    }

    var order = getMaxOrder(this.userId) + 1;

    Tasks.insert({
      text: text.trim(),
      category: category,
      checked: false,
      order: order,
      createdAt: new Date(),
      userId: this.userId,
      username: Meteor.users.findOne(this.userId) ? Meteor.users.findOne(this.userId).username : 'unknown',
    });
  },

  'tasks.remove': function(taskId) {
    check(taskId, String);
    var task = Tasks.findOne(taskId);
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found.');
    }
    if (task.userId !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You can only delete your own tasks.');
    }
    Tasks.remove(taskId);
  },

  'tasks.setChecked': function(taskId, newCheckedState) {
    check(taskId, String);
    check(newCheckedState, Boolean);
    var task = Tasks.findOne(taskId);
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found.');
    }
    if (task.userId !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You can only modify your own tasks.');
    }
    Tasks.update(taskId, { $set: { checked: newCheckedState } });
  },

  'tasks.setCategory': function(taskId, category) {
    check(taskId, String);
    check(category, String);
    if (CATEGORY_KEYS.indexOf(category) === -1) {
      throw new Meteor.Error('invalid-category', 'Unknown category: ' + category);
    }
    var task = Tasks.findOne(taskId);
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found.');
    }
    if (task.userId !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You can only modify your own tasks.');
    }
    Tasks.update(taskId, { $set: { category: category } });
  },

  'tasks.reorder': function(updates) {
    check(updates, Array);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    var self = this;
    updates.forEach(function(u) {
      check(u._id, String);
      check(u.order, Number);
    });
    var ids = updates.map(function(u) { return u._id; });
    var ownedCount = Tasks.find({ _id: { $in: ids }, userId: self.userId }).count();
    if (ownedCount !== ids.length) {
      throw new Meteor.Error('not-authorized', 'You can only reorder your own tasks.');
    }
    updates.forEach(function(item) {
      Tasks.update(item._id, { $set: { order: item.order } });
    });
  },
});
