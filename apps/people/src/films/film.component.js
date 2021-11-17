import React from 'react'
import { imageMap } from './film.helpers.js'
import styles from './films.css'
import CSSModules from 'react-css-modules';

class Film extends React.Component {

  state = {
    showOverlay: false
  }

  render () {
    const { film } = this.props
    return (
      <div styleName="film"
        onMouseEnter={this.mouseOn}
        onMouseLeave={this.mouseOut}
        tabIndex={0}
      >
        <img styleName="filmPoster" src={imageMap[film.episode_id]} alt={film.title} />
        {
          this.state.showOverlay && (
            <div styleName="filmOverlay">
              <div>
                <div>
                  <div>
                    Directed By
                  </div>
                  <div>
                    {film.director}
                  </div>
                </div>
                <div>
                  <div>
                    Released on
                  </div>
                  <div>
                    { film.release_date }
                  </div>
                </div>
                <div>
                  <div>
                    Produced by
                  </div>
                  <div>
                    { film.producer }
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div>
    )
  }

  mouseOn = () => {
    this.setState({showOverlay: true})
  }

  mouseOut = () => {
    this.setState({showOverlay: false})
  }
}

export default CSSModules(Film, styles);
