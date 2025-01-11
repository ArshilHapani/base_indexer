# CI Status

[![Docker](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/scan-image.yml/badge.svg)](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/scan-image.yml)
[![Docker Image CI](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/docker-image.yml/badge.svg)](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/docker-image.yml)
[![Build and push Docker image to registry (CI)](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/push-image-to-registry.yml/badge.svg)](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/push-image-to-registry.yml)

# Used External API

- [Mobula](https://docs.mobula.io/introduction)
- [Alchemy (Base RPC Provider)](https://dashboard.alchemy.com/)
- [Chainbase (for finding token holders)](https://docs.chainbase.com/introduction/about)
- [Gecko terminal](https://api.geckoterminal.com/docs/index.html)

# BASE CHAIN ID

8453

# Available process tasks

The separate tasks are stored in `tasks` directory which needs to manage manually apart from the server

- cron/c_getTokens.ts
- workers/tokenConsumer.ts

# GraphQL Query to get top 10 pools by liquidity from uniswap subgraph

```graphql
{
  pools(
    orderBy: liquidity
    orderDirection: desc
    first: 10
    where: { createdAtTimestamp_gt: "1735521415" }
  ) {
    liquidity
    token0 {
      volume
      volumeUSD
      name
      id
      symbol
      totalSupply
      totalValueLocked
    }
    token1 {
      volume
      volumeUSD
      name
      id
      symbol
      totalSupply
      totalValueLocked
    }
    createdAtTimestamp
  }
}
```
