# Project file structure

```sh
oven/
├── src/
│   ├── components/              # Shared components
│   │   ├── ui/                  # shadcn-svelte components
│   │   │   ├── alert/
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   └── ...
│   │   ├── auth/               # Authentication components
│   │   ├── sync/               # Sync related components
│   │   └── common/             # Other shared components
│   ├── stores/                 # Svelte stores
│   │   ├── auth.ts
│   │   ├── sync.ts
│   │   └── settings.ts
│   ├── utils/                  # Utility functions
│   │   ├── api/                # API related utilities
│   │   │   ├── github.ts
│   │   │   └── leetcode.ts
│   │   └── cn.ts               # Class name utilities
│   ├── popup/                  # Extension popup
│   │   ├── index.html
│   │   ├── index.ts
│   │   └── App.svelte
│   ├── background/             # Service worker
│   │   ├── services/           # Background services
│   │   │   ├── auth.ts
│   │   │   ├── sync.ts
│   │   │   └── storage.ts
│   │   └── index.ts
│   ├── content/                # Content scripts
│   │   ├── services/           # Content script services
│   │   │   ├── parser.ts
│   │   │   └── observer.ts
│   │   └── index.ts
│   └── app.css                 # Global styles
├── static/                     # Static assets
│   └── icons/                  # Extension icons
├── tests/                      # Test files
│   └── unit/
│       ├── services/
│       └── utils/
├── .eslintrc.js
├── .prettierrc
├── components.json             # shadcn config
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```
