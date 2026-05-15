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

  // Returns "checked" class name when task is completed
  checkedClass() {
    return this.checked ? 'checked' : '';
  },

  // Returns category options for the inline select
  categoryOptionsWithSelected() {
    return CATEGORY_OPTIONS;
  },
});

// ── onRendered — set dynamic attributes via DOM ──────────────────────────────
Template.Task.onRendered(function () {
  const data = this.data;

  // Set checkbox checked state
  const checkbox = this.find('.task-checkbox');
  if (checkbox) {
    checkbox.checked = !!data.checked;
  }

  // Set category badge background color
  const badge = this.find('.category-badge');
  if (badge) {
    const color = CATEGORIES[data.category]?.color ?? '#8e44ad';
    badge.style.backgroundColor = color;
  }

  // Set selected option in the inline category select
  const select = this.find('.inline-category-select');
  if (select) {
    select.value = data.category || 'personal';
  }
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
