import React from 'react';
import ReactDOM from 'react-dom';
import singleSpaReact from 'single-spa-react';
import RootComponent from './root.component';

const reactLifecycles = singleSpaReact({
    React,
    ReactDOM,
    rootComponent: RootComponent,
    renderType: 'hydrate',
});

export const bootstrap = props => {
    console.log('wrapper "bootstrap" called with props', props);
    return reactLifecycles.bootstrap(props);
};
export const mount = props => {
    console.log('wrapper "mount" called with props', props);
    return reactLifecycles.mount(props);
};
export const unmount = props => {
    console.log('wrapper "unmount" called with props', props);
    return reactLifecycles.unmount(props);
};
export const unload = reactLifecycles.unload;