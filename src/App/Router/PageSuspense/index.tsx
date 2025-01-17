import { Spinner } from 'components';
import React, { Suspense } from 'react';

export interface PageSuspenseProps {
  children: React.ReactNode;
}

const PageSuspense: React.FC<PageSuspenseProps> = ({ children }) => (
  <Suspense fallback={<Spinner />}>{children}</Suspense>
);

export default PageSuspense;
