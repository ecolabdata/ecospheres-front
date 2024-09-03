export interface Feature {
  type: string
  geometry: {
    type: string
    coordinates: number[]
  }
  properties: {
    [key: string]: any
  }
}

export interface FeatureCollection {
  type: string
  features: Feature[]
}

export interface MapOptions {
  zoom: number
  minx: number
  miny: number
  maxx: number
  maxy: number
}

export interface Station {
  id: string
  name: string
}

export interface Indicateur {
  name: string
  code: string
}

export interface Dataset {
  prod: string
  dev: string
  id: string
  departement: boolean
  periode: boolean
  indicateur?: boolean
  indicateursListe?: Indicateur[]
}
