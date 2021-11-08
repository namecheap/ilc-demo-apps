import './css/styles.css';
import React from 'react';
import singleSpaReact from 'ilc-adapter-react';

export default {
    ...singleSpaReact({
        loadRootComponent: () => import('./root.component.js').then(v => v.default),
        parcelCanUpdate: false,
    }),
    parcels: {
        person: singleSpaReact({
            loadRootComponent: () => import('./person.parcel.js').then(v => v.default),
        })
    }
};