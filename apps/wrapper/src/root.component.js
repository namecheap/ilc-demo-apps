import React, {useCallback} from 'react';

export default function RootComponent({renderApp = () => {}, serverLocation}) {
    const location = serverLocation ? serverLocation : window.location;

    const onClick = useCallback(() => {
        const url = new URL(location.href);
        url.searchParams.append('showApp', 1);
        history.pushState({}, undefined, url.toString());

        renderApp({ propFromWrapper: 'AAAAA', fromClick: 1 });
    }, [renderApp]);

    if (location.search.includes('showApp=1')) {
        renderApp({ propFromWrapper: 'AAAAA', fromLocation: 1 });
        return null;
    }

    return (
        <div>
            <div className="rootWrapper">
                <h1>Hello from wrapper!</h1>
                <button onClick={onClick}>Mount actual app</button>
            </div>
        </div>
    );
};