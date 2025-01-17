/** @jsxImportSource @emotion/react */
import React from 'react';
import { useTranslation } from 'translation';
import { ChainId, Token } from 'types';
import { areAddressesEqual } from 'utilities';

import { Link } from '../Link';
import { NoticeInfo, NoticeWarning } from '../Notice';

export interface TokenAnnouncementProps {
  token: Token;
  chainId: ChainId;
  className?: string;
}

export const TokenAnnouncement: React.FC<TokenAnnouncementProps> = ({
  token,
  chainId,
  className,
}) => {
  const { Trans, t } = useTranslation();

  // TUSD migration
  if (
    chainId === ChainId.BSC_MAINNET &&
    areAddressesEqual(token.address, '0x14016e85a25aeb13065688cafb43044c2ef86784')
  ) {
    return (
      <NoticeInfo
        css={className}
        description={
          <Trans
            i18nKey="announcements.tusdMigration.description"
            components={{
              Link: (
                <Link href="https://www.binance.com/en/support/announcement/binance-will-support-the-trueusd-tusd-contract-swap-52b29fadf71542afabf23acf3454f9c7" />
              ),
            }}
          />
        }
      />
    );
  }

  // TRX migration
  if (
    chainId === ChainId.BSC_MAINNET &&
    areAddressesEqual(token.address, '0x85EAC5Ac2F758618dFa09bDbe0cf174e7d574D5B')
  ) {
    return (
      <NoticeWarning
        css={className}
        description={
          <Trans
            i18nKey="announcements.trxMigration.description"
            components={{
              Link: (
                <Link href="https://www.binance.com/en/support/announcement/binance-will-support-the-tron-trx-contract-swap-494f53e94eb64adc8335b88f7e14006a" />
              ),
            }}
          />
        }
      />
    );
  }

  // SXP disabling
  if (
    chainId === ChainId.BSC_MAINNET &&
    areAddressesEqual(token.address, '0x47BEAd2563dCBf3bF2c9407fEa4dC236fAbA485A')
  ) {
    return (
      <NoticeWarning css={className} description={t('announcements.sxpDisabling.description')} />
    );
  }

  // BETH update
  if (
    chainId === ChainId.BSC_MAINNET &&
    areAddressesEqual(token.address, '0x250632378E573c6Be1AC2f97Fcdf00515d0Aa91B')
  ) {
    return (
      <NoticeWarning
        css={className}
        description={
          <Trans
            i18nKey="announcements.bethUpdate.description"
            components={{
              Link: (
                <Link href="https://www.binance.com/en/support/announcement/binance-supports-beth-to-wbeth-conversion-on-bnb-smart-chain-a7d439452e034c3c85fcc7128d0973b0" />
              ),
            }}
          />
        }
      />
    );
  }

  return null;
};
