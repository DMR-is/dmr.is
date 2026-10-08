# shared-dmr-ui

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test shared-dmr-ui` to execute the unit tests via [Jest](https://jestjs.io).

## Dependencies nothing here imports

`react-pdf` is in `package.json` although no file in this library imports it.
island-ui core's `PdfViewer` does, and every web app compiles it through the
`@island.is/island-ui/core` barrel. Drop it and every web build fails to resolve
`react-pdf`. Keep it at the version island.is pins.
