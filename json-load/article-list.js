(function() {
  Vue.component('article-list', {
    data: function() {
      return {
        articles: []
      }
    },
    created: function() {
      var http = new XMLHttpRequest;
      
      http.onreadystatechange = function() {
        if(http.readyState === XMLHttpRequest.DONE) {
          if(http.status == 200) {
            try {
              this.articles = JSON.parse(http.responseText).articles;
            } catch(e) {}
          }
        }
      }.bind(this);
      http.open('GET', 'list-of-articles.json?t=' + new Date().getTime());
      http.send();
    },
    template: '\
      <div class="article-list"> \
        <article-summary v-for="article in articles" v-bind:article="article"></article-summary> \
      </div> \
      '
  });
})();
