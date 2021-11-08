import './css/styles.css';
import singleSpaHtml from './single-spa-html-tpl';
import tpl from './tpl.ejs'

export default singleSpaHtml({
    template: tpl,
});