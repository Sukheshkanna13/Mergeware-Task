import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Tasks = new Mongo.Collection('tasks');

export const CATEGORIES = {
  personal: { label: 'Personal', color: '#4f8ef7' },
  work:     { label: 'Work',     color: '#f7874f' },
  urgent:   { label: 'Urgent',  color: '#e74c3c' },
  study:    { label: 'Study',   color: '#27ae60' },
  other:    { label: 'Other',   color: '#8e44ad' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

if (Meteor.isServer) {
  Tasks.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
  });
}

if (Meteor.isServer) {
  Meteor.publish('tasks', function publishTasks() {
    if (!this.userId) {
      return this.ready();
    }
    return Tasks.find(
      { userId: this.userId },
      { sort: { order: 1 } }
    );
  });
}

function getMaxOrder(userId) {
  const last = Tasks.findOne(
    { userId },
    { sort: { order: -1 }, fields: { order: 1 } }
  );
  return last ? last.order : 0;
}

Meteor.methods({
  'tasks.insert'(text, category = 'personal') {
    check(text, String);
    check(category, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to add tasks.');
    }
    if (!text.trim()) {
      throw new Meteor.Error('invalid-text', 'Task text cannot be empty.');
    }
    if (!CATEGORY_KEYS.includes(category)) {
      throw new Meteor.Error('invalid-category', `Unknown category: ${category}`);
    }

    const order = getMaxOrder(this.userId) + 1;

    Tasks.insert({
      text: text.trim(),
      category,
      checked: false,
      order,
      createdAt: new Date(),
      userId: this.userId,
      username: this.userId
        ? Meteor.users.findOne(this.userId)?.username ?? 'unknown'
        : 'unknown',
    });
  },

  'tasks.remove'(taskId) {
    check(taskId, String);

    const task = Tasks.findOne(taskId);
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found.');
    }
    if (task.userId !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You can only delete your own tasks.');
    }

    Tasks.remove(taskId);
  },

  'tasks.setChecked'(taskId, newCheckedState) {
    check(taskId, String);
    check(newCheckedState, Boolean);

    const task = Tasks.findOne(taskId);
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found.');
    }
    if (task.userId !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You can only modify your own tasks.');
    }

    Tasks.update(taskId, { $set: { checked: newCheckedState } });
  },

  'tasks.setCategory'(taskId, category) {
    check(taskId, String);
    check(category, String);

    if (!CATEGORY_KEYS.includes(category)) {
      throw new Meteor.Error('invalid-category', `Unknown category: ${category}`);
    }

    const task = Tasks.findOne(taskId);
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found.');
    }
    if (task.userId !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You can only modify your own tasks.');
    }

    Tasks.update(taskId, { $set: { category } });
  },

  'tasks.reorder'(updates) {
    check(updates, Array);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    updates.forEach((u) => {
      check(u._id, String);
      check(u.order, Number);
    });

    const ids = updates.map((u) => u._id);
    const ownedCount = Tasks.find({ _id: { $in: ids }, userId: this.userId }).count();
    if (ownedCount !== ids.length) {
      throw new Meteor.Error('not-authorized', 'You can only reorder your own tasks.');
    }

    updates.forEach(({ _id, order }) => {
      Tasks.update(_id, { $set: { order } });
    });
  },
});
