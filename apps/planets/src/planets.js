import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import singleSpaVue from 'ilc-adapter-vue'
import configuredRouter from './router.js'

Vue.use(VueRouter);

const vueLifecycles = singleSpaVue({
  Vue,
  appOptions: {
    render(h) {
      return h(App, {
        props: {
          mountParcel: this.mountParcel,
        }
      })
    },
    router: configuredRouter,
  }
});

export const bootstrap = [
  vueLifecycles.bootstrap,
];

export const mount = [
  vueLifecycles.mount,
];

export const unmount = [
  vueLifecycles.unmount,
];
