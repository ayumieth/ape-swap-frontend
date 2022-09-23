import { useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import { useDispatch } from 'react-redux'
import { fetchChainIdFromUrl, fetchUserNetwork } from 'state/network'
import { TorusConnector } from '@web3-react/torus-connector'
import { CHAIN_PARAMS } from 'config/constants/chains'
import { hexStripZeros } from '@autonomylabs/limit-stop-orders/node_modules/@ethersproject/bytes'
import { BigNumber } from 'ethers'
import { useToast } from 'state/hooks'
import { useTranslation } from 'contexts/Localization'
import { replaceSwapState, SwapDelay } from 'state/swap/actions'
import { RouterTypes } from 'config/constants'
import { SmartRouter } from '@apeswapfinance/sdk'

const useSwitchNetwork = () => {
  const { chainId, account, library, connector } = useWeb3React()
  const provider = library?.provider
  const dispatch = useDispatch()
  const { toastError } = useToast()
  const { t } = useTranslation()

  const switchNetwork = useCallback(
    async (userChainId: number) => {
      if (connector instanceof TorusConnector) {
        toastError(t('Chain Select Error: Torus Wallet is only available on BNB Chain.'))
        return
      }
      if (account && userChainId !== chainId) {
        const formattedChainId = hexStripZeros(BigNumber.from(userChainId).toHexString())
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: formattedChainId }],
          })
          dispatch(fetchChainIdFromUrl(false))
          dispatch(
            replaceSwapState({
              typedValue: null,
              field: null,
              inputCurrencyId: null,
              outputCurrencyId: null,
              recipient: null,
              swapDelay: SwapDelay.INIT,
              bestRoute: { routerType: RouterTypes.APE, smartRouter: SmartRouter.APE },
            }),
          )
        } catch {
          // If the user doesn't have the chain add it
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [CHAIN_PARAMS[userChainId]],
          })
          dispatch(fetchChainIdFromUrl(false))
          try {
            // Prompt the user to switch after adding the chain
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: formattedChainId }],
            })
            dispatch(fetchChainIdFromUrl(false))
          } catch (error) {
            console.warn(error)
          }
        }
      } else {
        dispatch(fetchUserNetwork(chainId, account, userChainId))
      }
      // TODO: Better implementation. This is a hotfix to reset the swap state on network change to not send previous addresses to the wrong multicall state
      dispatch(
        replaceSwapState({
          typedValue: null,
          field: null,
          inputCurrencyId: null,
          outputCurrencyId: null,
          recipient: null,
          swapDelay: SwapDelay.INIT,
          bestRoute: { routerType: RouterTypes.APE, smartRouter: SmartRouter.APE },
        }),
      )
    },
    [chainId, account, provider, dispatch, connector, t, toastError],
  )
  return { switchNetwork }
}

export default useSwitchNetwork
