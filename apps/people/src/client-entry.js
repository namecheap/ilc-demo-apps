import React from 'react'
import ReactDOM from 'react-dom'
import singleSpaReact from './adapter/single-spa-react'
import { property } from 'lodash'

const reactLifecycles = singleSpaReact({
    React,
    ReactDOM,
    loadRootComponent: () => import('./root.component.js').then(property('default')),
    parcelCanUpdate: false,
});

export const parcels = {
    person: singleSpaReact({
        React,
        ReactDOM,
        loadRootComponent: () => import('./person.parcel.js').then(property('default')),
    })
};

export const bootstrap = reactLifecycles.bootstrap;
export const mount = reactLifecycles.mount;
export const unmount = reactLifecycles.unmount;
export const unload = reactLifecycles.unload;
