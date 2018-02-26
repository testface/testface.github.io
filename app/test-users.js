var userList = [];

var dialog = {
  open: false,
  label: null,
  name: null,
  value: null,
  info: null,
  success: null,
  message: null,
  submitted: false
};

var access;
try {
  access = JSON.parse(sessionStorage.getItem('_app_access'));
} catch(e) {
}

if(!access) {
  clearAccess();
}

if(access.token) {
  getTestUsers();
}

function clearAccess() {
  if(!access)
    access = {}

  access.app_name = null;
  access.client_id = null;
  access.client_secret = null;
  access.token = null;
  access.message = null;
  sessionStorage.setItem('_app_access', JSON.stringify(access));
}

function onAccessFail(error) {
  access.message = error.responseJSON.error.message;
}

function getTestUsers() {
  $.getJSON('https://graph.facebook.com/' + access.client_id + '/accounts/test-users', {
    access_token: access.token
  }, function(response) {
    getUserInfo(response.data);
  });
}

function getUserInfo(users) {
  var ids = $.map(users, function(u) { return u.id });

  $.getJSON('https://graph.facebook.com/', {
    access_token: access.token,
    fields: 'name,email',
    ids: ids.join(',')
  }, function(response) {
    $.each(users, function(i, user) {
      user.name = response[user.id].name;
      user.email = response[user.id].email;
      userList.push(user);
    });
  });
}

function getToken() {
  delete access.message;

  $.getJSON('https://graph.facebook.com/oauth/access_token', {
    client_id: this.access.client_id,
    client_secret: this.access.client_secret,
    grant_type: 'client_credentials'
  }).done(function(response) {
    getAppInfo(response.access_token);
  }).fail(onAccessFail);
}

function getAppInfo(token) {
  $.getJSON('https://graph.facebook.com/' + access.client_id, {
    access_token: token
  }).done(function(response) {
    access.app_name = response.name;
    access.token = token;
    sessionStorage.setItem('_app_access', JSON.stringify(access));
  }).fail(onAccessFail);
}

function confirmDialog(props, cb) {
  dialog.open = true;
  dialog.title = props.title;
  dialog.label = props.label;
  dialog.type = props.type;
  dialog.name = props.name;
  dialog.info = null;
  dialog.value = '';
  dialog.cb = cb;
}

function closeDialog() {
  dialog.open = false;
  dialog.success = null;
  dialog.message = null;
  dialog.info = null;
  dialog.name = null;
  dialog.submitted = false;
  dialog.cb = null;
}

function setPassword(user, password) {
  dialog.submitted = true;
  $.ajax({
    method: 'POST',
    url: 'https://graph.facebook.com/' + user.id,
    data: {
      password: password,
      access_token: access.token
    }
  }).done(function(response) {
    if(response.success) {
      dialog.success = 'Password updated';
    }
  }).fail(function(response) {
    dialog.message = response.responseJSON.error.message;
  }).always(function() {
    dialog.submitted = false;
  });
}

function deleteUser(user) {
  dialog.submitted = true;
  $.ajax({
    method: 'DELETE',
    url: 'https://graph.facebook.com/' + user.id,
    data: {
      access_token: access.token
    }
  }).done(function(response) {
    if(response.success) {
      dialog.success = 'User deleted';

      var i = userList.findIndex(function(u) {
        return u.id == user.id;
      });

      userList.splice(i, 1);
    }
  }).fail(function(response) {
    dialog.message = response.responseJSON.error.message;
  }).always(function() {
    dialog.submitted = false;
  });
}

function addUser(password) {
  dialog.submitted = true;
  $.ajax({
    method: 'POST',
    url: 'https://graph.facebook.com/' + access.client_id + '/accounts/test-users', 
    data: {
      access_token: access.token
    }
  }).done(function(response) {
    var user = response;

    dialog.info = user.email;
    dialog.value = user.password;
    dialog.label = 'Choose a password';
    dialog.name = 'New password';
    dialog.type = 'password';
    dialog.cb = function() {
      dialog.submitted = true;
      $.ajax({
        method: 'POST',
        url: 'https://graph.facebook.com/' + user.id,
        data: {
          password: dialog.value,
          access_token: access.token
        }
      }).done(function(response) {
        if(response.success) {
        }
      }).fail(function(response) {
        dialog.message = response.responseJSON.error.message;
        dialog.submitted = false;
      }).always(function() {
        dialog.submitted = false;
      });
    };

    userList.push(user);

  }).fail(function(response) {
    dialog.message = response.responseJSON.error.message;
    dialog.submitted = false;
  });
}

new Vue({
  el: '#app',
  data: {
    access: access,
    users: userList
  },
  methods: {
    authorize: getToken,
    disconnect: function() {
      confirmDialog("Really sign out?", clearAccess);
    },
    unlock: function(user) {
      confirmDialog({title: "Set Password", label: "Password for " + user.name, name: 'New password', type: 'password' }, function() { setPassword(user, dialog.value) });

      setTimeout(function() {
        $('input:visible').focus();
      });
    },
    remove: function(user) {
      confirmDialog({title: "Delete User", label: "Really delete " + user.name + "?" }, function() { deleteUser(user) });
    },
    add: function() {
      confirmDialog({title: "Create User", label: "Pick a name for the test user", name: 'Name', type: 'text' }, function() { addUser(dialog.value) });
    }
  }
});

new Vue({
  el: '#overlay',
  data: {
    dialog: dialog
  },
  methods: {
    close: function() {
      closeDialog();
    },
    yes: function() {
      dialog.cb();
    }
  }
});
