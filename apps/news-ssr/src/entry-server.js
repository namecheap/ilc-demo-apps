export default context => {
	if (context.publicPath) {
		__webpack_public_path__ = context.publicPath;
	} else {
		console.warn(`Can't determine value of the "__webpack_public_path__", falling back to default one...`);
	}
	
	const  { createApp } = require('./app');

	return new Promise((resolve, reject) => {
		context.statusCode = 200;
		
		const { initApp, router, store } = createApp();
		
		router.push(context.url);

		function renderApp() {
			const matchedComponents = router.getMatchedComponents();

			if (router.currentRoute.name === '404') {
				context.statusCode = 404;
			}

			Promise.all(matchedComponents.map(Component => {
				if(Component.asyncData){
					return Component.asyncData({
						store,
						route: router.currentRoute
					})
				}
			})).then(() => {
				const app = initApp();

				if (context.statusCode === 200) { //We want state to be re-calculated at client side in case of "errored" render
					context.state = store.state;
				}
				context.meta = app.$meta();
				resolve(app);

			}).catch(e => {
				if (e.code === 404 || (e.response && [404, 400].includes(e.response.status))) { //we have 400 alongside 404 as news api responds with 400 instead of 404
					console.log('Not found error from API caught! Re-rendering app...');
					router.push('/404');
					return renderApp();
				}

				context.statusCode = 500;
				reject(e);
			});
		}
		
		router.onReady(renderApp, reject);
		
	});
};
