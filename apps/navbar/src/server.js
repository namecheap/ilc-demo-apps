'use strict';

import React from 'react'
import { ServerLocation } from '@reach/router'
import App from './root.component';
import IlcAppSdk from 'ilc-sdk/app';

export default function (ilcReqData, url, links = []) {
    const clientSdk = new IlcAppSdk(ilcReqData);
    return (
        <ServerLocation url={url}><App appSdk={clientSdk} links={links}/></ServerLocation>
    );
}