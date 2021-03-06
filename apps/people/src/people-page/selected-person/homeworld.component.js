import React from 'react'
import AsyncDecorator from 'async-decorator/rx6'
import { getPlanet } from '../../utils/api.js'
import { operators } from 'rxjs'
const { flatMap, tap } = operators
import { Link } from 'react-router-dom'

@AsyncDecorator
export default class Homeworld extends React.Component {

  state = {
    homeworld: undefined,
    error: false
  }

  componentDidMount() {
    this.props.cancelWhenUnmounted(
      this.props.stream(
        props => props.homeworld
      ).pipe(
        tap(() => {
          this.setState({homeworld: undefined})
        }),
        flatMap(
          (homeworldUrl) => {
            return getPlanet(homeworldUrl.match(/([0-9]+)\/$/)[1])
          }
        )
      ).subscribe(
        (planet) => this.setState({homeworld: planet}),
        (err) => this.setState({error: true}, () => {
          console.error(err)
        })
      )
    )
  }

  render () {
    const { homeworld, error } = this.state
    return (
      <div className='homeworld'>
        {
          error && (
            <div>
              Error Loading
            </div>
          )
        }
        {
          homeworld === undefined && !error && (
            <div>
              ... Loading
            </div>
          )
        }
        {
          homeworld && (
            <a
              className='brand-link'
              href={`/planets/${homeworld.id}/attributes`}
            >
              {homeworld.name}
            </a>

          )
        }

      </div>
    )
  }
}
