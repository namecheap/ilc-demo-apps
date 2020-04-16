// For lazy loading within an application to work you need to set webpack's public path
// basically webpack's internal module system always looks for code-splits (modules) at the root
export default function setPublicPath(props) {
  return Promise.all([getUrl(props)]).then(values => {
    const [url] = values
    const webpackPublicPath = url.slice(0, url.lastIndexOf('/') + 1)

    __webpack_public_path__ = webpackPublicPath
    return true
  })
}

function getUrl(props) {
  if (props.publicPath) {
    return props.publicPath;
  }

  console.warn(`Can't determine publicPath for Planets app, falling back to http://localhost:8236/`);
  //return window.System.resolve('@portal/people')
  return 'http://localhost:8236/people.js';
}
