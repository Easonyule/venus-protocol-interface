import { Typography } from '@mui/material';
import { EllipseAddress, Icon, Link } from 'components';
import { useMemo } from 'react';
import { Params, matchPath, useLocation } from 'react-router-dom';
import { useTranslation } from 'translation';

import { Subdirectory, routes } from 'constants/routing';
import { useAuth } from 'context/AuthContext';
import useCopyToClipboard from 'hooks/useCopyToClipboard';

import PoolName from './PoolName';
import VTokenSymbol from './VTokenSymbol';

export interface PathNode {
  dom: React.ReactNode;
  href: string;
}

export const Breadcrumbs: React.FC = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { accountAddress } = useAuth();
  const copyToClipboard = useCopyToClipboard(t('interactive.copy.walletAddress'));

  const pathNodes = useMemo(() => {
    // Get active route
    let params: Params<string> = {};
    const activeRouteKey = Object.keys(routes).find(key => {
      const routeMatch = matchPath(routes[key as keyof typeof routes].path, pathname);

      if (routeMatch) {
        const { params: routeParams } = routeMatch;
        params = routeParams;
      }

      return !!routeMatch;
    });

    if (!activeRouteKey) {
      return [];
    }

    const activeRoute = routes[activeRouteKey as keyof typeof routes];
    let href = '';

    // Generate path nodes
    return activeRoute.subdirectories.reduce<PathNode[]>((acc, subdirectory) => {
      let dom: React.ReactNode;
      let hrefFragment: string = subdirectory;

      switch (subdirectory) {
        case Subdirectory.DASHBOARD:
          dom = t('breadcrumbs.dashboard');
          break;
        case Subdirectory.ACCOUNT:
          dom = t('breadcrumbs.account');
          break;
        case Subdirectory.MARKETS:
          hrefFragment = Subdirectory.MARKETS.replace(
            ':poolComptrollerAddress',
            params.poolComptrollerAddress || '',
          );

          dom = t('breadcrumbs.markets');
          break;
        case Subdirectory.ISOLATED_POOLS:
          dom = t('breadcrumbs.isolatedPools');
          break;
        case Subdirectory.ISOLATED_POOL:
          hrefFragment = Subdirectory.ISOLATED_POOL.replace(
            ':poolComptrollerAddress',
            params.poolComptrollerAddress || '',
          );

          dom = <PoolName poolComptrollerAddress={params.poolComptrollerAddress || ''} />;
          break;
        case Subdirectory.CORE_POOL:
          dom = t('breadcrumbs.corePool');
          break;
        case Subdirectory.MARKET: {
          hrefFragment = Subdirectory.MARKET.replace(':vTokenAddress', params.vTokenAddress || '');

          dom = <VTokenSymbol vTokenAddress={params.vTokenAddress} />;
          break;
        }
        case Subdirectory.GOVERNANCE:
          dom = t('breadcrumbs.governance');
          break;
        case Subdirectory.PROPOSAL:
          dom = t('breadcrumbs.proposal', { proposalId: params.proposalId });
          break;
        case Subdirectory.LEADER_BOARD:
          dom = t('breadcrumbs.leaderboard');
          break;
        case Subdirectory.VOTER:
          hrefFragment = Subdirectory.VOTER.replace(':address', params.address || '');

          dom = (
            <div className="inline-flex items-center">
              <Typography variant="h3" color="textPrimary">
                <EllipseAddress address={params.address || ''} ellipseBreakpoint="xxl" />
              </Typography>

              <button
                type="button"
                className="ml-3 cursor-pointer text-blue transition-colors hover:text-darkBlue active:text-darkBlue"
              >
                <Icon
                  name="copy"
                  className="h-6 w-6 text-inherit"
                  onClick={() => params.address && copyToClipboard(params.address)}
                />
              </button>
            </div>
          );
          break;
        case Subdirectory.VAULTS:
          dom = t('breadcrumbs.vaults');
          break;
        case Subdirectory.HISTORY:
          dom = t('breadcrumbs.history');
          break;
        case Subdirectory.XVS:
          dom = t('breadcrumbs.xvs');
          break;
        case Subdirectory.CONVERT_VRT:
          dom = t('breadcrumbs.convertVrt');
          break;
        case Subdirectory.SWAP:
          dom = t('breadcrumbs.swap');
          break;
        case Subdirectory.VAI:
          dom = t('breadcrumbs.vai');
          break;
        default:
          break;
      }

      href += hrefFragment;

      return dom
        ? [
            ...acc,
            {
              href,
              dom,
            },
          ]
        : acc;
    }, []);
  }, [pathname, t, !!accountAddress]);

  const pathNodeDom = useMemo(
    () =>
      pathNodes.map((pathNode, index) => (
        <span
          key={`layout-header-breadcrumb-${pathNode.href}`}
          className="inline-flex items-center"
        >
          {pathNodes.length > 0 && index < pathNodes.length - 1 ? (
            <>
              <Link
                className="text-grey transition-colors hover:text-offWhite hover:no-underline"
                to={pathNode.href}
              >
                {pathNode.dom}
              </Link>

              <span className="mx-3 text-grey">/</span>
            </>
          ) : (
            pathNode.dom
          )}
        </span>
      )),
    [pathNodes],
  );

  return <p className="flex flex-wrap items-center text-xl">{pathNodeDom}</p>;
};
