import React from 'react'
import { Link } from '@reach/router'

const NavLink = props => (
    <Link
        {...props}
        getProps={({ isPartiallyCurrent }) => {
          // the object returned here is passed to the
          // anchor element's props
          return {
            style: isPartiallyCurrent ? {
              color: 'red'
            } : {}
          };
        }}
    />
);

export default class Root extends React.Component {
    constructor(props) {
        super(props);

        let state = {
            hasError: false,
            links: this.props.links || []
        };

        //SSR flow
        if (this.props.links) {
            this.state = state;
            return;
        }

        //CSR flow
        const appMessagesEl = this.props.domElementGetter().previousSibling;
        if (appMessagesEl.type === 'application/messages') {
            state.links = JSON.parse(appMessagesEl.innerHTML);
            appMessagesEl.parentElement.removeChild(appMessagesEl);
        } else {
            const lang = this.props.appSdk.intl.get().locale;
            import(`./links/${lang}.json`).then(v => {
                this.setState({links: v.default});
            });
        }

        this.state = state;
    }

    componentDidCatch(error, info) {
        this.setState({hasError: true})
    }

    componentDidMount() {
        this.props.appSdk.intl.watch((e) => {
            const langModule = import(`./links/${e.detail.locale}.json`);
            e.detail.addPendingResources(langModule);
            Promise.all([langModule, e.detail.onAllResourcesReady()]).then(([v]) => {
                this.setState({links: v.default});
            }).catch(() => {}); // Error handling happens at ILC side.
        });
    }

    render() {
        return (
            this.state.hasError ? (
                <div className='navbar-app'>
                    Error
                </div>
            ) : (
                <div className='navbar-app'>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            .navbar-app {
                                background-color: var(--primary);
                                display: flex;
                                align-items: center;
                                height: var(--navbar-height);
                            }
                
                            .navbar-app .primary-navigation-link {
                                color: var(--white);
                                text-decoration: none;
                                margin-left: 16px;
                                margin-right: 16px;
                            }
                
                            .navbar-app .primary-navigation-link:first-child {
                                margin-left: 32px;
                            }
                            `
                    }}/>
                    {
                        this.state.links.map((link) => {
                            return (
                                <NavLink key={link.href}
                                         to={this.props.appSdk.intl.localizeUrl(link.href)}
                                         className='primary-navigation-link'>
                                    {link.name}
                                </NavLink>
                            )
                        })
                    }
                    <span style={{color: 'gray'}}>This navbar (React, SSR)</span>
                </div>
            )
        )
    }
}