export const mainSpa = (props) => {
	if (props.publicPath) {
		__webpack_public_path__ = props.publicPath;
	} else {
		console.warn(`Can't determine value of the "__webpack_public_path__", falling back to default one...`);
	}


	return require('./app-bootstrap');
};