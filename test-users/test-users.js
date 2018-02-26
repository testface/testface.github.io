var userList = [];

var dialog = {
  open: false,
  label: null,
  name: null,
  value: null,
  success: null,
  message: null,
  submitted: false
};

var access;
try {
  access = load('_app_access');
} catch(e) {
}

if(!access) {
  clear('_app_access');
}

if(access.token) {
  getTestUsers();
} else {
  $(function() {
    setTimeout(function() { $('input:visible')[0].focus(); });
  });
}

var savedEmails;
try {
  savedEmails = load('_saved_emails');
} catch(e) {
}
if(!savedEmails) {
  savedEmails = {};
}

function save(key, value) {
  if(window.location.protocol == 'https:') {
    document.cookie = key + '=' + JSON.stringify(value) + ';secure';
  } else {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}

function load(key) {
  if(window.location.protocol == 'https:') {
    var cookies = {};
    $.each(document.cookie.split(/;\s+/), function(i, c) {
      var j = c.indexOf('=');
      cookies[c.substr(0, j)] = c.substr(j+1);
    });
    return JSON.parse(cookies[key]);
  } else {
    return JSON.parse(sessionStorage.getItem(key));
  }
}

function clear(key) {
  if(!access)
    access = {}

  access.app_name = null;
  access.client_id = null;
  access.client_secret = null;
  access.token = null;
  access.message = null;

  if(window.location.protocol == 'https:') {
    document.cookie = key + '=';
  } else {
    sessionStorage.setItem(key, JSON.stringify(access));
  }
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

      if(user.email) {
        delete savedEmails[user.id];
        save('_saved_emails', savedEmails);
      } else {
        user.email = savedEmails[user.id];
      }
    });
  });
}

function getToken() {
  access.message = '';

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
    save('_app_access', access);
    getTestUsers();
  }).fail(onAccessFail);
}

function confirmDialog(props, cb) {
  dialog.open = true;
  dialog.title = props.title;
  dialog.label = props.label;
  dialog.name = props.name;
  dialog.value = '';
  dialog.cb = cb;

  $('body').css('overflow', 'hidden');

  setTimeout(function() {
    if($('.dialog input:visible').val()) {
      $('.dialog input:visible').select();
    } else {
      $('.dialog input:visible').focus();
    }
  });
}

function closeDialog() {
  dialog.open = false;
  dialog.success = null;
  dialog.message = null;
  dialog.name = null;
  dialog.submitted = false;
  dialog.cb = null;

  $('body').css('overflow', 'auto');
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

function addUser(name) {
  dialog.submitted = true;
  $.ajax({
    method: 'POST',
    url: 'https://graph.facebook.com/' + access.client_id + '/accounts/test-users', 
    data: {
      access_token: access.token,
      name: name
    }
  }).done(function(response) {
    var user = response;
    user.name = name;
    dialog.value = user.password;
    dialog.label = 'Choose a password';
    dialog.name = 'New password';
    dialog.cb = function() {
      setPassword(user, dialog.value);
    };

    userList.push(user);

    savedEmails[user.id] = user.email;
    save('_saved_emails', savedEmails);

  }).fail(function(response) {
    dialog.message = response.responseJSON.error.message;
    dialog.submitted = false;
  }).always(function() {
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
      confirmDialog({title: 'Disconnect', label: "Really sign out?"}, function() {
        clear('_app_access')
        userList = [];
        closeDialog();
      });
    },
    select: function(e) {
      e.target.select();
    },
    unlock: function(user) {
      confirmDialog({title: "Set Password", label: "Password for " + user.name, name: 'New password' }, function() { setPassword(user, dialog.value) });
    },
    remove: function(user) {
      confirmDialog({title: "Delete User", label: "Really delete " + user.name + "?" }, function() { deleteUser(user) });
    },
    add: function() {
      confirmDialog({title: "Create User", label: "Pick a name for the test user", name: 'Name' }, function() { addUser(dialog.value) });
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
