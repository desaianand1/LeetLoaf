# LeetLoaf Oven (Browser Extension) Architecture

```mermaid
flowchart TB
    %% Define main components
    subgraph Browser["Browser Extension Components"]
        direction TB
        popup["Popup
        (src/popup)
        User Interface"]
        bg["Background Service Worker
        (src/background)
        Main Extension Logic"]
        content["Content Script
        (src/content)
        LeetCode Page Integration"]
    end

    subgraph Storage["Extension Storage"]
        storage["Chrome Storage API
        - User Settings
        - Auth Tokens
        - Sync Status"]
    end

    subgraph External["External Services"]
        direction LR
        lc["LeetCode API
        - Problem Data
        - Solutions
        - User Progress"]
        gh["GitHub API
        - Repository Management
        - File Operations"]
    end

    subgraph Features["Core Features"]
        direction TB
        auth["Authentication Manager"]
        sync["Solution Sync Engine"]
        parser["Problem Parser & Generator"]
        site["Static Site Generator"]
    end

    %% Define connections with better routing
    popup --> bg
    bg --> popup
    content --> bg
    bg --> content

    %% Storage connections
    bg --> storage
    popup -.-> |"Read Only"| storage

    %% External service connections
    content --> lc
    bg --> gh

    %% Feature connections
    bg --> auth
    bg --> sync
    sync --> parser
    parser --> site
    
    %% Data flow connections
    lc --> parser
    parser --> sync
    sync --> gh
    auth --> storage

    %% Styling
    classDef browser fill:#f9f,stroke:#333,stroke-width:2px
    classDef storage fill:#bbf,stroke:#333,stroke-width:2px
    classDef external fill:#bfb,stroke:#333,stroke-width:2px
    classDef features fill:#fbb,stroke:#333,stroke-width:2px
    
    class Browser browser
    class Storage storage
    class External external
    class Features features
```

## Component Details

### Browser Extension Components

- **Popup**: User interface that appears when clicking the extension icon
- **Background Service Worker**: Core extension logic and coordination
- **Content Script**: Integrates with LeetCode pages

### Extension Storage

- Chrome Storage API for persisting:
  - User settings
  - Authentication tokens
  - Sync status

### External Services

- **LeetCode API**: Source of problems and solutions
- **GitHub API**: Repository and file management

### Core Features

- **Authentication Manager**: GitHub OAuth handling
- **Solution Sync Engine**: Orchestrates solution syncing
- **Problem Parser**: Processes LeetCode problems
- **Static Site Generator**: Creates browsable solution website

## Key Interactions

1. **User Interface Flow**
   - Popup communicates with background service worker
   - Background worker updates UI state

2. **Data Flow**
   - Content script monitors LeetCode pages
   - Parser formats problem data
   - Sync engine pushes to GitHub
   - Static site generator creates documentation

3. **Authentication Flow**
   - Auth manager handles GitHub OAuth
   - Tokens stored in Chrome Storage
   - Background worker manages auth state