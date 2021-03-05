import React from 'react';
import AsyncDecorator from 'async-decorator/rx6';

import { getPerson } from './utils/api.js';
import SelectedPerson from './people-page/selected-person/selected-person.component.js';

@AsyncDecorator
export default class PersonParcel extends React.Component {

    state = {
        id: this.props.id,
        loading: true,
        selectedPerson: undefined,
    }

    componentDidMount() {
        this.fetchPerson();
    }

    render() {
        const { selectedPerson} = this.state
        return (
            <div className='selectedPerson'>
                {
                    this.state.loading
                        ? <span>Loading information about selected person...</span>
                        : <SelectedPerson
                            selectedPerson={selectedPerson}
                        />
                }
            </div>
        )
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.id !== prevProps.id) {
            this.setState({id: this.props.id});
            this.fetchPerson();
        }
    }


    fetchPerson = () => {
        this.setState({loading: true}, () => {
            this.props.cancelWhenUnmounted(
                getPerson(this.state.id).subscribe(
                    (results) => {
                        this.setState({selectedPerson: results, loading: false});
                    },
                    (err => {
                        console.log('Error when loading data about selected person', err)
                    })
                )
            )
        })
    }
}
