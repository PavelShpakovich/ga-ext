import { WebLLMProvider } from '@/core/providers/WebLLMProvider';

export const useModelSelection = () => {
  const allModels = WebLLMProvider.getAvailableModels();

  const selectGroups = [
    {
      label: 'Available',
      options: allModels.map((m) => ({
        value: m.id,
        label: [m.name, m.size, m.speed].filter(Boolean).join(' • '),
      })),
    },
  ];

  const getModelInfo = (modelId: string) => {
    return allModels.find((m) => m.id === modelId);
  };

  return { allModels, selectGroups, getModelInfo };
};
