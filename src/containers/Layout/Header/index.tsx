import { Breadcrumbs } from '../Breadcrumbs';
import ClaimRewardButton from '../ClaimRewardButton';
import ConnectButton from '../ConnectButton';

export const Header: React.FC = () => (
  <div className="px-4 pb-4 pt-6 md:flex md:justify-between md:px-6 md:py-8 xl:px-10">
    <div className="flex flex-1 items-center">
      <Breadcrumbs />
    </div>

    <div className="hidden md:flex md:items-center md:pl-6">
      <ClaimRewardButton className="flex-none md:mr-4 md:whitespace-nowrap" />

      <ConnectButton className="flex-none" />
    </div>
  </div>
);
