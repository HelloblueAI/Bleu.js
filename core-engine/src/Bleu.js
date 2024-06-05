class Bleu {
  constructor(options) {
      this.$options = options;
      this.init();
  }

  init() {
      if (this.$options.created) {
          this.$options.created.call(this);
      }

      this.mount(this.$options.el);
  }

  mount(el) {
      const element = document.querySelector(el);
      if (element) {
          element.innerHTML = this.$options.render();
      }
  }

  static use(plugin) {
      if (plugin.install) {
          plugin.install(this);
      } else if (typeof plugin === 'function') {
          plugin(this);
      }
  }
}

// Error handling configuration
Bleu.config = {
  errorHandler: (err, vm, info) => {
      console.error('Bleu error:', err, info);
  }
};

export default Bleu;
