import { computeAccounts } from './accounts'
import { computeAllocation } from './allocate'
import { computeNaturalFlow } from './naturalFlow'
import type { ReportInputs, ReportResult } from './types'

export function runReport(inputs: ReportInputs, dataQuality: ReportResult['dataQuality'] = 'PROVISIONAL'): ReportResult {
  const page1 = computeNaturalFlow(inputs)
  const page2 = computeAllocation(inputs, page1)
  const page3 = computeAccounts(inputs, page1, page2)
  return { page1, page2, page3, dataQuality }
}
