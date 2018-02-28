function DataStore(key) {
  this.save = function(value) {
    if(window.location.protocol == 'https:') {
      document.cookie = key + '=' + JSON.stringify(value) + ';secure';
    } else {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  };

  this.load = function() {
    function tryLoad() {
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

    var value;
    try { 
      value = tryLoad();
    } catch(e) {}

    return value || {};
  };

  this.clear = function() {
    if(window.location.protocol == 'https:') {
      document.cookie = key + '=';
    } else {
      sessionStorage.removeItem(key);
    }
  };
}

new Vue({
  el: '#app',
  data: {
    access: { message: null },
    users: [],
    dialog: { open: null, message: null, submitted: null, success: null }
  },
  created: function() {
    this.accessStore = new DataStore('_app_access');
    this.emailStore  = new DataStore('_saved_emails');

    Object.assign(this.access, this.accessStore.load());
    this.savedEmails = this.emailStore.load();

    if(this.access.token) {
      this.getTestUsers();
    } else {
      $(function() {
        setTimeout(function() { $('input:visible')[0].focus(); });
      });
    }
  },
  methods: {
    authorize: function() {
      this.access.message = '';

      $.ajax({
        url: 'https://graph.facebook.com/oauth/access_token',
        data: {
          client_id: this.access.client_id,
          client_secret: this.access.client_secret,
          grant_type: 'client_credentials'
        },
        context: this
      }).done(function(response) {
        this.getAppInfo(response.access_token);
      }).fail(this.onAccessFail);
    },

    disconnect: function() {
      this.confirmDialog({title: 'Disconnect', label: "Really sign out?"}, function() {
        this.accessStore.clear();
        this.access = {};
        this.users.splice(0, this.users.length);
        this.close();
      });
    },
    select: function(e) {
      e.target.select();
    },
    unlock: function(user) {
      this.confirmDialog({title: "Set Password", label: "Password for " + user.name, name: 'New password' }, function() { this.setPassword(user) });
    },
    remove: function(user) {
      this.confirmDialog({title: "Delete User", label: "Really delete " + user.name + "?" }, function() { this.deleteUser(user) });
    },
    add: function() {
      this.confirmDialog({title: "Create User", label: "Pick a name for the test user", name: 'Name' }, function() { this.addUser() });
    },
    close: function() {
      $.each(this.dialog, function(key, value) {
        this.dialog[key] = null;
      }.bind(this));

      $('body').css('overflow', 'auto');
    },
    accept: function() {
      this.dialog.cb.bind(this)();
    },

    onAccessFail: function(error) {
      this.access.message = error.responseJSON.error.message;
    },

    getAppInfo: function(token) {
      $.ajax({
        url: 'https://graph.facebook.com/' + this.access.client_id,
        data: {
          access_token: token
        },
        context: this
      }).done(function(response) {
        Object.assign(this.access, { app_name: response.name, token: token });
        this.accessStore.save(this.access);
        this.getTestUsers();
      }).fail(this.onAccessFail);
    },


    getTestUsers: function() {
      $.ajax({
        url: 'https://graph.facebook.com/' + this.access.client_id + '/accounts/test-users', 
        data: {
          access_token: this.access.token
        },
        context: this
      }).done(function(response) {
        this.getUserInfo(response.data);
      });
    },
    getUserInfo: function(users) {
      var ids = $.map(users, function(u) { return u.id });

      $.ajax({
        url: 'https://graph.facebook.com/',
        data: {
          access_token: this.access.token,
          fields: 'name,email',
          ids: ids.join(',')
        },
        context: this
      }).done(function(response) {

        $.each(users, function(i, user) {
          Object.assign(user, response[user.id]);

          this.users.push(user);

          if(user.email) {
            delete this.savedEmails[user.id];
            this.emailStore.save(this.savedEmails);
          } else {
            user.email = this.savedEmails[user.id];
          }
        }.bind(this));
      });
    },

    setPassword: function(user) {
      this.dialog.submitted = true;
      $.ajax({
        method: 'POST',
        url: 'https://graph.facebook.com/' + user.id,
        data: {
          password: this.dialog.value,
          access_token: this.access.token
        },
        context: this
      }).done(function(response) {
        if(response.success) {
          this.dialog.success = 'Password updated';
        }
      }).fail(function(response) {
        this.dialog.message = response.responseJSON.error.message;
      }).always(function() {
        this.dialog.submitted = false;
      });
    },

    addUser: function() {
      this.dialog.submitted = true;
      $.ajax({
        method: 'POST',
        url: 'https://graph.facebook.com/' + this.access.client_id + '/accounts/test-users', 
        data: {
          access_token: this.access.token,
          name: this.dialog.value,
          permissions: 'email'
        },
        context: this
      }).done(function(response) {
        var user = response;
        user.name = this.dialog.value;

        if(!this.dialog.value) {
          $.getJSON('https://graph.facebook.com/' + user.id, {
            access_token: this.access.token
          }, function(response) {
            user.name = response.name;
          });
        }

        Object.assign(this.dialog, {
          label: 'Change the default password',
          name: 'New password',
          value: user.password, 
          cb: function() {
            if(this.dialog.value == user.password || !this.dialog.value) {
              this.dialog.success = 'Kept default password';
            } else {
              this.setPassword(user);
            }
          }
        });

        this.users.push(user);

        this.savedEmails[user.id] = user.email;
        this.emailStore.save(this.savedEmails);

        setTimeout(function() {
          $('.dialog input:visible').select();
        });

      }).fail(function(response) {
        Object.assign(this.dialog, { message: response.responseJSON.error.message, submitted: null });
      }).always(function() {
        this.dialog.submitted = null;
      });
    },

    deleteUser: function(user) {
      this.dialog.submitted = true;
      $.ajax({
        method: 'DELETE',
        url: 'https://graph.facebook.com/' + user.id,
        data: {
          access_token: this.access.token
        },
        context: this
      }).done(function(response) {
        if(response.success) {
          this.dialog.success = 'User deleted';

          var i = this.users.findIndex(function(u) {
            return u.id == user.id;
          });

          this.users.splice(i, 1);
        }
      }).fail(function(response) {
        this.dialog.message = response.responseJSON.error.message;
      }).always(function() {
        this.dialog.submitted = false;
      });
    },

    confirmDialog: function(props, cb) {
      Object.assign(this.dialog, { open: true, cb: cb, value: '' }, props);

      $('body').css('overflow', 'hidden');

      setTimeout(function() {
        $('.dialog input:visible').focus();
      });
    },

  }
});

