import { ROCK_SPRINGS_DEFAULT_CFS } from './constants'

export interface GageCatalogEntry {
  stationNbr: string
  name: string
  role: 'STREAM' | 'CANAL' | 'RESERVOIR' | 'SPILL' | 'EVAP'
  seriesKey: string
  source: 'OWRD' | 'USBR' | 'MANUAL' | 'HYDROMET'
  defaultCfs?: number
  sortOrder: number
  optional?: boolean
}

export const GAGE_CATALOG: GageCatalogEntry[] = [
  { stationNbr: 'ROCKSPRINGS', name: 'Rock Springs (constant)', role: 'STREAM', seriesKey: 'rockSpringsCfs', source: 'MANUAL', defaultCfs: ROCK_SPRINGS_DEFAULT_CFS, sortOrder: 10 },
  { stationNbr: '14050000', name: 'Deschutes below Snow Creek', role: 'STREAM', seriesKey: 'snowCreekCfs', source: 'OWRD', sortOrder: 20, optional: true },
  { stationNbr: '14050500', name: 'Cultus River', role: 'STREAM', seriesKey: 'cultusRiverCfs', source: 'OWRD', sortOrder: 30, optional: true },
  { stationNbr: '14051000', name: 'Cultus Creek', role: 'STREAM', seriesKey: 'cultusCkCfs', source: 'OWRD', sortOrder: 40, optional: true },
  { stationNbr: '14052000', name: 'Deer Creek', role: 'STREAM', seriesKey: 'deerCkCfs', source: 'OWRD', sortOrder: 50, optional: true },
  { stationNbr: '14052500', name: 'Quinn River', role: 'STREAM', seriesKey: 'quinnRiverCfs', source: 'OWRD', sortOrder: 60, optional: true },
  { stationNbr: '14053000', name: 'Charlton Creek', role: 'STREAM', seriesKey: 'charltonCkCfs', source: 'OWRD', sortOrder: 70, optional: true },
  { stationNbr: '14054000', name: 'Deschutes below Crane Prairie', role: 'STREAM', seriesKey: 'descBlwCraneCfs', source: 'OWRD', sortOrder: 80 },
  { stationNbr: '14056500', name: 'Deschutes below Wickiup', role: 'STREAM', seriesKey: 'descBlwWickiupCfs', source: 'OWRD', sortOrder: 90 },
  { stationNbr: '14060000', name: 'Crescent Creek', role: 'STREAM', seriesKey: 'crescentCkCfs', source: 'OWRD', sortOrder: 100 },
  { stationNbr: '14064500', name: 'Deschutes at Benham Falls', role: 'STREAM', seriesKey: 'descAtBenhamCfs', source: 'OWRD', sortOrder: 110 },
  { stationNbr: '14065500', name: 'Arnold Canal', role: 'CANAL', seriesKey: 'arnoldCfs', source: 'OWRD', sortOrder: 120 },
  { stationNbr: '14066500', name: 'Central Oregon Canal', role: 'CANAL', seriesKey: 'coidCanalCfs', source: 'OWRD', sortOrder: 130 },
  { stationNbr: 'DCMO', name: 'DCMID Canal (USBR DCMO)', role: 'CANAL', seriesKey: 'dcmidCfs', source: 'USBR', sortOrder: 140 },
  { stationNbr: '14069000', name: 'North Unit Main Canal', role: 'CANAL', seriesKey: 'nuidCfs', source: 'OWRD', sortOrder: 150 },
  { stationNbr: '14069500', name: 'North Canal', role: 'CANAL', seriesKey: 'northCanalCfs', source: 'OWRD', sortOrder: 160 },
  { stationNbr: 'SWCO', name: 'Swalley Canal (USBR SWCO)', role: 'CANAL', seriesKey: 'swalleyCfs', source: 'USBR', sortOrder: 170 },
  { stationNbr: '14069700', name: 'Lone Pine Canal', role: 'CANAL', seriesKey: 'lonePineNetCfs', source: 'OWRD', sortOrder: 180 },
  { stationNbr: '14070500', name: 'Deschutes below Bend (DEBO)', role: 'STREAM', seriesKey: 'deboCfs', source: 'OWRD', sortOrder: 190 },
  { stationNbr: 'NUID_SPILL', name: 'North Unit spill weir', role: 'SPILL', seriesKey: 'nuidSpillCfs', source: 'MANUAL', sortOrder: 200 },
  { stationNbr: '14053500', name: 'Crane Prairie Reservoir', role: 'RESERVOIR', seriesKey: 'cranePrairieElev', source: 'OWRD', sortOrder: 210 },
  { stationNbr: '14056000', name: 'Wickiup Reservoir', role: 'RESERVOIR', seriesKey: 'wickiupElev', source: 'OWRD', sortOrder: 220 },
  { stationNbr: '14059500', name: 'Crescent Lake Reservoir', role: 'RESERVOIR', seriesKey: 'crescentElev', source: 'OWRD', sortOrder: 230 },
  { stationNbr: 'WICK_EVAP', name: 'Wickiup evaporation pan (inches)', role: 'EVAP', seriesKey: 'wickiupEvapIn', source: 'MANUAL', sortOrder: 240 },
]
