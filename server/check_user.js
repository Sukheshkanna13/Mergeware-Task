import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  const user = Accounts.findUserByEmail('testuser@example.com');
  if (user) {
    console.log('User found:', user._id);
  } else {
    console.log('User not found');
  }
});
