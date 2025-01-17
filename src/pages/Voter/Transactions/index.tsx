/** @jsxImportSource @emotion/react */
import { Paper, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { ButtonWrapper, Icon, Link, Spinner, Table, TableColumn } from 'components';
import { useGetToken } from 'packages/tokens';
import React, { useMemo } from 'react';
import { useTranslation } from 'translation';
import { VoteDetailTransaction } from 'types';
import { convertWeiToTokens, generateBscScanUrl } from 'utilities';

import PLACEHOLDER_KEY from 'constants/placeholderKey';
import { useAuth } from 'context/AuthContext';

import { useStyles } from './styles';

interface TransactionsProps {
  address: string;
  voterTransactions: VoteDetailTransaction[] | undefined;
  className?: string;
}

export const Transactions: React.FC<TransactionsProps> = ({
  className,
  address,
  voterTransactions = [],
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { chainId } = useAuth();
  const xvs = useGetToken({
    symbol: 'XVS',
  });

  const columns: TableColumn<VoteDetailTransaction>[] = useMemo(
    () => [
      {
        key: 'action',
        label: t('voterDetail.actions'),
        selectOptionLabel: t('voterDetail.actions'),
        renderCell: transaction => {
          if (transaction.type === 'transfer') {
            return transaction.to.toLowerCase() === address.toLowerCase() ? (
              <Typography css={styles.row} variant="small2" color="textPrimary">
                <Icon name="arrowShaft" css={styles.received} />
                {t('voterDetail.receivedXvs')}
              </Typography>
            ) : (
              <Typography css={styles.row} variant="small2" color="textPrimary">
                <Icon name="arrowShaft" css={styles.sent} />
                {t('voterDetail.sentXvs')}
              </Typography>
            );
          }

          if (transaction.type === 'vote') {
            switch (transaction.support) {
              case 'AGAINST':
                return (
                  <div css={styles.row}>
                    <div css={[styles.icon, styles.against]}>
                      <Icon name="closeRounded" />
                    </div>
                    {t('voterDetail.votedAgainst')}
                  </div>
                );
              case 'FOR':
                return (
                  <div css={styles.row}>
                    <div css={[styles.icon, styles.for]}>
                      <Icon name="mark" />
                    </div>
                    {t('voterDetail.votedFor')}
                  </div>
                );
              case 'ABSTAIN':
                return (
                  <div css={styles.row}>
                    <div css={[styles.icon, styles.abstain]}>
                      <Icon name="dots" />
                    </div>
                    {t('voterDetail.votedAbstain')}
                  </div>
                );
              default:
                return <></>;
            }
          }

          return <></>;
        },
      },
      {
        key: 'sent',
        label: t('voterDetail.sent'),
        selectOptionLabel: t('voterDetail.sent'),
        renderCell: transaction =>
          t('voterDetail.readableSent', { date: transaction.blockTimestamp }),
      },
      {
        key: 'amount',
        label: t('voterDetail.amount'),
        selectOptionLabel: t('voterDetail.amount'),
        align: 'right',
        renderCell: transaction => {
          let valueWei: BigNumber | undefined;

          if (transaction.type === 'transfer') {
            valueWei = transaction.amountWei;
          } else if (transaction.type === 'vote') {
            valueWei = transaction.votesWei;
          }

          return valueWei
            ? convertWeiToTokens({
                valueWei,
                token: xvs,

                returnInReadableFormat: true,
              })
            : PLACEHOLDER_KEY;
        },
      },
    ],
    [],
  );

  return (
    <Paper css={styles.root} className={className}>
      <Typography css={styles.horizontalPadding} variant="h4">
        {t('voterDetail.transactions')}
      </Typography>

      {voterTransactions && voterTransactions.length ? (
        <Table
          columns={columns}
          data={voterTransactions}
          rowKeyExtractor={row => `voter-transaction-table-row-${row.transactionHash}`}
          breakpoint="sm"
          css={styles.cardContentGrid}
        />
      ) : (
        <Spinner css={styles.spinner} />
      )}

      <ButtonWrapper
        variant="secondary"
        className="mt-4 text-offWhite hover:no-underline sm:mx-6 sm:mt-0"
        asChild
      >
        <Link
          href={
            chainId &&
            generateBscScanUrl({
              hash: address,
              urlType: 'address',
              chainId,
            })
          }
        >
          {t('voterDetail.viewAll')}
        </Link>
      </ButtonWrapper>
    </Paper>
  );
};

export default Transactions;
