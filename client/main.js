// client/main.js
// Entry point for the client — imports templates, CSS, and configures accounts-ui.
import { Accounts } from 'meteor/accounts-base';

import './main.html';
import '../imports/ui/App.js';
import './main.css';

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});
