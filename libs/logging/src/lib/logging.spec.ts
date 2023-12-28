describe('logging', () => {
  const ENV = process.env

  afterEach(() => {
    jest.resetModules()
    process.env = { ...ENV }
  })

  it('should have tests', async () => {
    expect(true).toBeTruthy()
  })
})
