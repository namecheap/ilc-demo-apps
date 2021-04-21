import VueRouter from 'vue-router';
import PlanetPage from './planet-page.vue';
import Attributes from './selected-planet/info-tabs/attributes.vue';
import People from './selected-planet/info-tabs/people.vue';

const routes = [
  {
    path: '/:lang?',
    component: { render (c) { return c('router-view') } },
    children: [
      { path: 'planets', component: PlanetPage, name: 'planets-root' },
      {
        path: 'planets/:id',
        component: PlanetPage,
        children: [
          {
            name: 'attributes',
            path: 'attributes',
            component: Attributes,
            props: true,
          },
          {
            name: 'people',
            path: 'people',
            component: People,
            props: true,
          }
        ]
      }
    ]
  },
]

const router = new VueRouter({mode: 'history', routes})

export default router
