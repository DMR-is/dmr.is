import tracer from 'dd-trace'

export function apmInit(): void {
  tracer.init()
  tracer.use('http', {
    blocklist: ['/health']
  })
}
