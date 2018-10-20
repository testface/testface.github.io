(function() {

  Vue.component('article-summary', {
    props: ['article'],
    methods: {
      show: function() {
        this.$root.$emit('show', this.article.youtube_id);
      }
    },
    template: '\
      <div class="article"> \
        <div class="thumbnail"> \
          <img :src="article.thumbnail"> \
        </div> \
        <div class="info"> \
          <div class="title"> \
            <a :href="article.url" v-if="article.url" target="_blank"> {{ article.title }} </a> \
            <a href="#" v-on:click.prevent.stop="show()" v-if="article.youtube_id"> {{ article.title }} </a> \
          </div> \
          <div class="date"> {{ article.date }} </div> \
          <p class="description"> {{ article.description }} </p> \
        </div> \
      </div> \
      '
  });

  Vue.component('video-modal', {
    data: function() {
      return {
        video_url: ''
      };
    },
    mounted: function() {
      this.$root.$on('show', this.show.bind(this));
    },
    methods: {
      show: function(id) {
        this.video_url = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
        document.body.style.overflow = 'hidden';
      },
      hide: function() {
        this.video_url = '';
        document.body.style.overflow = '';
      }
    },
    template: '\
      <div class="overlay" v-show="video_url" v-on:click="hide()"> \
        <div class="modal"> \
          <button v-on:click="hide()"> <i class="fa fa-times"></i> </button> \
          <iframe :src="video_url" allow="autoplay; encrypted-media" allowfullscreen></iframe> \
        </div> \
      </div> \
      '
  });

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
