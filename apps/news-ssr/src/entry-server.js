export default context => {
	if (context.publicPath) {
		__webpack_public_path__ = context.publicPath;
	} else {
		console.warn(`Can't determine value of the "__webpack_public_path__", falling back to default one...`);
	}
	
	const  { createApp } = require('./app');

	return new Promise((resolve, reject) => {
		
		const { initApp, router, store } = createApp();
		
		router.push(context.url);
		
		router.onReady(() => {
			
			const matchedComponents = router.getMatchedComponents();
			
			if(!matchedComponents.length){
				return reject({code: 404});
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

				context.state = store.state;
				context.meta = app.$meta();
				resolve(app);
				
			}).catch(reject);
		}, reject);
		
	});
};
