// imports/ui/App.js
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

// SortableJS is lazy-loaded in onRendered to prevent import errors
// from blocking template registration and causing a blank page.
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

  categoryOptions() {
    const active = Template.instance().activeCategory.get();
    return CATEGORY_OPTIONS.map((opt) => ({
      ...opt,
      activeClass: active === opt.key ? 'active' : '',
    }));
  },

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

// ── onRendered ───────────────────────────────────────────────────────────────
Template.App.onRendered(function appOnRendered() {
  const instance = this;

  // Set pill colors via DOM from data-color attribute
  instance.autorun(() => {
    const pills = instance.findAll('.filter-pill[data-color]');
    pills.forEach((pill) => {
      const color = pill.dataset.color;
      if (color) {
        pill.style.setProperty('--pill-color', color);
      }
    });
  });

  // Lazy-load SortableJS — if it fails, the app still renders fine
  import('sortablejs').then((mod) => {
    const Sortable = mod.default;

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
  }).catch((err) => {
    console.warn('SortableJS failed to load — drag-and-drop disabled:', err);
  });
});

// ── onDestroyed ──────────────────────────────────────────────────────────────
Template.App.onDestroyed(function appOnDestroyed() {
  if (this._sortable) {
    this._sortable.destroy();
  }
});
