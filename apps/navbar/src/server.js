'use strict';

import React from 'react'
import { ServerLocation } from '@reach/router'
import App from './root.component';

export default function (appSdk, url, links = []) {
    return (
        <ServerLocation url={url}><App appSdk={appSdk} links={links}/></ServerLocation>
    );
}