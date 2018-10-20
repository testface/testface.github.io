(function() {

  new Vue({
    el: '#articles',
    data: {
      articles: [],
      foo: ''
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
      http.open('GET', 'articles.json?t=' + new Date().getTime());
      http.send();
    }
  })

})();
