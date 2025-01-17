import { Icon, Link } from 'components';
import { useState } from 'react';
import { useTranslation } from 'translation';
import { cn } from 'utilities';

import venusLogoSrc from 'assets/img/venusLogo.svg';
import venusLogoWithTextSrc from 'assets/img/venusLogoWithText.svg';
import { PAGE_CONTAINER_ID } from 'constants/layout';
import { routes } from 'constants/routing';

import ClaimRewardButton from '../ClaimRewardButton';
import ConnectButton from '../ConnectButton';
import useGetMenuItems from '../useGetMenuItems';
import { NavLink } from './NavLink';

export const Menu: React.FC = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpened, setIsMobileMenuOpened] = useState<boolean>(false);

  const toggleMobileMenu = () => {
    // Toggle scroll on page container and body tags
    const pageContainerDom = document.getElementById(PAGE_CONTAINER_ID);
    pageContainerDom?.classList.toggle('overflow-hidden');
    document.body.classList.toggle('overflow-hidden');

    setIsMobileMenuOpened(currentIsMobileMenuOpened => !currentIsMobileMenuOpened);
  };

  const menuItems = useGetMenuItems();

  return (
    <>
      {/* SM menu */}
      <div className="md:hidden">
        <header className="flex h-14 items-center pr-4 md:h-auto">
          <Link className="flex h-full items-center justify-center pl-4" to={routes.dashboard.path}>
            <img src={venusLogoSrc} alt={t('layout.menu.venusLogoAlt')} className="mr-8 h-7" />
          </Link>

          <div className="flex flex-1 items-center justify-center">
            <ConnectButton className="h-9 max-w-xs flex-1" />
          </div>

          <button
            onClick={toggleMobileMenu}
            type="button"
            className="ml-8 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-cards p-0 hover:bg-lightGrey active:bg-lightGrey"
          >
            <Icon
              name={isMobileMenuOpened ? 'closeRounded' : 'burger'}
              className={cn('h-auto text-offWhite', isMobileMenuOpened ? 'w-[14px]' : 'w-[18px]')}
            />
          </button>
        </header>

        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 top-14 z-50 overflow-y-auto bg-background pb-8 pt-4',
            isMobileMenuOpened ? 'block' : 'hidden',
          )}
        >
          <div className="mb-6">
            {menuItems.map(menuItem => (
              <NavLink onClick={toggleMobileMenu} key={menuItem.i18nKey} {...menuItem} />
            ))}
          </div>

          <div className="px-4">
            <ClaimRewardButton className="w-full" />
          </div>
        </div>
      </div>

      {/* MD and up menu */}
      <div className="hidden bg-cards pt-7 md:flex md:flex-col md:items-center xl:w-56">
        <Link
          className="mb-4 flex w-full items-center justify-center py-2"
          to={routes.dashboard.path}
        >
          <img src={venusLogoSrc} alt={t('layout.menu.venusLogoAlt')} className="h-9 xl:hidden" />

          <img
            src={venusLogoWithTextSrc}
            alt={t('layout.menu.venusLogoAlt')}
            className="hidden h-9 xl:block"
          />
        </Link>

        <div className="flex-1 overflow-auto px-3 py-6 xl:w-full xl:px-0">
          {menuItems.map(menuItem => (
            <NavLink onClick={toggleMobileMenu} key={menuItem.i18nKey} {...menuItem} />
          ))}
        </div>
      </div>
    </>
  );
};
