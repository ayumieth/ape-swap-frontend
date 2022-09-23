import { CurrencyAmount, Pair, Percent, TokenAmount } from '@apeswapfinance/sdk'

export interface RemoveLiquidityActionProps {
  pair: Pair
  parsedAmounts: {
    LIQUIDITY_PERCENT: Percent
    LIQUIDITY?: TokenAmount
    CURRENCY_A?: CurrencyAmount
    CURRENCY_B?: CurrencyAmount
  }
  error: string
  tradeValueUsd: number
}
