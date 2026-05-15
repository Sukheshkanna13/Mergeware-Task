// client/main.js
// Entry point — import templates first, then the HTML body that uses them.
import { Accounts } from 'meteor/accounts-base';

// 1. Import UI components (registers Template.App and Template.Task)
import '../imports/ui/App.js';

// 2. Import HTML body (uses {{> App}} — template must already be registered)
import './main.html';

// 3. Styles
import './main.css';

// Configure accounts-ui
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});
