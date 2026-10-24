import type { Locality } from '../types'

/** Selectable localities. Coordinates are approximate area centres used for demo distance maths only. */
export const LOCALITIES: Locality[] = [
  { id: 'kothrud', name: 'Kothrud', city: 'Pune', lat: 18.5074, lng: 73.8077 },
  { id: 'shivajinagar', name: 'Shivajinagar', city: 'Pune', lat: 18.5308, lng: 73.8475 },
  { id: 'baner', name: 'Baner', city: 'Pune', lat: 18.559, lng: 73.7868 },
  { id: 'viman-nagar', name: 'Viman Nagar', city: 'Pune', lat: 18.5679, lng: 73.9143 },
  { id: 'koregaon-park', name: 'Koregaon Park', city: 'Pune', lat: 18.5362, lng: 73.8938 },
  { id: 'hinjewadi', name: 'Hinjewadi', city: 'Pune', lat: 18.5912, lng: 73.7389 },
]

export const DEFAULT_LOCALITY_ID = 'shivajinagar'

export const getLocality = (id: string): Locality =>
  LOCALITIES.find((l) => l.id === id) ?? LOCALITIES[0]
