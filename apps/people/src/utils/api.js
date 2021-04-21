import fetchWithCache from '@portal/fetchWithCache'

export function getPeople(pageNum = 1) {
  return fetchWithCache(`people/?page=${pageNum}`)
}

export function getPerson(personId) {
  return fetchWithCache(`people/${personId}/`);
}

export function getPlanet(id) {
  return fetchWithCache(
    `planets/${id}/`
  )
}

export function getFilm(filmId) {
  return fetchWithCache(
    `films/${filmId}/`
  )
}

export function getFilms() {
  return fetchWithCache(
    `films`
  )
}
