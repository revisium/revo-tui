const ADAPTER_SUFFIX = ' ACP'

export function agentLabelOf(
  displayName: string,
  reportedVersion: string | undefined,
): string {
  const tokens = (reportedVersion ?? '').split(/\s+/)
  const version = tokens.find(isVersion)
  const product = productOf(reportedVersion ?? '')
  const name = product ?? withoutAdapterSuffix(displayName)
  return version === undefined ? name : `${name} ${version}`
}

function isVersion(token: string): boolean {
  return token.includes('.') && token.split('.').every(isNumeric)
}

function isNumeric(part: string): boolean {
  return part !== '' && Number.isInteger(Number(part))
}

function productOf(reported: string): string | undefined {
  const open = reported.indexOf('(')
  const close = reported.indexOf(')', open)
  if (open < 0 || close < 0) {
    return undefined
  }

  return reported.slice(open + 1, close).trim() || undefined
}

function withoutAdapterSuffix(name: string): string {
  return name.toLowerCase().endsWith(ADAPTER_SUFFIX.toLowerCase())
    ? name.slice(0, -ADAPTER_SUFFIX.length)
    : name
}
