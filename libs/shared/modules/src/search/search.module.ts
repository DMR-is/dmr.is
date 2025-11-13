// opensearch.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { SearchService } from './search.service'

import { Client } from '@opensearch-project/opensearch'

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    {
      provide: Client,
      useFactory: (cfg: ConfigService) => {
        return new Client({
          node:
            cfg.get<string>('OPENSEARCH_CLUSTER_ENDPOINT') ??
            process.env.OPENSEARCH_CLUSTER_ENDPOINT,
          ssl: { rejectUnauthorized: false },
          maxRetries: 5,
          requestTimeout: 120_000,
          compression: 'gzip',
          agent: { keepAlive: true, maxSockets: 25, keepAliveMsecs: 15000 },
        })
      },
      inject: [ConfigService],
    },
    SearchService,
  ],
  exports: [Client, SearchService],
})
export class OpenSearchModule {}
