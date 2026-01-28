import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { ModelOption, ModelCategory, ModelSpeed } from '@/shared/types';
import { useTranslation } from 'react-i18next';

export const useModelSelection = (): {
  allModels: ModelOption[];
  selectGroups: { label: string; options: { value: string; label: string }[] }[];
  getModelInfo: (modelId: string) => ModelOption | undefined;
} => {
  const { t } = useTranslation();
  const allModels = WebLLMProvider.getAvailableModels();

  const getCategoryLabel = (category?: ModelCategory) => {
    switch (category) {
      case ModelCategory.PRO:
        return t('models.category.pro');
      case ModelCategory.STANDARD:
        return t('models.category.standard');
      case ModelCategory.REASONING:
        return t('models.category.reasoning');
      default:
        return t('models.category.available');
    }
  };

  const categories = Object.values(ModelCategory);

  const selectGroups = categories
    .map((cat) => {
      const modelsInCategory = allModels.filter((m) => m.category === cat);
      if (modelsInCategory.length === 0) return null;

      return {
        label: getCategoryLabel(cat),
        options: modelsInCategory.map((m) => ({
          value: m.id,
          label: [m.name, m.size, m.speed === ModelSpeed.FAST ? '⚡️' : ''].filter(Boolean).join(' • '),
        })),
      };
    })
    .filter((group): group is { label: string; options: { value: string; label: string }[] } => group !== null);

  const getModelInfo = (modelId: string) => {
    return allModels.find((m) => m.id === modelId);
  };

  return { allModels, selectGroups, getModelInfo };
};
