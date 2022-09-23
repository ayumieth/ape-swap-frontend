import { SmartRouter } from '@apeswapfinance/sdk'
import { RouterTypes } from 'config/constants'
import { createStore, Store } from 'redux'
import { Field, selectCurrency, SwapDelay } from './actions'
import reducer, { SwapState } from './reducer'

describe('swap reducer', () => {
  let store: Store<SwapState>

  beforeEach(() => {
    store = createStore(reducer, {
      [Field.OUTPUT]: { currencyId: '' },
      [Field.INPUT]: { currencyId: '' },
      typedValue: '',
      independentField: Field.INPUT,
      swapDelay: SwapDelay.INIT,
      bestRoute: {
        routerType: RouterTypes.APE,
        smartRouter: SmartRouter.APE,
      },
      recipient: null,
    })
  })

  describe('selectToken', () => {
    it('changes token', () => {
      store.dispatch(
        selectCurrency({
          field: Field.OUTPUT,
          currencyId: '0x0000',
        }),
      )

      expect(store.getState()).toEqual({
        [Field.OUTPUT]: { currencyId: '0x0000' },
        [Field.INPUT]: { currencyId: '' },
        typedValue: '',
        independentField: Field.INPUT,
        swapDelay: SwapDelay.INIT,
        bestRoute: {
          routerType: RouterTypes.APE,
          smartRouter: SmartRouter.APE,
        },
        recipient: null,
      })
    })
  })
})
