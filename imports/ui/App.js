// imports/ui/App.js
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import Sortable from 'sortablejs';

import { Tasks, CATEGORIES, CATEGORY_KEYS } from '../api/tasks.js';

import './Task.js';
import './App.html';
import './Task.html';

const CATEGORY_OPTIONS = CATEGORY_KEYS.map((key) => ({
  key,
  label: CATEGORIES[key].label,
  color: CATEGORIES[key].color,
}));

// ── onCreated ────────────────────────────────────────────────────────────────
Template.App.onCreated(function appOnCreated() {
  this.subscribe('tasks');
  this.hideCompleted = new ReactiveVar(false);
  this.activeCategory = new ReactiveVar('all');
});

// ── Helpers ──────────────────────────────────────────────────────────────────
Template.App.helpers({
  tasks() {
    const instance = Template.instance();
    const hideCompleted = instance.hideCompleted.get();
    const activeCategory = instance.activeCategory.get();
    const query = { userId: Meteor.userId() };
    if (hideCompleted) {
      query.checked = { $ne: true };
    }
    if (activeCategory !== 'all') {
      query.category = activeCategory;
    }
    return Tasks.find(query, { sort: { order: 1 } });
  },

  incompleteCount() {
    return Tasks.find({ userId: Meteor.userId(), checked: { $ne: true } }).count();
  },

  hideCompleted() {
    return Template.instance().hideCompleted.get();
  },

  // Returns "checked" string or empty string for the checkbox attribute
  hideCompletedAttr() {
    return Template.instance().hideCompleted.get() ? 'checked' : null;
  },

  categoryOptions() {
    // Attach activeClass to each option so the template can use {{activeClass}}
    const active = Template.instance().activeCategory.get();
    return CATEGORY_OPTIONS.map((opt) => ({
      ...opt,
      activeClass: active === opt.key ? 'active' : '',
    }));
  },

  // Returns "active" class string for the "All" pill
  activeClassAll() {
    return Template.instance().activeCategory.get() === 'all' ? 'active' : '';
  },

  hasAnyTasks() {
    const instance = Template.instance();
    const hideCompleted = instance.hideCompleted.get();
    const activeCategory = instance.activeCategory.get();
    const query = { userId: Meteor.userId() };
    if (hideCompleted) query.checked = { $ne: true };
    if (activeCategory !== 'all') query.category = activeCategory;
    return Tasks.find(query).count() > 0;
  },
});

// ── Events ───────────────────────────────────────────────────────────────────
Template.App.events({
  'submit #task-form'(event, instance) {
    event.preventDefault();
    const form = event.target;
    const text = form.text.value.trim();
    const category = form.category.value;
    if (!text) return;

    Meteor.call('tasks.insert', text, category, (err) => {
      if (err) {
        console.error('tasks.insert error:', err);
        alert(err.reason || 'Failed to add task.');
      }
    });

    form.text.value = '';
    form.text.focus();
  },

  'change #hide-completed'(event, instance) {
    instance.hideCompleted.set(event.target.checked);
  },

  'click .filter-pill'(event, instance) {
    const category = event.currentTarget.dataset.category;
    instance.activeCategory.set(category);
  },
});

// ── onRendered – SortableJS ──────────────────────────────────────────────────
Template.App.onRendered(function appOnRendered() {
  const instance = this;
  instance.autorun(() => {
    const taskList = instance.find('#task-list');
    if (!taskList) return;

    if (instance._sortable) {
      instance._sortable.destroy();
    }

    instance._sortable = Sortable.create(taskList, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd(evt) {
        const items = Array.from(evt.to.children);
        const updates = items.map((li, index) => ({
          _id: li.dataset.id,
          order: index + 1,
        }));
        Meteor.call('tasks.reorder', updates, (err) => {
          if (err) console.error('tasks.reorder error:', err);
        });
      },
    });
  });
});

// ── onDestroyed ──────────────────────────────────────────────────────────────
Template.App.onDestroyed(function appOnDestroyed() {
  if (this._sortable) {
    this._sortable.destroy();
  }
});
