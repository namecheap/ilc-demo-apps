import React, {Fragment} from 'react'
import { Scoped } from 'kremling'
import styles from './selected-person.krem.css'
import Homeworld from './homeworld.component.js'
import Films from '../../films/films.component.js'
import Parcel from 'ilc-adapter-react/parcel';

export default class SelectedPerson extends React.Component {

  state = {
    planetId: 1,
    selectedId: undefined,
  }

  render () {
    const { selectedPerson } = this.props
    return (
      <Scoped postcss={styles}>
        <div className='selectedPerson'>
          {
            selectedPerson !== undefined ? (
              <div>
                <div className='personName'>
                  <div className='personAttribute'>
                    <div className='attributeTitle'>
                      Name
                    </div>
                    <div>
                      {selectedPerson.name}
                    </div>
                  </div>
                </div>
                <div className='personAttribute'>
                  <div className='attributeTitle'>
                    height
                  </div>
                  <div>
                    {this.formatHeight(selectedPerson.height)}
                  </div>
                </div>
                <div className='personAttribute'>
                  <div className='attributeTitle'>
                    Mass
                  </div>
                  <div>
                    {selectedPerson.mass}
                  </div>
                </div>
                <div className='personAttribute'>
                  <div className='attributeTitle'>
                    Hair color
                  </div>
                  <div>
                    {selectedPerson.hair_color}
                  </div>
                </div>
                <div className='personAttribute'>
                  <div className='attributeTitle'>
                    Gender
                  </div>
                  <div>
                    {selectedPerson.gender}
                  </div>
                </div>
                <div className='personAttribute'>
                  <div className='attributeTitle'>
                    Birth Year
                  </div>
                  <div>
                    {selectedPerson.birth_year}
                  </div>
                </div>
                <div className='personAttribute'>
                  <div className='attributeTitle'>
                    Homeworld
                  </div>
                  <Homeworld homeworld={selectedPerson.homeworld} />
                </div>
                <div className='personAttribute'>
                  <div className='attributeTitle'>
                    Films
                  </div>
                  <Films films={selectedPerson.films} />
                </div>
              </div>
            ) : (
              <div>
                No one selected
                <hr/>
                <label>
                  Demo parcel from Vue.js app, planet ID: <br/>
                  <input type="text" value={this.state.planetId} onChange={this.handlePlanetIdChange}/>
                  <button onClick={this.handleOpenClick}>Open</button>
                </label>
                {
                  this.state.selectedId
                      ? <div>
                          <hr/>
                          <Parcel
                              loadingConfig={{appName:'@portal/planets', parcelName: 'planet'}}
                              wrapWith="div"
                              id={this.state.selectedId}
                          />
                        </div>
                      : null
                }
              </div>
            )
          }
        </div>
      </Scoped>
    )
  }

  formatHeight = (heightInCm) => {
    return `${heightInCm}cm (${heightInCm * 0.0328084}ft)`
  }

  handlePlanetIdChange = (event) => {
    this.setState({planetId: parseInt(event.target.value)});
  }

  handleOpenClick = () => {
      this.setState({selectedId: this.state.planetId});
  }

}
