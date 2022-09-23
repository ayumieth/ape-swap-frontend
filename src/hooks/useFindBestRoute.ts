import { SmartRouter } from '@apeswapfinance/sdk'
import { RouterTypes } from 'config/constants'
import { SwapDelay, Field } from 'state/swap/actions'
import { tryParseAmount, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import callWallchainAPI from 'utils/wallchainService'
import { useCurrency } from './Tokens'
import { useTradeExactIn, useTradeExactOut } from './Trades'
import useActiveWeb3React from './useActiveWeb3React'
import { useSwapCallArguments } from './useSwapCallback'

const useFindBestRoute = () => {
  const { onSetSwapDelay, onBestRoute } = useSwapActionHandlers()
  const {
    recipient,
    swapDelay,
    independentField,
    typedValue,
    bestRoute,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = useSwapState()
  const [allowedSlippage] = useUserSlippageTolerance()
  const { chainId, account } = useActiveWeb3React()
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)
  const bestTradeExactIn = useTradeExactIn(
    isExactIn ? parsedAmount : undefined,
    outputCurrency ?? undefined,
    swapDelay,
    onSetSwapDelay,
  )
  const bestTradeExactOut = useTradeExactOut(
    inputCurrency ?? undefined,
    !isExactIn ? parsedAmount : undefined,
    swapDelay,
    onSetSwapDelay,
  )
  const v2Trade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  // Get the current router the trade will be going through
  const currentSmartRouter: SmartRouter = v2Trade?.route?.pairs?.[0]?.router || bestRoute.smartRouter
  // Get the current router type based on the router
  const currentRouterType: RouterTypes =
    (currentSmartRouter !== SmartRouter.APE ? RouterTypes.SMART : RouterTypes.APE) || bestRoute.routerType

  // This is to get the correct swap arguments for a bonus trade
  const swapCalls = useSwapCallArguments(
    v2Trade,
    allowedSlippage,
    recipient,
    { routerType: currentRouterType, smartRouter: currentSmartRouter },
    false,
  )

  // To not cause a call on every user input the code will be executed when the delay is complete
  if (swapDelay !== SwapDelay.SWAP_COMPLETE) {
    return { v2Trade, bestTradeExactIn, bestTradeExactOut }
  }
  if (swapCalls[0]) {
    const {
      contract,
      parameters: { methodName, args, value },
    } = swapCalls[0]
    callWallchainAPI(
      methodName,
      args,
      value,
      chainId,
      account,
      contract,
      currentSmartRouter,
      currentRouterType,
      onBestRoute,
      onSetSwapDelay,
    )
  }
  return { v2Trade, bestTradeExactIn, bestTradeExactOut }
}

export default useFindBestRoute
