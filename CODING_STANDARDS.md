# Senior Developer Coding Standards Applied

## React Best Practices

### ✅ Functional Components Only

All components use modern functional components with hooks, no class components.

```tsx
// ✅ Good
const MyComponent: React.FC<Props> = ({ prop }) => { ... }

// ❌ Avoid
class MyComponent extends React.Component { ... }
```

### ✅ TypeScript Strict Mode

Every component has explicit types for props, no implicit `any`.

```tsx
// ✅ Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

// ❌ Avoid
const Button = (props: any) => { ... }
```

### ✅ Custom Hooks for Logic

Business logic extracted to custom hooks, components are presentational.

```tsx
// ✅ Good
const useModelSelection = () => {
  // Complex logic here
  return { allModels, selectGroups, getModelInfo };
}

// Component uses hook
const ModelSelector = () => {
  const { allModels } = useModelSelection();
  return <Select options={allModels} />;
}

// ❌ Avoid
const ModelSelector = () => {
  // Complex logic inline
  const allModels = prebuiltAppConfig.model_list.filter(...).map(...)
  return <Select options={allModels} />;
}
```

### ✅ useCallback for Handlers

All event handlers wrapped in `useCallback` to prevent unnecessary re-renders.

```tsx
// ✅ Good
const handleChange = useCallback(
  (value: string) => {
    updateSettings({ selectedModel: value });
  },
  [updateSettings],
);

// ❌ Avoid
const handleChange = (value: string) => {
  updateSettings({ selectedModel: value });
};
```

### ✅ Cleanup Effects

All `useEffect` with listeners return cleanup functions.

```tsx
// ✅ Good
useEffect(() => {
  const handler = (msg) => { ... };
  chrome.runtime.onMessage.addListener(handler);
  return () => chrome.runtime.onMessage.removeListener(handler);
}, []);

// ❌ Avoid
useEffect(() => {
  chrome.runtime.onMessage.addListener((msg) => { ... });
  // Missing cleanup!
}, []);
```

---

## Component Design Patterns

### ✅ Single Responsibility Principle

Each component does ONE thing well.

```tsx
// ✅ Good - Single responsibility
const DownloadStatus = ({ progress, onStop }) => (
  // Only shows download progress
)

const ProcessingStatus = () => (
  // Only shows processing state
)

// ❌ Avoid - Multiple responsibilities
const LoadingState = ({ isDownloading, progress }) => (
  // Shows download OR processing (mixed concerns)
)
```

### ✅ Composition Over Configuration

Build complex UIs by composing simple components.

```tsx
// ✅ Good - Composition
<ModelSelector
  selectedModel={model}
  selectGroups={groups}
  modelInfo={info}
  modelsCount={count}
  onModelChange={onChange}
/>
// Internally: Select + Badge + ModelInfoCard

// ❌ Avoid - Configuration
<ModelSelector
  mode="full"
  showBadge={true}
  showInfo={true}
  showCount={true}
/>
```

### ✅ Prop Drilling Solution

Use custom hooks to avoid prop drilling.

```tsx
// ✅ Good
const Popup = () => {
  const { settings, updateSettings } = useSettings(); // Hook provides data
  return <ModelSelector onModelChange={updateSettings} />;
};

// ❌ Avoid
const Popup = ({ settings, updateSettings }) => {
  return <Parent settings={settings} updateSettings={updateSettings} />;
};
const Parent = (props) => <Child {...props} />;
const Child = (props) => <GrandChild {...props} />;
```

### ✅ Controlled Components

All form inputs are controlled with state.

```tsx
// ✅ Good
const [value, setValue] = useState('');
<input value={value} onChange={(e) => setValue(e.target.value)} />

// ❌ Avoid
<input defaultValue='initial' />
```

---

## TypeScript Standards

### ✅ Explicit Return Types for Hooks

Custom hooks specify return types.

```tsx
// ✅ Good
export const useSettings = (): {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
} => { ... }

// ❌ Avoid
export const useSettings = () => { ... }
```

### ✅ Interface Over Type for Props

Use `interface` for component props, `type` for unions.

```tsx
// ✅ Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

// ❌ Avoid mixing
type ButtonProps = {
  variant: string;
};
```

### ✅ Discriminated Unions

Use discriminated unions for state management.

```tsx
// ✅ Good
type LoadingState =
  | { status: 'idle' }
  | { status: 'downloading'; progress: number }
  | { status: 'processing' }
  | { status: 'complete'; result: string };

// ❌ Avoid
type LoadingState = {
  isIdle: boolean;
  isDownloading: boolean;
  progress?: number;
  result?: string;
};
```

---

## Styling Standards

### ✅ Tailwind CSS Only

No inline styles, CSS modules, or styled-components. Only Tailwind.

```tsx
// ✅ Good
<button className='px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg'>

// ❌ Avoid
<button style={{ padding: '8px 16px', background: 'blue' }}>
```

### ✅ Dark Mode Support

Every component supports dark mode with `dark:` variants.

```tsx
// ✅ Good
<div className='bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'>

// ❌ Avoid
<div className='bg-white text-gray-900'>
```

### ✅ Consistent Spacing

Use Tailwind spacing scale (gap-2, gap-3, gap-4, p-2, p-3, p-4).

```tsx
// ✅ Good
<div className='space-y-4'>  // Consistent 1rem spacing
<div className='gap-2'>      // Consistent 0.5rem gap

// ❌ Avoid
<div className='space-y-[17px]'>  // Arbitrary values
```

### ✅ Responsive Design

Use responsive utilities for different screen sizes.

```tsx
// ✅ Good
<div className='w-full md:w-96 lg:w-[32rem]'>

// ❌ Avoid
<div className='w-96'>  // Fixed width only
```

---

## Code Organization

### ✅ Barrel Exports

Use index.ts for clean imports.

```tsx
// components/ui/index.ts
export { Alert } from './Alert';
export { Badge } from './Badge';
export { Button } from './Button';

// Usage
import { Alert, Badge, Button } from '../components/ui';

// ❌ Avoid
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
```

### ✅ Folder Structure by Domain

Group related components together.

```
components/
├── ui/              # Atomic components
├── correction/      # Correction domain
├── settings/        # Settings domain
└── [shared].tsx     # Shared components
```

### ✅ Colocate Types

Define types near their usage, not in global types file.

```tsx
// ✅ Good - In component file
interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (id: string) => void;
}

// ❌ Avoid - In global types.ts unless truly shared
```

---

## Performance Optimizations

### ✅ React.memo for Pure Components

Wrap expensive pure components in `React.memo`.

```tsx
// ✅ Good
export const ExpensiveList = React.memo<Props>(({ items }) => {
  return items.map(item => <ExpensiveItem key={item.id} {...item} />);
});

// ❌ Avoid (for frequently re-rendering parent)
export const ExpensiveList = ({ items }) => { ... }
```

### ✅ useCallback for Callbacks

Prevent creating new function instances on each render.

```tsx
// ✅ Good
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);

// ❌ Avoid (creates new function every render)
const handleClick = () => doSomething(value);
```

### ✅ useMemo for Expensive Computations

Memoize expensive calculations.

```tsx
// ✅ Good
const sortedItems = useMemo(() => items.sort((a, b) => a.name.localeCompare(b.name)), [items]);

// ❌ Avoid (recalculates every render)
const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));
```

---

## Error Handling

### ✅ Try-Catch in Async Functions

Always handle errors in async operations.

```tsx
// ✅ Good
const loadData = async () => {
  try {
    const result = await fetchData();
    setData(result);
  } catch (error) {
    console.error('Failed to load:', error);
    setError(error.message);
  }
};

// ❌ Avoid
const loadData = async () => {
  const result = await fetchData(); // Uncaught errors!
  setData(result);
};
```

### ✅ User-Friendly Error Messages

Show actionable error messages to users.

```tsx
// ✅ Good
<Alert variant='error'>
  <strong>WebGPU not available</strong>
  <p>Enable hardware acceleration in chrome://settings</p>
</Alert>

// ❌ Avoid
<div>Error: GPU context creation failed</div>
```

---

## Naming Conventions

### ✅ Component Names

PascalCase for components, descriptive names.

```tsx
// ✅ Good
ModelSelector;
DownloadStatus;
CorrectionActions;

// ❌ Avoid
modelSelector;
DownloadComp;
Actions;
```

### ✅ Hook Names

Start with `use`, camelCase.

```tsx
// ✅ Good
useSettings;
useCacheManagement;
useDownloadProgress;

// ❌ Avoid
getSettings;
SettingsHook;
use_settings;
```

### ✅ Event Handlers

Prefix with `handle`.

```tsx
// ✅ Good
const handleClick = () => { ... }
const handleChange = (value) => { ... }
const handleSubmit = async () => { ... }

// ❌ Avoid
const onClick = () => { ... }
const changed = (value) => { ... }
const submit = async () => { ... }
```

### ✅ Boolean Props

Prefix with `is`, `has`, `should`.

```tsx
// ✅ Good
interface Props {
  isLoading: boolean;
  hasError: boolean;
  shouldShowModal: boolean;
}

// ❌ Avoid
interface Props {
  loading: boolean;
  error: boolean;
  modal: boolean;
}
```

---

## Comments Policy

### ✅ No JSX Comments

Code should be self-documenting through clear component names.

```tsx
// ✅ Good - Clear component name
<ErrorDisplay error={error} />;

// ❌ Avoid
{
  /* Error display section */
}
<div>...</div>;
```

### ✅ TSDoc for Exported Functions

Document public API with TSDoc comments.

```tsx
// ✅ Good
/**
 * Clears all cached AI models from IndexedDB
 * @returns Promise that resolves when cache is cleared
 * @throws Error if IndexedDB access fails
 */
export const clearCache = async (): Promise<void> => { ... }

// ❌ Avoid
// Clears cache
export const clearCache = async () => { ... }
```

### ✅ Explain Why, Not What

When comments needed, explain reasoning, not implementation.

```tsx
// ✅ Good
// WebLLM requires abort controller to be stored for cancellation
this.abortController = new AbortController();

// ❌ Avoid
// Create abort controller
this.abortController = new AbortController();
```

---

## Testing Considerations

### ✅ Testable Components

Components designed for easy testing.

```tsx
// ✅ Good - Pure, testable
const Button = ({ variant, onClick, children }) => (
  <button className={getVariantClass(variant)} onClick={onClick}>
    {children}
  </button>
);

// Test: shallow render, check className, simulate click

// ❌ Avoid - Hard to test
const Button = () => {
  const variant = useContext(ThemeContext).buttonVariant;
  const handleClick = () => {
    fetch('/api/track').then(...);
    props.onClick();
  }
  // Mixed concerns, multiple dependencies
}
```

### ✅ Hooks Return Data

Hooks return data objects, not JSX.

```tsx
// ✅ Good - Testable hook
const useModelSelection = () => {
  return { allModels, selectGroups, getModelInfo };
};

// Test: call hook, assert returned data

// ❌ Avoid
const useModelSelection = () => {
  return <Select options={allModels} />; // Returns JSX!
};
```

---

## Accessibility

### ✅ Semantic HTML

Use semantic elements.

```tsx
// ✅ Good
<button onClick={handleClick}>Click</button>
<nav>...</nav>
<main>...</main>
<header>...</header>

// ❌ Avoid
<div onClick={handleClick}>Click</div>
<div className='navigation'>...</div>
```

### ✅ ARIA Labels

Provide labels for screen readers.

```tsx
// ✅ Good
<button aria-label='Settings' title='Settings'>
  <Settings />
</button>

// ❌ Avoid
<button>
  <Settings />
</button>
```

### ✅ Keyboard Navigation

Ensure keyboard accessibility.

```tsx
// ✅ Good - Native button has keyboard support
<button onClick={handleClick}>Action</button>

// ❌ Avoid - Div doesn't support keyboard
<div onClick={handleClick}>Action</div>
```

---

## Summary Checklist

Before committing code, verify:

- [ ] No JSX comments
- [ ] All components have TypeScript types
- [ ] Custom hooks for complex logic
- [ ] useCallback for event handlers
- [ ] Dark mode support (dark: variants)
- [ ] Cleanup functions in useEffect
- [ ] Semantic HTML elements
- [ ] Consistent Tailwind spacing
- [ ] Single responsibility per component
- [ ] Composition over configuration
- [ ] User-friendly error messages
- [ ] Descriptive variable names
- [ ] No prop drilling (use hooks)
- [ ] No inline styles
- [ ] No class components

**Result:** Production-ready, maintainable, senior-level code quality. ✅
