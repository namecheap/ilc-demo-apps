import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.config.productionTip = false;
Vue.config.devtools = false;
// planets.js does this too; components tested on their own need <router-link>/<router-view> registered
Vue.use(VueRouter);

const mounted = [];
const warnings = [];

// Vue warnings (invalid props, errors thrown in hooks or render, ...) fail the test that caused them
Vue.config.warnHandler = (msg, vm, trace) => warnings.push(`${msg}${trace}`);

afterEach(() => {
    destroyAll();
    expect(warnings.splice(0)).toEqual([]);
});

// Renders `component` with reactive props (change `root.props.x` to update them) under a fresh root instance
export function mount(component, { props = {}, router, provide, listeners } = {}) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = new Vue({
        router,
        provide,
        data: () => ({ props }),
        render(h) {
            return h(component, { props: this.props, on: listeners });
        },
    }).$mount(el);
    mounted.push(root);
    return root;
}

// Renders the app's route tree (<router-view> at the top, as App.vue does) for the router's current location
export function mountRoutes(router, { provide } = {}) {
    return mount({ render: (h) => h('router-view') }, { router, provide });
}

export function destroyAll() {
    while (mounted.length) {
        const root = mounted.pop();
        root.$destroy();
        root.$el.remove();
    }
}

// Every instance of a component (the options object a .vue file exports) under `vm`
export function findAll(vm, component) {
    const found = vm.constructor.extendOptions === component ? [vm] : [];
    return vm.$children.reduce((all, child) => all.concat(findAll(child, component)), found);
}

export function find(vm, component) {
    const [first] = findAll(vm, component);
    if (!first) {
        throw new Error('Component is not rendered');
    }
    return first;
}

export const text = (vm) => vm.$el.textContent.replace(/\s+/g, ' ').trim();

export const nextTick = () => Vue.nextTick();

// Lets pending promise callbacks (e.g. the single-spa parcel's mount chain) run, then the re-render
export async function flush() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Vue.nextTick();
}

export function click(el) {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
}

// Navigates the router; unlike router.push in vue-router < 3.5, going where it already is is fine
export async function visit(router, path) {
    if (router.currentRoute.fullPath !== path) {
        await router.push(path);
    }
}
