import React, {Fragment} from 'react'
import styles from './people-list.css'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import CSSModules from 'react-css-modules';

class PeopleList extends React.Component {

  render () {
    const { people, loadingPeople } = this.props
    return (
      <div className='peopleList'>
        <Fragment>
          {
            people.map((person) => {
              return (
                <Link
                  key={person.name}
                  styleName="person"
                  to={`${this.props.match.path}?selected=${window.encodeURIComponent(person.id)}`}
                >
                  {person.name}
                </Link>
              )
            })
          }
          {
            loadingPeople && (
              <div>
                Loading ...
              </div>
            )
          }
        </Fragment>
      </div>
    )
  }

  onKeyPress = (evt, index) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      this.props.selectPerson(index)
    }
  }
}

export default withRouter(CSSModules(PeopleList, styles));
