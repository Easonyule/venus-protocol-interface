/** @jsxImportSource @emotion/react */
import Typography from '@mui/material/Typography';
import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import { formatCentsToReadableValue } from 'utilities';

import { Icon } from '../Icon';
import { useStyles } from './styles';

export interface ValueUpdateProps<T> {
  original: T;
  update: T;
  format?: (value: T) => string;
  className?: string;
  positiveDirection?: 'asc' | 'desc';
}

export function ValueUpdate<T>({
  className,
  original,
  update,
  format = (value: T) =>
    formatCentsToReadableValue({
      value: value instanceof BigNumber || typeof value === 'number' ? value : undefined,
    }),
  positiveDirection = 'asc',
}: React.PropsWithChildren<ValueUpdateProps<T>>) {
  let isImprovement = false;
  if (typeof original === 'number' && typeof update === 'number') {
    isImprovement = positiveDirection === 'asc' ? update >= original : update <= original;
  } else if (original instanceof BigNumber && update instanceof BigNumber) {
    isImprovement =
      positiveDirection === 'asc'
        ? update.isGreaterThanOrEqualTo(original)
        : update.isLessThanOrEqualTo(original);
  }

  const styles = useStyles({ isImprovement });

  const formattedValues = useMemo(
    () => ({
      original: format(original),
      updated: format(update),
    }),
    [original, update],
  );

  return (
    <div className={className} css={styles.container}>
      <Typography component="span" variant="body1">
        {formattedValues.original}
      </Typography>

      {update !== undefined && formattedValues.original !== formattedValues.updated && (
        <>
          <Icon name="arrowShaft" css={styles.icon} />
          <Typography component="span" variant="body1">
            {formattedValues.updated}
          </Typography>
        </>
      )}
    </div>
  );
}
