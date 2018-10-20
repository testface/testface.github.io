(function() {
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
      <div class="overlay" v-if="video_url" v-on:click="hide()"> \
        <div class="modal"> \
          <iframe :src="video_url" allow="autoplay; encrypted-media" allowfullscreen></iframe> \
          <button v-on:click="hide()"> <i class="fa fa-times"></i> </button> \
        </div> \
      </div> \
      '
  });
})();
