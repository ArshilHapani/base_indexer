# Used External API

- [Mobula](https://docs.mobula.io/introduction)
- [Alchemy (Base RPC Provider)](https://dashboard.alchemy.com/)
- [Chainbase (for finding token holders)](https://docs.chainbase.com/introduction/about)

# BASE CHAIN ID

8453

# GraphQL Query to get top 10 pools by liquidity

```graphql
{
  pools(
    orderBy: liquidity
    orderDirection: desc
    first: 10
    where: {createdAtTimestamp_gt: "1735521415"}
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
