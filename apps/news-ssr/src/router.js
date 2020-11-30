import Vue from 'vue';
import Router from 'vue-router';
import Home from './components/Home.vue';
import Articles from './components/Articles.vue';
import NotFound from './components/NotFound.vue';

Vue.use(Router);

export const createRouter = () => {
	return new Router({
		mode: 'history',
		base: '/',
		routes: [
			{
				path: '/:lang?',
				component: { render (c) { return c('router-view') } },
				children: [
					{ path: 'news/', component: Home }, // () => import('../components/Home.vue')
					{ path: 'news/article/:source', component: Articles}, // () => import('../components/Articles.vue')
					{ path: '*', name: '404', component: NotFound },
				]
			},
			{ path: '*', name: '404', component: NotFound }
		]
	});
};
