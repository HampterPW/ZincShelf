document.addEventListener('DOMContentLoaded', () => {
    const extensionsContainer = document.getElementById('extensions-container');
    const searchInput = document.getElementById('search-input');
    
    let extensionsData = [];
    let allFiles = []; // To store all files for searching
    
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
                    renderExtensions(extensionsData);
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
                const combinedResults = [...new Set([...filteredExtensions, ...matchingFileExtensions])];
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
            
            const extensionHeader = document.createElement('div');
            extensionHeader.className = 'extension-header';
            
            const extensionTitle = document.createElement('h2');
            extensionTitle.className = 'extension-title';
            extensionTitle.textContent = extension.name;
            
            const extensionType = document.createElement('span');
            extensionType.className = `extension-type type-${extension.type}`;
            extensionType.textContent = extension.type;
            
            extensionHeader.appendChild(extensionTitle);
            extensionHeader.appendChild(extensionType);
            
            extensionCard.appendChild(extensionHeader);
            
            if (extension.type === 'link') {
                // External link
                const linkElement = document.createElement('a');
                linkElement.href = extension.path;
                linkElement.className = 'external-link';
                linkElement.textContent = 'Visit External Repository';
                linkElement.target = '_blank';
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
            
            const fileLink = document.createElement('a');
            fileLink.className = 'file-link';
            fileLink.href = file.path;
            if (file.type !== 'dir') {
                fileLink.target = '_blank';
            }
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            
            // Add icon based on file type
            const fileIcon = document.createElement('span');
            fileIcon.className = 'file-icon';
            
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