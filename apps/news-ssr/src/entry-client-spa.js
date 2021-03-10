import Vue from 'vue';
import singleSpaVue from 'ilc-adapter-vue';
import { createApp } from "./app";

const { router, store, App } = createApp();

const vueMixin = {
	beforeRouteUpdate (to, from, next) {
		const { asyncData } = this.$options;
		if (asyncData) {
			asyncData({
				store: this.$store,
				route: to
			}).then(next).catch(next)
		} else {
			next()
		}
	}
};

const createBeforeResolveRouterHandler = (appId) => (to, from, next) => {
	if (window[`__${appId}__`]) { // We don't need to fetch data from server if we were loaded with SSR
		delete window[`__${appId}__`];
		return next();
	}

	const matched = router.getMatchedComponents(to);
	const prevMatched = router.getMatchedComponents(from);

	let diffed = false;

	const activated = matched.filter((c, i) => {
		return diffed || (diffed = (prevMatched[i] !== c));
	});

	const asyncDataHooks = activated.map(c => c.asyncData).filter(_ => _);

	if (!asyncDataHooks.length) {
		return next()
	}

	Promise.all(asyncDataHooks.map(hook => hook({ store, route: to })))
		.then(() => {
			next();
		})
		.catch(err => {
			if (err.code === 404 || (err.response && [404, 400].includes(err.response.status))) { //we have 400 alongside 404 as news api responds with 400 instead of 404
				//TODO: see https://github.com/vuejs/vue-router/issues/977 It explains issue with history
				// Possible solution: https://github.com/raniesantos/vue-error-page
				return next({ name: '404', params: [to.path], query: to.query, replace: true });
			}
			next(err);
		})
};

const replaceState = (appId) => {
	if(window[`__${appId}__`]) {
		store.replaceState(window[`__${appId}__`]);
	}
};

const vueLifecycles = singleSpaVue({
	Vue,
	appOptions: {
		mixins: [vueMixin],
		render: h => h(App),
		router,
		store,
	}
});

export const bootstrap = (props) => {
	console.log('News bootstrap!!');

	router.beforeResolve(createBeforeResolveRouterHandler(props.appId));

	return vueLifecycles.bootstrap(props);
};

export const mount = props => {
	console.log('News mount!!');

	replaceState(props.appId);

	return vueLifecycles.mount(props);
};
export const unmount = props => {
	console.log('News unmount!!');
	return vueLifecycles.unmount(props);
};
