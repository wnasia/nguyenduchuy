import { useEffect } from 'react';
import { useI18n } from './useI18n';

export const usePageTitle = (titleKey: string) => {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t(titleKey);
  }, [t, titleKey]);
};