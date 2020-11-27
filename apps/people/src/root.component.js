import React from 'react'
import {BrowserRouter, Route} from 'react-router-dom';
import PeoplePage from './people-page/people-page.component.js'

export default class Root extends React.Component {

    state = {
        hasError: false,
        routerKey: Math.random(), // Dirty hack to make dynamic basename work & overcome https://github.com/ReactTraining/react-router/issues/5465
        basename: this.props.appSdk.intl.localizeUrl(this.props.getCurrentBasePath()),
    }

    componentDidCatch(error, info) {
        this.setState({hasError: true})
    }

    componentDidMount() {
        this.props.appSdk.intl.onChange(
            () => {},
            () => {
                this.setState({
                    basename: this.props.appSdk.intl.localizeUrl(this.props.getCurrentBasePath()),
                    routerKey: Math.random()
                });
            }
        );
    }

    render() {
        const { basename } = this.state;

        return (
            this.state.hasError ? (
                <div>
                    Error
                </div>
            ) : (
                <BrowserRouter key={this.state.routerKey} basename={basename}>
                    <Route
                        path='/'
                        component={PeoplePage}
                    />
                </BrowserRouter>
            )
        )
    }
}
