import { WebLLMProvider } from '../providers/WebLLMProvider';

export const useModelSelection = () => {
  const allModels = WebLLMProvider.getAvailableModels();
  const groupedModels = WebLLMProvider.getGroupedModels();

  const recommendedModels = allModels.filter((m) => m.description.toLowerCase().includes('recommended')).slice(0, 3);

  const selectGroups = [
    {
      label: 'Recommended',
      options: recommendedModels.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.size}) - ${m.speed}`,
      })),
    },
    ...Object.keys(groupedModels).map((family) => ({
      label: family,
      options: groupedModels[family].map((m) => ({
        value: m.id,
        label: `${m.name} (${m.size}) - ${m.speed}`,
      })),
    })),
  ];

  const getModelInfo = (modelId: string) => {
    return allModels.find((m) => m.id === modelId);
  };

  return { allModels, selectGroups, getModelInfo };
};
