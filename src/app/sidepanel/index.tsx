import React from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/styles/global.css';
import '@/core/i18n';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import SidePanel from '@/app/sidepanel/SidePanel';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ThemeProvider>
      <SidePanel />
    </ThemeProvider>,
  );
}
