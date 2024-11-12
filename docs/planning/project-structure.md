oven/
├── src/
│   ├── lib/                    # Shared utilities and components
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   └── shared/         # Custom shared components
│   │   ├── stores/             # Svelte stores
│   │   │   ├── auth.ts         # Authentication state
│   │   │   ├── sync.ts         # Sync state management
│   │   │   └── settings.ts     # Extension settings
│   │   ├── api/                # API clients
│   │   │   ├── leetcode/       # LeetCode API integration
│   │   │   └── github/         # GitHub API integration
│   │   └── utils/              # Shared utilities
│   │       ├── storage.ts      # Browser storage helpers
│   │       └── types.ts        # Shared TypeScript types
│   │
│   ├── popup/                  # Extension popup
│   │   ├── index.html          # Popup entry point
│   │   ├── index.ts            # Popup script entry
│   │   ├── App.svelte          # Root popup component
│   │   └── components/         # Popup-specific components
│   │
│   ├── options/                # Extension options page
│   │   ├── index.html
│   │   ├── index.ts
│   │   ├── App.svelte
│   │   └── components/
│   │
│   ├── content/                # Content scripts
│   │   ├── index.ts            # Content script entry
│   │   ├── components/         # Content script components
│   │   └── styles/             # Content script styles
│   │
│   └── background/             # Service worker
│       └── index.ts            # Background script entry
│
├── public/                     # Static assets
│   ├── icons/                  # Extension icons
│   └── assets/                 # Other assets
│
├── tests/                      # Test files
│   ├── unit/
│   └── integration/
│
├── types/                      # Type definitions
│   └── vite-env.d.ts          # Vite environment types
│
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── manifest.config.ts         # Manifest configuration
├── package.json
├── postcss.config.js          # PostCSS configuration
├── svelte.config.js           # Svelte configuration
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration