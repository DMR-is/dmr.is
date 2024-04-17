import { exec } from 'child_process'
import * as fs from 'fs'

import { NestApplication } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Test } from '@nestjs/testing'

import { AppModule } from './app.module'

const TMP_DIR = 'tmp/swagger'

const genereteFromSchema = () => {
  return new Promise((resolve, reject) => {
    exec(
      `yarn openapi-generator -o ${TMP_DIR}/gen/fetch -i ${TMP_DIR}/swagger.json`,
      (err, stdout) => {
        if (err) {
          reject(err)
        }
        resolve(stdout)
      },
    )
  })
}

describe('Swagger documentation', () => {
  let app: NestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
  })

  afterAll(async () => {
    await app.close()

    // Clean up
    fs.rmSync(TMP_DIR, { recursive: true, force: true })
  })

  it('should generate swagger spec', async () => {
    if (!process.env.TEST_CODEGEN) {
      console.log('Skipping codegen tests')
      return
    }

    const config = new DocumentBuilder()
      .setTitle('Official Journal API')
      .setVersion('1.0')
      .build()

    const document = SwaggerModule.createDocument(app, config)

    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true })
    }
    fs.writeFileSync(`${TMP_DIR}/swagger.json`, JSON.stringify(document))

    // run the openapi generator
    await genereteFromSchema()

    expect(fs.existsSync(`${TMP_DIR}/swagger.json`)).toBeTruthy()
  })
})
