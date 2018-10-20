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
})();
