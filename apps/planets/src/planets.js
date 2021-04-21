import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import PlanetParcel from './planet-parcel.vue'
import singleSpaVue from 'ilc-adapter-vue'
import configuredRouter from './router.js'

Vue.use(VueRouter);

export default {
  ...singleSpaVue({
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
  }),
  parcels: {
    planet: singleSpaVue({
      Vue,
      appOptions: {
        render(h) {
          return h(PlanetParcel, {
            props: {
              id: this.id,
              mountParcel: this.mountParcel,
            }
          })
        },
      }
    })
  }
};