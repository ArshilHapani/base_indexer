# CI Status

[![Docker](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/scan-image.yml/badge.svg)](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/scan-image.yml)
[![Docker Image CI](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/docker-image.yml/badge.svg)](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/docker-image.yml)
[![Build and push Docker image to registry (CI)](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/push-image-to-registry.yml/badge.svg)](https://github.com/ArshilHapani/stellus_defi_backend/actions/workflows/push-image-to-registry.yml)

# Used External API

- [Mobula](https://docs.mobula.io/introduction)
- [Alchemy (Base RPC Provider)](https://dashboard.alchemy.com/)
- [Chainbase (for finding token holders)](https://docs.chainbase.com/introduction/about)

# BASE CHAIN ID

8453

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
