import { VError } from 'errors';
import { FormikErrors } from 'formik';

import { FormValues } from '../proposalSchema';

const checkImportErrors = (errors: FormikErrors<FormValues>) => {
  const keys = Object.values(errors);
  if (keys.length > 0) {
    throw new VError({
      type: 'proposal',
      code: 'validationError',
      data: {
        info: JSON.stringify(errors),
      },
    });
  }
};

export default checkImportErrors;
