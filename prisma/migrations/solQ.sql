CREATE TABLE pairs (
   id SERIAL PRIMARY KEY,
   pair_address VARCHAR(44) NOT NULL UNIQUE,
   dex_name VARCHAR(50) NOT NULL,
   pair_creation_tx_hash VARCHAR(88) NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   token0_mint VARCHAR(44) NOT NULL,
   token1_mint VARCHAR(44) NOT NULL
);

-- Create pair metrics table
CREATE TABLE pair_metrics (
   pair_id INTEGER REFERENCES pairs(id),
   price_usd NUMERIC(78,0) NOT NULL,
   price_native NUMERIC(28,18) NOT NULL,
   liquidity_usd NUMERIC(28,18) NOT NULL,
   volume_24h NUMERIC(28,18) NOT NULL,
   txn_count_24h INTEGER NOT NULL,
   token0_pooled NUMERIC(78,0) NOT NULL,
   token1_pooled NUMERIC(78,0) NOT NULL,
   fdv_ratio NUMERIC(28,18) NOT NULL,
   updated_at TIMESTAMPTZ NOT NULL,
   PRIMARY KEY (pair_id)
);

-- Create price trends table 
CREATE TABLE price_trends (
   pair_id INTEGER REFERENCES pairs(id),
   price_change_5m NUMERIC(28,18) NOT NULL,
   price_change_1h NUMERIC(28,18) NOT NULL,
   price_change_6h NUMERIC(28,18) NOT NULL,
   price_change_24h NUMERIC(28,18) NOT NULL,
   price_change_7d NUMERIC(28,18) NOT NULL,
   timestamp TIMESTAMPTZ NOT NULL,
   PRIMARY KEY (pair_id)
);

CREATE TABLE tokens (
   id SERIAL PRIMARY KEY,
   address VARCHAR(44) UNIQUE NOT NULL ,
   chain_id INTEGER NOT NULL,
   name VARCHAR(100) NOT NULL,
   symbol VARCHAR(20) NOT NULL,
   decimals INTEGER NOT NULL,
   -- Updated numeric fields to handle 256-bit numbers
   total_supply NUMERIC(78,0) NOT NULL,
   max_supply NUMERIC(78,0),
   circulating_supply NUMERIC(78,0),
   market_cap NUMERIC(78,0),
   fully_diluted_valuation NUMERIC(78,0),
   is_honeypot BOOLEAN NOT NULL DEFAULT FALSE,
   holders_count INTEGER,
   is_mintable BOOLEAN NOT NULL DEFAULT FALSE,
   is_proxy BOOLEAN NOT NULL DEFAULT FALSE,
   owner_address VARCHAR(44),
   contract_verified BOOLEAN NOT NULL DEFAULT FALSE,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE(address, chain_id)
);