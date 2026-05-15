// imports/ui/Task.js
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { CATEGORIES, CATEGORY_KEYS } from '../api/tasks.js';

const CATEGORY_OPTIONS = CATEGORY_KEYS.map((key) => ({
  key,
  label: CATEGORIES[key].label,
  color: CATEGORIES[key].color,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
Template.Task.helpers({
  categoryLabel() {
    return CATEGORIES[this.category]?.label ?? 'Other';
  },

  categoryColor() {
    return CATEGORIES[this.category]?.color ?? '#8e44ad';
  },

  // Returns full inline style string for the category badge
  categoryBadgeStyle() {
    const color = CATEGORIES[this.category]?.color ?? '#8e44ad';
    return 'background-color: ' + color;
  },

  // Returns "checked" class name when task is completed
  checkedClass() {
    return this.checked ? 'checked' : '';
  },

  // Returns "checked" attribute or null for the checkbox input
  checkedAttr() {
    return this.checked ? 'checked' : null;
  },

  // Returns category options with selectedAttr pre-computed for each
  categoryOptionsWithSelected() {
    const currentCategory = this.category;
    return CATEGORY_OPTIONS.map((opt) => ({
      ...opt,
      selectedAttr: opt.key === currentCategory ? 'selected' : null,
    }));
  },
});

// ── Events ───────────────────────────────────────────────────────────────────
Template.Task.events({
  'change .task-checkbox'(event) {
    const taskId = event.target.dataset.id;
    const newChecked = event.target.checked;
    Meteor.call('tasks.setChecked', taskId, newChecked, (err) => {
      if (err) console.error('tasks.setChecked error:', err);
    });
  },

  'click .btn-delete'(event) {
    const taskId = event.currentTarget.dataset.id;
    if (window.confirm('Delete this task?')) {
      Meteor.call('tasks.remove', taskId, (err) => {
        if (err) console.error('tasks.remove error:', err);
      });
    }
  },

  'change .inline-category-select'(event) {
    const taskId = event.target.dataset.id;
    const newCategory = event.target.value;
    Meteor.call('tasks.setCategory', taskId, newCategory, (err) => {
      if (err) console.error('tasks.setCategory error:', err);
    });
  },
});
