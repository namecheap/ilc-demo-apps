import React, {Fragment} from 'react'
import AsyncDecorator from 'async-decorator/rx6'
import { from, operators } from 'rxjs'
const { tap, mergeMap, switchMap } = operators
import styles from './films.css'
import { getFilm } from '../utils/api.js'
import Film from './film.component.js'
import CSSModules from 'react-css-modules';

class Films extends React.Component {

  state = {
    films: [],
    error: false
  }

  componentDidMount() {
    this.props.cancelWhenUnmounted(
      this.props.stream(
        (props) => {
          return props.films
        }
      )
        .pipe(
          switchMap(films => from(films)),
          tap(() => this.setState({ films: [] })),
          mergeMap(film => {
            return getFilm(film.match(/([0-9]+)\/$/)[1])
          }),
        ).subscribe(
          (film) => {
            this.setState(prev => {
              const films = [...prev.films, film]
              return { films }
            })
          },
          (err) => this.setState({ error: true })
        )
    )
  }

  render() {
    const { films, error } = this.state
    return (
      <div styleName='films'>
        {
          error && (
            <div>
              Error
            </div>
          )
        }
        {
          films.length !== this.props.films.length && !error && (
            <div>
              ... Loading
            </div>
          )
        }
        {
          films.length === this.props.films.length && !error && (
            <Fragment>
              {
                films.map((film) => {
                  return (
                    <Film key={film.episode_id} film={film} />
                  )
                })
              }
            </Fragment>
          )
        }
      </div>
    )
  }
}

export default AsyncDecorator(CSSModules(Films, styles));
