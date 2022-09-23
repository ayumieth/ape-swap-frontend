import React from 'react'
import { Flex, Text, LinkExternal, Svg, useModal } from '@apeswapfinance/uikit'
import { TagVariants } from '@ape.swap/uikit'
import { Box } from 'theme-ui'
import ListView from 'components/ListView'
import { ExtendedListViewProps } from 'components/ListView/types'
import ListViewContent from 'components/ListViewContent'
import { DualFarm, Tag } from 'state/types'
import { getBalanceNumber } from 'utils/formatBalance'
import BigNumber from 'bignumber.js'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useTranslation } from 'contexts/Localization'
import CalcButton from 'components/RoiCalculator/CalcButton'
import CardActions from './CardActions'
import { Container, FarmButton, NextArrow, ServiceTokenDisplayContainer, StyledTag } from './styles'
import HarvestAction from './CardActions/HarvestAction'
import { ActionContainer } from './CardActions/styles'
import useIsMobile from '../../../hooks/useIsMobile'
import ServiceTokenDisplay from '../../../components/ServiceTokenDisplay'
import { LiquidityModal } from 'components/LiquidityWidget'
import { Field, selectCurrency } from 'state/swap/actions'
import { useAppDispatch } from 'state'

const DisplayFarms: React.FC<{ farms: DualFarm[]; openPid?: number; dualFarmTags: Tag[] }> = ({
  farms,
  openPid,
  dualFarmTags,
}) => {
  const { chainId } = useActiveWeb3React()
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const dispatch = useAppDispatch()

  // TODO: clean up this code
  // Hack to get the close modal function from the provider
  // Need to export ModalContext from uikit to clean up the code
  const [, closeModal] = useModal(<></>)
  const [onPresentAddLiquidityWidgetModal] = useModal(
    <LiquidityModal handleClose={closeModal} />,
    true,
    true,
    'liquidityWidgetModal',
  )

  const showLiquidity = (token, quoteToken) => {
    dispatch(
      selectCurrency({
        field: Field.INPUT,
        currencyId: token,
      }),
    )
    dispatch(
      selectCurrency({
        field: Field.OUTPUT,
        currencyId: quoteToken,
      }),
    )
    onPresentAddLiquidityWidgetModal()
  }

  const farmsListView = farms.map((farm, i) => {
    const polygonScanUrl = `https://polygonscan.com/address/${farm.stakeTokenAddress}`
    const userAllowance = farm?.userData?.allowance
    const userEarningsMiniChef = getBalanceNumber(farm?.userData?.miniChefEarnings || new BigNumber(0)).toFixed(2)
    const userEarningsRewarder = getBalanceNumber(farm?.userData?.rewarderEarnings || new BigNumber(0)).toFixed(2)
    const userEarningsUsd = `$${(
      getBalanceNumber(farm?.userData?.miniChefEarnings || new BigNumber(0)) * farm?.rewardToken0Price +
      getBalanceNumber(farm?.userData?.rewarderEarnings || new BigNumber(0)) * farm?.rewardToken1Price
    ).toFixed(2)}`
    const userTokenBalance = `${getBalanceNumber(farm?.userData?.tokenBalance || new BigNumber(0))?.toFixed(6)} LP`

    const lpValueUsd = farm?.stakeTokenPrice

    const userTokenBalanceUsd = `$${(
      getBalanceNumber(farm?.userData?.tokenBalance || new BigNumber(0)) * lpValueUsd
    ).toFixed(2)}`

    const fTag = dualFarmTags?.find((tag) => tag.pid === farm.pid)
    const tagColor = fTag?.color as TagVariants

    // Changing tooltip placement conditionaly until zindex solution
    return {
      tag: (
        <>
          {fTag?.pid === farm.pid && (
            <Box sx={{ marginRight: '5px', mt: '1px' }}>
              <StyledTag key={fTag?.pid} variant={tagColor}>
                {fTag?.text}
              </StyledTag>
            </Box>
          )}
        </>
      ),
      tokens: {
        token1: farm.pid === 11 ? 'NFTY2' : farm?.stakeTokens?.token1?.symbol,
        token2: farm?.stakeTokens?.token0?.symbol,
        token3: farm?.rewardTokens?.token0?.symbol,
        token4: farm?.dualImage !== false ? (farm.pid === 11 ? 'NFTY2' : farm?.rewardTokens?.token1?.symbol) : null,
      },
      stakeLp: true,
      title: (
        <Text ml={fTag?.pid === farm?.pid ? 0 : 10} bold>
          {farm?.stakeTokens?.token1?.symbol}-{farm?.stakeTokens?.token0?.symbol}
        </Text>
      ),
      viewType: 'stakeLP',
      open: farm.pid === openPid,
      id: farm.pid,
      infoContent: (
        <>
          <Flex flexDirection="column">
            <Flex alignItems="space-between" justifyContent="space-between" style={{ width: '100%' }}>
              <Text style={{ fontSize: '12px' }}>Multiplier</Text>
              <Text bold style={{ fontSize: '12px' }}>
                {Math.round(parseFloat(farm.multiplier) * 1000) / 100}X
              </Text>
            </Flex>
            <Flex alignItems="space-between" justifyContent="space-between" style={{ width: '100%' }}>
              <Text style={{ fontSize: '12px' }}>Stake</Text>
              <Text bold style={{ fontSize: '12px' }}>
                {farm?.stakeTokens?.token1?.symbol}-{farm?.stakeTokens?.token0?.symbol} LP
              </Text>
            </Flex>
            <Flex alignItems="center" justifyContent="center" mt="15px">
              <LinkExternal href={polygonScanUrl} style={{ fontSize: '14px' }}>
                {t('View on PolygonScan')}
              </LinkExternal>
            </Flex>
          </Flex>
        </>
      ),
      ttWidth: '250px',
      infoContentPosition: 'translate(8%, 0%)',
      toolTipIconWidth: isMobile && '20px',
      toolTipStyle: isMobile && { marginTop: '5px', marginRight: '10px' },
      cardContent: (
        <>
          <ListViewContent
            title={t('APY')}
            value={parseFloat(farm?.apy) > 1000000 ? `>1,000,000%` : `${farm?.apy}%`}
            width={isMobile ? 90 : 150}
            ml={20}
            toolTip={t(
              'APY includes annualized BANANA rewards and rewards for providing liquidity (DEX swap fees), compounded daily.',
            )}
            toolTipPlacement="bottomLeft"
            toolTipTransform="translate(8%, 0%)"
          />
          <ListViewContent
            title={t('APR')}
            value={`${farm?.apr ? farm?.apr.toFixed(2) : 0}%`}
            value2={`${parseFloat(farm?.lpApr).toFixed(2)}%`}
            value2Icon={
              <span style={{ marginRight: '7px' }}>
                <Svg icon="swap" width={13} color="text" />
              </span>
            }
            valueIcon={
              <span style={{ marginRight: '5px' }}>
                <Svg icon="banana_token" width={15} color="text" />
              </span>
            }
            width={isMobile ? 100 : 180}
            toolTip={t(
              'BANANA reward APRs are calculated in real time. DEX swap fee APRs are calculated based on previous 24 hours of trading volume. Note: APRs are provided for your convenience. APRs are constantly changing and do not represent guaranteed returns.',
            )}
            toolTipPlacement={i === farms.length - 1 && i !== 0 ? 'topLeft' : 'bottomLeft'}
            toolTipTransform={i === farms.length - 1 && i !== 0 ? 'translate(-8%, 0%)' : 'translate(8%, 0%)'}
            aprCalculator={
              <CalcButton
                label={`${farm?.stakeTokens?.token1?.symbol}-${farm?.stakeTokens?.token0?.symbol}`}
                rewardTokenName="BANANA"
                rewardTokenPrice={farm.rewardToken0Price}
                apr={farm?.apr}
                lpApr={parseFloat(farm?.lpApr)}
                apy={parseFloat(farm?.apy)}
                lpAddress={farm.stakeTokenAddress}
                isLp
                tokenAddress={farm?.stakeTokens?.token1?.address[chainId]}
                quoteTokenAddress={
                  farm?.stakeTokens?.token0?.symbol === 'MATIC' ? 'ETH' : farm?.stakeTokens?.token0?.address[chainId]
                }
                lpPrice={farm.stakeTokenPrice}
              />
            }
          />
          <ListViewContent
            title={t('Liquidity')}
            value={`$${Number(farm?.totalStaked).toLocaleString(undefined)}`}
            width={isMobile ? 100 : 180}
            toolTip={t('The total value of the LP tokens currently staked in this farm.')}
            toolTipPlacement={isMobile ? 'bottomRight' : 'bottomLeft'}
            toolTipTransform={isMobile ? 'translate(13%, 0%)' : 'translate(23%, 0%)'}
          />
          <ListViewContent
            title={t('Earned')}
            value={`${userEarningsMiniChef}`}
            valueIcon={
              <ServiceTokenDisplayContainer>
                <ServiceTokenDisplay token1={farm?.rewardTokens.token0.symbol} size={15} />
              </ServiceTokenDisplayContainer>
            }
            value2={farm?.dualImage !== false ? `${userEarningsRewarder}` : ''}
            value2Icon={
              farm?.dualImage !== false ? (
                <ServiceTokenDisplayContainer>
                  <ServiceTokenDisplay
                    token1={farm.pid === 11 ? 'NFTY2' : farm?.rewardTokens.token1.symbol}
                    size={15}
                  />
                </ServiceTokenDisplayContainer>
              ) : null
            }
            width={isMobile ? 65 : 120}
          />
        </>
      ),
      expandedContent: (
        <>
          <ActionContainer>
            {isMobile && (
              <ListViewContent
                title={t('Available LP')}
                value={userTokenBalance}
                value2={userTokenBalanceUsd}
                value2Secondary
                width={100}
                height={50}
                lineHeight={15}
                ml={10}
              />
            )}
            <FarmButton
              onClick={() =>
                showLiquidity(
                  farm?.stakeTokens?.token1?.address[chainId],
                  farm?.stakeTokens?.token0?.symbol === 'MATIC' ? 'ETH' : farm?.stakeTokens?.token0?.address[chainId],
                )
              }
            >
              {t('GET LP')}
            </FarmButton>
            {!isMobile && (
              <ListViewContent
                title={t('Available LP')}
                value={userTokenBalance}
                value2={userTokenBalanceUsd}
                value2Secondary
                width={100}
                height={50}
                lineHeight={15}
                ml={10}
              />
            )}
          </ActionContainer>
          {!isMobile && <NextArrow />}
          <CardActions
            allowance={userAllowance?.toString()}
            stakedBalance={farm?.userData?.stakedBalance?.toString()}
            stakingTokenBalance={farm?.userData?.tokenBalance?.toString()}
            stakeLpAddress={farm?.stakeTokenAddress}
            lpValueUsd={lpValueUsd}
            pid={farm.pid}
          />
          {!isMobile && <NextArrow />}
          <HarvestAction pid={farm.pid} disabled={userEarningsMiniChef === '0.00'} userEarningsUsd={userEarningsUsd} />
        </>
      ),
    } as ExtendedListViewProps
  })

  return (
    <Container>
      <ListView listViews={farmsListView} />
    </Container>
  )
}

export default React.memo(DisplayFarms)
