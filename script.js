document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const extensionsContainer = document.getElementById('extensions-container');
    const searchInput = document.getElementById('search-input');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const footerThemeToggleBtn = document.getElementById('footer-theme-toggle');
    const shortcutsBtn = document.getElementById('shortcuts-btn');
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const closeBtn = document.querySelector('.close-btn');
    const allBtn = document.getElementById('all-btn');
    const favoritesTabBtn = document.getElementById('favorites-tab-btn');
    const favoritesBtn = document.getElementById('favorites-btn');
    
    // State variables
    let extensionsData = [];
    let allFiles = []; // To store all files for searching
    let currentExtensionIndex = -1; // For keyboard navigation
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let currentView = 'all'; // 'all' or 'favorites'
    
    // Initialize the UI
    updateFavoritesCount();
    initTheme();
    
    // Theme toggle functions
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        }
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }
    
    function updateThemeIcon(theme) {
        themeToggleBtn.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
    
    // Favorites functions
    function updateFavoritesCount() {
        const count = favorites.length;
        document.querySelectorAll('.favorites-count').forEach(el => {
            el.textContent = count;
        });
    }
    
    function toggleFavorite(extensionName) {
        const index = favorites.indexOf(extensionName);
        
        if (index === -1) {
            // Add to favorites
            favorites.push(extensionName);
            showToast(`Added ${extensionName} to favorites`);
        } else {
            // Remove from favorites
            favorites.splice(index, 1);
            showToast(`Removed ${extensionName} from favorites`);
            
            // If in favorites view, we might need to re-render
            if (currentView === 'favorites') {
                renderFavorites();
            }
        }
        
        // Save to localStorage
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesCount();
        
        // Update UI
        updateFavoriteButtons();
    }
    
    function updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const extensionName = btn.dataset.extension;
            if (favorites.includes(extensionName)) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-star"></i>';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-star"></i>';
            }
        });
    }
    
    function showToast(message) {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.backgroundColor = 'var(--primary)';
            toast.style.color = 'white';
            toast.style.padding = '10px 15px';
            toast.style.borderRadius = '4px';
            toast.style.boxShadow = '0 2px 5px var(--shadow)';
            toast.style.zIndex = '1000';
            toast.style.transition = 'transform 0.3s, opacity 0.3s';
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            document.body.appendChild(toast);
        }
        
        // Update message and show
        toast.textContent = message;
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
        }, 3000);
    }
    
    function renderFavorites() {
        const favoriteExtensions = extensionsData.filter(ext => 
            favorites.includes(ext.name)
        );
        
        if (favoriteExtensions.length === 0) {
            extensionsContainer.innerHTML = `
                <div class="no-results">
                    <p>No favorite extensions yet</p>
                    <p class="text-muted">Star extensions to add them to your favorites</p>
                </div>
            `;
            return;
        }
        
        renderExtensions(favoriteExtensions);
    }
    
    // Modal functions
    function showShortcutsModal() {
        shortcutsModal.classList.add('show');
    }
    
    function hideShortcutsModal() {
        shortcutsModal.classList.remove('show');
    }
    
    // Event listeners
    themeToggleBtn.addEventListener('click', toggleTheme);
    footerThemeToggleBtn.addEventListener('click', toggleTheme);
    
    shortcutsBtn.addEventListener('click', showShortcutsModal);
    closeBtn.addEventListener('click', hideShortcutsModal);
    shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
            hideShortcutsModal();
        }
    });
    
    // Tab switching
    allBtn.addEventListener('click', () => {
        if (currentView !== 'all') {
            allBtn.classList.add('active');
            favoritesTabBtn.classList.remove('active');
            currentView = 'all';
            renderExtensions(extensionsData);
        }
    });
    
    favoritesTabBtn.addEventListener('click', () => {
        if (currentView !== 'favorites') {
            favoritesTabBtn.classList.add('active');
            allBtn.classList.remove('active');
            currentView = 'favorites';
            renderFavorites();
        }
    });
    
    favoritesBtn.addEventListener('click', () => {
        if (currentView !== 'favorites') {
            favoritesTabBtn.classList.add('active');
            allBtn.classList.remove('active');
            currentView = 'favorites';
            renderFavorites();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Don't handle keyboard shortcuts if user is typing in search
        if (document.activeElement === searchInput && e.key !== 'Escape') {
            return;
        }
        
        const extensionCards = document.querySelectorAll('.extension-card');
        
        switch (e.key) {
            case '/':
                // Focus search
                e.preventDefault();
                searchInput.focus();
                break;
                
            case 'Escape':
                // Clear search or close modal
                if (shortcutsModal.classList.contains('show')) {
                    hideShortcutsModal();
                } else if (document.activeElement === searchInput) {
                    searchInput.value = '';
                    searchInput.blur();
                    if (currentView === 'all') {
                        renderExtensions(extensionsData);
                    } else {
                        renderFavorites();
                    }
                }
                break;
                
            case 't':
            case 'T':
                // Toggle theme
                toggleTheme();
                break;
                
            case 'f':
            case 'F':
                // View favorites
                if (currentView !== 'favorites') {
                    favoritesTabBtn.classList.add('active');
                    allBtn.classList.remove('active');
                    currentView = 'favorites';
                    renderFavorites();
                }
                break;
                
            case '?':
                // Show keyboard shortcuts
                showShortcutsModal();
                break;
                
            case 'ArrowUp':
                // Navigate up in extension list
                if (extensionCards.length > 0) {
                    e.preventDefault();
                    currentExtensionIndex = Math.max(0, currentExtensionIndex - 1);
                    focusExtensionCard(extensionCards[currentExtensionIndex]);
                }
                break;
                
            case 'ArrowDown':
                // Navigate down in extension list
                if (extensionCards.length > 0) {
                    e.preventDefault();
                    if (currentExtensionIndex === -1) {
                        currentExtensionIndex = 0;
                    } else {
                        currentExtensionIndex = Math.min(extensionCards.length - 1, currentExtensionIndex + 1);
                    }
                    focusExtensionCard(extensionCards[currentExtensionIndex]);
                }
                break;
                
            case 's':
            case 'S':
                // Star/unstar current extension
                if (currentExtensionIndex !== -1 && extensionCards.length > 0) {
                    const card = extensionCards[currentExtensionIndex];
                    const extensionName = card.querySelector('.extension-title').textContent;
                    toggleFavorite(extensionName);
                }
                break;
                
            case 'Enter':
                // Open current extension or toggle directory
                if (currentExtensionIndex !== -1 && extensionCards.length > 0) {
                    const card = extensionCards[currentExtensionIndex];
                    const link = card.querySelector('.external-link');
                    if (link) {
                        window.open(link.href, '_blank');
                    } else {
                        // Toggle directory if it's a directory
                        // (Specific implementation depends on your directory structure)
                    }
                }
                break;
        }
    });
    
    function focusExtensionCard(card) {
        // Remove focus from all cards
        document.querySelectorAll('.extension-card').forEach(c => {
            c.classList.remove('focused');
        });
        
        // Add focus to the current card
        card.classList.add('focused');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Fetch the main index.json file
    fetch('extensions/index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch extensions list');
            }
            return response.json();
        })
        .then(data => {
            extensionsData = data;
            renderExtensions(extensionsData);
            
            // Fetch all extension contents for search indexing
            loadAllExtensionContents(extensionsData);
            
            // Add search functionality
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                
                if (!searchTerm) {
                    if (currentView === 'all') {
                        renderExtensions(extensionsData);
                    } else {
                        renderFavorites();
                    }
                    return;
                }
                
                // Search in extension names
                const filteredExtensions = extensionsData.filter(ext => 
                    ext.name.toLowerCase().includes(searchTerm)
                );
                
                // Search in file names
                const matchingFileExtensions = new Set();
                allFiles.forEach(file => {
                    if (file.name.toLowerCase().includes(searchTerm)) {
                        // Extract extension name from file path
                        const pathParts = file.path.split('/');
                        if (pathParts.length >= 2) {
                            const extensionName = pathParts[1]; // extensions/NAME/...
                            
                            // Find and add the matching extension
                            const matchingExt = extensionsData.find(ext => ext.name === extensionName);
                            if (matchingExt) {
                                matchingFileExtensions.add(matchingExt);
                            }
                        }
                    }
                });
                
                // Combine both results
                let combinedResults = [...new Set([...filteredExtensions, ...matchingFileExtensions])];
                
                // If in favorites view, filter by favorites
                if (currentView === 'favorites') {
                    combinedResults = combinedResults.filter(ext => favorites.includes(ext.name));
                }
                
                renderExtensions(combinedResults);
                
                // Highlight matching files in the UI
                highlightMatchingFiles(searchTerm);
            });
        })
        .catch(error => {
            extensionsContainer.innerHTML = `
                <div class="error">
                    <p>Error loading extensions: ${error.message}</p>
                </div>
            `;
            console.error('Error fetching extensions:', error);
        });
    
    // Function to load all extension contents for search indexing
    function loadAllExtensionContents(extensions) {
        extensions.forEach(extension => {
            if (extension.type === 'dir') {
                fetchExtensionContentsForSearch(extension.path);
            }
        });
    }
    
    // Function to fetch extension contents for search indexing
    function fetchExtensionContentsForSearch(path) {
        fetch(`${path}/index.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch extension files');
                }
                return response.json();
            })
            .then(files => {
                // Add files to the global files array
                allFiles = [...allFiles, ...files];
                
                // Recursively index subdirectories
                files.forEach(file => {
                    if (file.type === 'dir') {
                        fetchExtensionContentsForSearch(file.path);
                    }
                });
            })
            .catch(error => {
                console.error(`Error fetching ${path} contents for search:`, error);
            });
    }
    
    // Function to highlight matching files in the UI
    function highlightMatchingFiles(searchTerm) {
        const fileElements = document.querySelectorAll('.file-link');
        fileElements.forEach(element => {
            const fileName = element.querySelector('.file-name').textContent;
            if (fileName.toLowerCase().includes(searchTerm)) {
                element.classList.add('highlight');
            } else {
                element.classList.remove('highlight');
            }
        });
    }
    
    // Function to render extensions
    function renderExtensions(extensions) {
        if (extensions.length === 0) {
            extensionsContainer.innerHTML = '<div class="no-results">No extensions or files found</div>';
            return;
        }
        
        extensionsContainer.innerHTML = '';
        
        extensions.forEach(extension => {
            const extensionCard = document.createElement('div');
            extensionCard.className = 'extension-card';
            extensionCard.setAttribute('role', 'region');
            extensionCard.setAttribute('aria-label', `Extension: ${extension.name}`);
            
            const extensionHeader = document.createElement('div');
            extensionHeader.className = 'extension-header';
            
            const extensionTitle = document.createElement('h2');
            extensionTitle.className = 'extension-title';
            extensionTitle.textContent = extension.name;
            
            const extensionActions = document.createElement('div');
            extensionActions.className = 'extension-actions';
            
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn';
            favoriteBtn.dataset.extension = extension.name;
            
            if (favorites.includes(extension.name)) {
                favoriteBtn.classList.add('active');
                favoriteBtn.innerHTML = '<i class="fas fa-star"></i>';
            } else {
                favoriteBtn.innerHTML = '<i class="far fa-star"></i>';
            }
            
            favoriteBtn.setAttribute('aria-label', `Favorite ${extension.name}`);
            favoriteBtn.addEventListener('click', () => toggleFavorite(extension.name));
            
            const extensionType = document.createElement('span');
            extensionType.className = `extension-type type-${extension.type}`;
            extensionType.textContent = extension.type;
            
            extensionActions.appendChild(favoriteBtn);
            extensionActions.appendChild(extensionType);
            
            extensionHeader.appendChild(extensionTitle);
            extensionHeader.appendChild(extensionActions);
            
            extensionCard.appendChild(extensionHeader);
            
            if (extension.type === 'link') {
                // External link
                const linkElement = document.createElement('a');
                linkElement.href = extension.path;
                linkElement.className = 'external-link';
                linkElement.textContent = 'Visit External Repository';
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                extensionCard.appendChild(linkElement);
            } else if (extension.type === 'dir') {
                // Directory - fetch the contents
                const fileList = document.createElement('ul');
                fileList.className = 'file-list';
                fileList.innerHTML = '<li class="loading">Loading files...</li>';
                extensionCard.appendChild(fileList);
                
                fetchExtensionContents(extension.path, fileList);
            }
            
            extensionsContainer.appendChild(extensionCard);
        });
    }
    
    // Function to fetch extension contents
    function fetchExtensionContents(path, fileListElement) {
        fetch(`${path}/index.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch extension files');
                }
                return response.json();
            })
            .then(files => {
                renderFileList(files, fileListElement, path);
            })
            .catch(error => {
                fileListElement.innerHTML = `
                    <li class="error">Error loading files: ${error.message}</li>
                `;
                console.error(`Error fetching ${path} contents:`, error);
            });
    }
    
    // Function to render file list
    function renderFileList(files, fileListElement, parentPath) {
        if (files.length === 0) {
            fileListElement.innerHTML = '<li class="no-files">No files found</li>';
            return;
        }
        
        fileListElement.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('li');
            fileItem.className = 'file-item';
            
            const baseUrl = 'https://zinccore.github.io/ZincShelf';
            const fullPath = `${baseUrl}/${file.path}`;
            
            const fileLink = document.createElement('a');
            fileLink.className = 'file-link';
            fileLink.href = fullPath;
            fileLink.setAttribute('aria-label', `${file.type}: ${file.name}`);
            
            if (file.type !== 'dir') {
                fileLink.target = '_blank';
                fileLink.rel = 'noopener noreferrer';
            }
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            
            // Add icon based on file type
            const fileIcon = document.createElement('span');
            fileIcon.className = 'file-icon';
            fileIcon.setAttribute('aria-hidden', 'true');
            
            if (file.type === 'dir') {
                fileIcon.innerHTML = '📁';
            } else if (file.type === 'file') {
                fileIcon.innerHTML = '📄';
            } else if (file.type === 'link') {
                fileIcon.innerHTML = '🔗';
            }
            
            fileName.appendChild(fileIcon);
            fileName.appendChild(document.createTextNode(file.name));
            
            const fileType = document.createElement('span');
            fileType.className = 'file-type';
            fileType.textContent = file.type;
            
            fileLink.appendChild(fileName);
            fileLink.appendChild(fileType);
            
            fileItem.appendChild(fileLink);

            // Add action buttons for non-directory files
            if (file.type !== 'dir') {
                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'file-actions';
                
                // Download button
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'action-btn';
                downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
                downloadBtn.title = 'Download file';
                downloadBtn.onclick = (e) => {
                    e.preventDefault();
                    window.open(fullPath, '_blank');
                };
                
                // Copy content button
                const copyContentBtn = document.createElement('button');
                copyContentBtn.className = 'action-btn';
                copyContentBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyContentBtn.title = 'Copy file contents';
                copyContentBtn.onclick = async (e) => {
                    e.preventDefault();
                    try {
                        const response = await fetch(fullPath);
                        const text = await response.text();
                        await navigator.clipboard.writeText(text);
                        showToast('File contents copied to clipboard');
                    } catch (err) {
                        showToast('Failed to copy file contents');
                    }
                };
                
                // Open link button
                const openLinkBtn = document.createElement('button');
                openLinkBtn.className = 'action-btn';
                openLinkBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
                openLinkBtn.title = 'Open file link';
                openLinkBtn.onclick = (e) => {
                    e.preventDefault();
                    window.open(fullPath, '_blank');
                };
                
                // Copy link button
                const copyLinkBtn = document.createElement('button');
                copyLinkBtn.className = 'action-btn';
                copyLinkBtn.innerHTML = '<i class="fas fa-link"></i>';
                copyLinkBtn.title = 'Copy file link';
                copyLinkBtn.onclick = async (e) => {
                    e.preventDefault();
                    try {
                        await navigator.clipboard.writeText(fullPath);
                        showToast('File link copied to clipboard');
                    } catch (err) {
                        showToast('Failed to copy file link');
                    }
                };
                
                buttonGroup.appendChild(downloadBtn);
                buttonGroup.appendChild(copyContentBtn);
                buttonGroup.appendChild(openLinkBtn);
                buttonGroup.appendChild(copyLinkBtn);
                
                fileItem.appendChild(buttonGroup);
            }
            
            fileListElement.appendChild(fileItem);
            
            // If it's a directory, add a nested file list and fetch its contents
            if (file.type === 'dir') {
                const nestedFileList = document.createElement('ul');
                nestedFileList.className = 'file-list nested';
                nestedFileList.style.display = 'none';
                nestedFileList.innerHTML = '<li class="loading">Loading files...</li>';
                fileItem.appendChild(nestedFileList);
                
                // Toggle visibility when clicking on directory
                fileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (nestedFileList.style.display === 'none') {
                        nestedFileList.style.display = 'block';
                        fetchExtensionContents(file.path, nestedFileList);
                    } else {
                        nestedFileList.style.display = 'none';
                    }
                });
            }
        });
        
        // Check if we need to highlight any files (if search is active)
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            highlightMatchingFiles(searchTerm);
        }
    }
}); 