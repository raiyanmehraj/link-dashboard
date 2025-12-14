// State Management
const CATEGORIES = ['Study Materials', 'Development', 'Tools and other'];
const STORAGE_KEY = 'study-links';
const THEME_STORAGE_KEY = 'link-dashboard-theme';

let state = {
  links: [],
  searchQuery: '',
  activeCategory: 'All',
  activeTag: null,
  isModalOpen: false,
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  selectedCategory: 'Study Materials',
  tags: [],
  editingId: null,
  subEntries: [],
  urlMode: 'single', // 'single' or 'multiple'
};

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
}

// Initial data
const INITIAL_LINKS = [
  {
    id: '1',
    title: '🚨BracU Notes🚨',
    url: 'https://bracu-notes-f56c9.web.app/',
    category: 'Study Materials',
    contributor: 'Shrabon, A. H.',
    tags: ['React', 'Frontend', 'Docs'],
    createdAt: Date.now(),
  },
  {
    id: '2',
    title: 'PHY 112: TKT YouTube Playlist ',
    url: 'https://youtube.com/playlist?list=PLtQXTSdoymQegkOv8qyoy4xW5kZVdFKYF&si=0vH3uKd9KdFMsdTT',
    category: 'Study Materials',
    contributor: 'Shrabon, A. H.',
    tags: ['Habits', 'Productivity', 'Psychology'],
    createdAt: Date.now() - 10000,
  },
  {
    id: '3',
    title: 'CSE 220: Udemy - Java DSA by Scott Barret',
    url: 'https://mega.nz/folder/4JFEmDBR#AyNtJrRAWA9lYmU_t_UB6Q',
    category: 'Study Materials',
    contributor: 'Shrabon, A. H.',
    tags: ['Stoicism', 'Philosophy', 'Daily'],
    createdAt: Date.now() - 20000,
  },
  {
    id: '4',
    title: "CSE220 Survivors' Guide",
    url: 'https://www.facebook.com/groups/bracucsestudentcommunity/permalink/1437361640665763/#',
    category: 'Study Materials',
    contributor: 'Shrabon, A. H.',
    tags: ['TypeScript', 'Programming', 'Advanced'],
    createdAt: Date.now() - 30000,
  },
  {
    id: '5',
    title: 'Linkedin',
    url: 'https://www.linkedin.com/posts/waqar-ali-16ba6b318_phd-research-activity-7382750293949685760-TsUv?utm_source=social_share_send&utm_medium=android_app&rcm=ACoAAD-5Ei8Bp34OKoem35ShtSF0DIaZiwhUCL0&utm_campaign=copy_link',
    category: 'Development',
    contributor: 'Rahman. M ',
    tags: ['Finance', 'Psychology', 'Wealth'],
    createdAt: Date.now() - 40000,
  },
];

// DOM Elements
const elements = {
  searchInput: document.getElementById('searchInput'),
  sidebarContent: document.getElementById('sidebarContent'),
  mobileSidebarContent: document.getElementById('mobileSidebarContent'),
  linksContainer: document.getElementById('linksContainer'),
  emptyState: document.getElementById('emptyState'),
  contentTitle: document.getElementById('contentTitle'),
  entryCount: document.getElementById('entryCount'),
  entryLabel: document.getElementById('entryLabel'),
  activeTagContainer: document.getElementById('activeTagContainer'),
  activeTagText: document.getElementById('activeTagText'),
  removeTagBtn: document.getElementById('removeTagBtn'),
  emptyStateMessage: document.getElementById('emptyStateMessage'),
  
  // Buttons
  addLinkBtn: document.getElementById('addLinkBtn'),
  addLinkBtnMobile: document.getElementById('addLinkBtnMobile'),
  fab: document.getElementById('fab'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  sidebarToggle: document.getElementById('sidebarToggle'),
  
  // Modal
  modalOverlay: document.getElementById('modalOverlay'),
  modal: document.getElementById('addLinkModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  addLinkForm: document.getElementById('addLinkForm'),
  cancelBtn: document.getElementById('cancelBtn'),
  
  // Form inputs
  titleInput: document.getElementById('titleInput'),
  urlInput: document.getElementById('urlInput'),
  contributorInput: document.getElementById('contributorInput'),
  categoryOptions: document.getElementById('categoryOptions'),
  tagsContainer: document.getElementById('tagsContainer'),
  tagsInput: document.getElementById('tagsInput'),
  dateInput: document.getElementById('dateInput'),
  subEntriesContainer: document.getElementById('subEntriesContainer'),
  addSubEntryBtn: document.getElementById('addSubEntryBtn'),
  modeUrlSingle: document.getElementById('modeUrlSingle'),
  modeUrlMultiple: document.getElementById('modeUrlMultiple'),
  
  // Sidebar
  sidebar: document.getElementById('sidebar'),
  mobileSidebarOverlay: document.getElementById('mobileSidebarOverlay'),
  mobileSidebar: document.getElementById('mobileSidebar'),
};
// Initialize
function init() {
  initTheme();
  loadLinksFromStorage();
  renderSidebar();
  renderLinks();
  attachEventListeners();
  renderCategoryOptions();

  // Theme toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
}

// Storage Functions
function loadLinksFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    state.links = stored ? JSON.parse(stored) : [...INITIAL_LINKS];
    // Remove any persisted summaries so the UI resets on refresh
    state.links = state.links.map(clearSummaries);
  } catch (e) {
    console.error('Failed to load links:', e);
    state.links = [...INITIAL_LINKS];
  }
}

function saveLinksToStorage() {
  // Persist links without summaries so cards reset on refresh
  const sanitized = state.links.map(clearSummaries);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
}

// Helpers
function stripTags(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '');
}

function clearSummaries(link) {
  const sanitizedSubEntries = (link.subEntries || []).map((s) => ({
    ...s,
    summary: undefined,
  }));
  return {
    ...link,
    summary: undefined,
    subEntries: sanitizedSubEntries,
  };
}

// Event Listeners
function attachEventListeners() {
  // Search
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderLinks();
  });

  // Add Link Button
  elements.addLinkBtn.addEventListener('click', openModal);
  elements.addLinkBtnMobile.addEventListener('click', openModal);
  elements.fab.addEventListener('click', openModal);

  // Modal
  elements.modalCloseBtn.addEventListener('click', closeModal);
  elements.cancelBtn.addEventListener('click', closeModal);
  elements.modalOverlay.addEventListener('click', closeModal);
  elements.addLinkForm.addEventListener('submit', handleAddLink);

  // Sidebar
  elements.mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
  elements.mobileSidebarOverlay.addEventListener('click', closeMobileSidebar);
  elements.sidebarToggle.addEventListener('click', toggleSidebar);

  // Remove tag
  elements.removeTagBtn.addEventListener('click', () => {
    state.activeTag = null;
    renderLinks();
  });

  // Tags input
  elements.tagsInput.addEventListener('keydown', handleTagInput);

  // Sub-entries add button
  elements.addSubEntryBtn.addEventListener('click', () => {
    addSubEntryInput();
  });

  // URL Mode toggle
  elements.modeUrlSingle.addEventListener('change', () => {
    state.urlMode = 'single';
    elements.urlInput.required = true;
    elements.urlInput.style.display = 'block'; // Show URL input field
    elements.subEntriesContainer.style.display = 'none';
    elements.addSubEntryBtn.style.display = 'none';
  });

  elements.modeUrlMultiple.addEventListener('change', () => {
    state.urlMode = 'multiple';
    elements.urlInput.required = false;
    elements.urlInput.style.display = 'none'; // Hide URL input field only
    elements.subEntriesContainer.style.display = 'flex';
    elements.addSubEntryBtn.style.display = 'inline-block';
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K to focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      elements.searchInput.focus();
    }
    // Cmd/Ctrl + N to open modal
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      openModal();
    }
    // Escape to close modal
    if (e.key === 'Escape') {
      closeModal();
      state.activeTag = null;
      renderLinks();
    }
  });
}

// Modal Functions
function openModal() {
  state.isModalOpen = true;
  elements.modal.classList.add('active');
  elements.modalOverlay.classList.add('active');
  elements.titleInput.focus();
  
  // Reset form
  elements.addLinkForm.reset();
  state.tags = [];
  state.selectedCategory = 'Study Materials';
  state.urlMode = 'single'; // Reset to single mode by default
  elements.modeUrlSingle.checked = true;
  elements.modeUrlMultiple.checked = false;
  elements.urlInput.required = true;
  elements.urlInput.style.display = 'block'; // Show URL input
  elements.subEntriesContainer.style.display = 'none';
  elements.addSubEntryBtn.style.display = 'none';
  renderCategoryOptions();
  renderTags();
  updateTagsPlaceholder();
  closeMobileSidebar();
  
  // Update modal title and button
  const modalTitle = elements.modal.querySelector('.modal-header h2');
  const submitBtn = elements.addLinkForm.querySelector('.btn-primary');
  
  if (state.editingId) {
    const link = state.links.find(l => l.id === state.editingId);
    if (link) {
      modalTitle.textContent = 'Edit Link';
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Save Changes
      `;
      
      elements.titleInput.value = link.title;
      elements.urlInput.value = link.url;
      elements.contributorInput.value = link.contributor;
      state.selectedCategory = link.category;
      state.tags = [...link.tags];
      
      // Set date input to current link's date
      const date = new Date(link.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      elements.dateInput.value = `${day}/${month}/${year}`;
      
      // Prefill sub-entries
      state.subEntries = link.subEntries ? link.subEntries.map(s => ({...s})) : [];
      
      // Set URL mode based on whether link has sub-entries
      if (state.subEntries.length > 0) {
        state.urlMode = 'multiple';
        elements.modeUrlMultiple.checked = true;
        elements.modeUrlSingle.checked = false;
        elements.urlInput.required = false;
        elements.urlInput.style.display = 'none'; // Hide URL input field
        elements.subEntriesContainer.style.display = 'flex';
        elements.addSubEntryBtn.style.display = 'inline-block';
      } else {
        state.urlMode = 'single';
        elements.modeUrlSingle.checked = true;
        elements.modeUrlMultiple.checked = false;
        elements.urlInput.required = true;
        elements.urlInput.style.display = 'block'; // Show URL input field
        elements.subEntriesContainer.style.display = 'none';
        elements.addSubEntryBtn.style.display = 'none';
      }
      
      renderCategoryOptions();

      renderTags();
      updateTagsPlaceholder();
      renderSubEntryInputs();
    }
  } else {
    modalTitle.textContent = 'Add New Link';
    submitBtn.innerHTML = `OK`;
    // Clear date input for new link
    elements.dateInput.value = '';
    // clear sub-entries for new
    state.subEntries = [];
    renderSubEntryInputs();
  }
}

function closeModal() {
  state.isModalOpen = false;
  state.editingId = null;
  elements.modal.classList.remove('active');
  elements.modalOverlay.classList.remove('active');
  state.tags = [];
  state.subEntries = [];
}

function handleAddLink(e) {
  e.preventDefault();
  const title = elements.titleInput.value.trim();
  const url = elements.urlInput.value.trim();
  const category = state.selectedCategory;
  const contributor = elements.contributorInput.value.trim();
  const tags = [...state.tags];
  
  // Handle date - use provided date or current time
  let createdAt = Date.now();
  if (elements.dateInput.value) {
    // Parse dd/mm/yyyy format
    const dateParts = elements.dateInput.value.split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(dateParts[2], 10);
      createdAt = new Date(year, month, day).getTime();
    }
  }

  // Validation: title is always required
  // URL is required for single mode, optional for multiple mode
  if (!title) return;
  if (state.urlMode === 'single' && !url) return;
  if (state.urlMode === 'multiple' && state.subEntries.length === 0) {
    alert('Please add at least one sub-entry for multiple URL mode');
    return;
  }

  if (state.editingId) {
    // Update existing link
    const linkIndex = state.links.findIndex(l => l.id === state.editingId);
    if (linkIndex !== -1) {
      const normalizedSubEntries = (state.subEntries || []).map((s) => ({
        id: s.id || crypto.randomUUID(),
        title: s.title || '',
        url: s.url ? (s.url.startsWith('http') ? s.url : `https://${s.url}`) : '',
      }));

      state.links[linkIndex] = {
        ...state.links[linkIndex],
        title,
        url: url.startsWith('http') ? url : `https://${url}`,
        category,
        contributor,
        tags,
        createdAt,
        subEntries: normalizedSubEntries,
      };
    }
  } else {
    // Create new link
    const normalizedSubEntries = (state.subEntries || []).map((s) => ({
      id: s.id || crypto.randomUUID(),
      title: s.title || '',
      url: s.url ? (s.url.startsWith('http') ? s.url : `https://${s.url}`) : '',
    }));

    const newLink = {
      id: crypto.randomUUID(),
      title,
      url: url.startsWith('http') ? url : `https://${url}`,
      category,
      contributor,
      tags,
      createdAt,
      subEntries: normalizedSubEntries,
    };
    state.links.unshift(newLink);
  }

  saveLinksToStorage();
  closeModal();
  renderLinks();
}

// Tag Functions
function handleTagInput(e) {
  if (e.key === 'Enter' && elements.tagsInput.value.trim()) {
    e.preventDefault();
    const tag = elements.tagsInput.value.trim();
    if (!state.tags.includes(tag)) {
      state.tags.push(tag);
      renderTags();
      elements.tagsInput.value = '';
      updateTagsPlaceholder();
    }
  } else if (e.key === 'Backspace' && !elements.tagsInput.value && state.tags.length > 0) {
    state.tags.pop();
    renderTags();
    updateTagsPlaceholder();
  }
}

// Sub-entry functions (modal inputs)
function renderSubEntryInputs() {
  const container = elements.subEntriesContainer;
  if (!container) return;
  container.innerHTML = '';

  state.subEntries.forEach((se, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'sub-entry-input';
    wrapper.innerHTML = `
      <input type="text" class="form-input sub-title" placeholder="Sub-title" value="${escapeHTML(se.title || '')}">
      <input type="text" class="form-input sub-url" placeholder="Sub-URL" value="${escapeHTML(se.url || '')}">
      <button type="button" class="btn btn-secondary remove-sub" data-index="${idx}">Remove</button>
    `;
    // bind events
    wrapper.querySelector('.remove-sub').addEventListener('click', () => {
      state.subEntries.splice(idx, 1);
      renderSubEntryInputs();
    });
    wrapper.querySelector('.sub-title').addEventListener('input', (e) => {
      state.subEntries[idx].title = e.target.value;
    });
    wrapper.querySelector('.sub-url').addEventListener('input', (e) => {
      state.subEntries[idx].url = e.target.value;
    });
    container.appendChild(wrapper);
  });
}

function addSubEntryInput() {
  if (!state.subEntries) state.subEntries = [];
  state.subEntries.push({ id: crypto.randomUUID(), title: '', url: '' });
  renderSubEntryInputs();
}

function removeTag(index) {
  state.tags.splice(index, 1);
  renderTags();
  updateTagsPlaceholder();
}

function renderTags() {
  const container = elements.tagsContainer;
  const existingTags = container.querySelectorAll('.tag-item');
  existingTags.forEach((tag) => tag.remove());

  state.tags.forEach((tag, index) => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag-item';
    tagEl.innerHTML = `
      ${tag}
      <button type="button" class="tag-remove" data-index="${index}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    tagEl.querySelector('.tag-remove').addEventListener('click', (e) => {
      e.preventDefault();
      removeTag(index);
    });
    container.insertBefore(tagEl, elements.tagsInput);
  });
}

function updateTagsPlaceholder() {
  if (state.tags.length === 0) {
    elements.tagsInput.placeholder = 'Type tag & press Enter';
  } else {
    elements.tagsInput.placeholder = '';
  }
}

// Category Functions
function renderCategoryOptions() {
  elements.categoryOptions.innerHTML = CATEGORIES.map((cat) => `
    <button 
      type="button" 
      class="category-option ${cat === state.selectedCategory ? 'selected' : ''}"
      data-category="${cat}"
    >
      ${cat}
    </button>
  `).join('');

  elements.categoryOptions.querySelectorAll('.category-option').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      state.selectedCategory = btn.dataset.category;
      renderCategoryOptions();
    });
  });
}

// Sidebar Functions
function renderSidebar() {
  const categories = [
    { id: 'All', label: 'All Links', icon: 'grid' },
    { id: 'Study Materials', label: 'Study Materials', icon: 'book' },
    { id: 'Development', label: 'Development', icon: 'zap' },
    { id: 'Tools and other', label: 'Tools and other', icon: 'target' },
  ];

  const sidebarHTML = categories.map((cat) => {
    const count = cat.id === 'All' 
      ? state.links.length 
      : state.links.filter((l) => l.category === cat.id).length;
    const isActive = state.activeCategory === cat.id;
    
    return `
      <button class="category-btn ${isActive ? 'active' : ''}" data-category="${cat.id}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${getIconSVG(cat.icon)}
        </svg>
        <span class="category-btn-label">${cat.label}</span>
        <span class="category-count">${count}</span>
      </button>
    `;
  }).join('');

  elements.sidebarContent.innerHTML = sidebarHTML;
  elements.mobileSidebarContent.innerHTML = sidebarHTML;

  document.querySelectorAll('.category-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeCategory = btn.dataset.category;
      state.activeTag = null;
      renderSidebar();
      renderLinks();
      closeMobileSidebar();
    });
  });
}

function getIconSVG(icon) {
  const icons = {
    grid: '<polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3"></polyline><polyline points="12 12 20 7.5"></polyline><polyline points="12 12 12 21"></polyline><polyline points="12 12 4 7.5"></polyline>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>',
    target: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
  };
  return icons[icon] || '';
}

function toggleSidebar() {
  state.isSidebarOpen = !state.isSidebarOpen;
  elements.sidebar.classList.toggle('collapsed', !state.isSidebarOpen);
}

function toggleMobileSidebar() {
  state.isMobileMenuOpen = !state.isMobileMenuOpen;
  elements.mobileSidebar.classList.toggle('active', state.isMobileMenuOpen);
  elements.mobileSidebarOverlay.classList.toggle('active', state.isMobileMenuOpen);
}

function closeMobileSidebar() {
  state.isMobileMenuOpen = false;
  elements.mobileSidebar.classList.remove('active');
  elements.mobileSidebarOverlay.classList.remove('active');
}

// Filter and Render Links
function getFilteredLinks() {
  return state.links.filter((link) => {
    const matchesSearch =
      link.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      link.contributor?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      link.tags?.some((tag) =>
        tag.toLowerCase().includes(state.searchQuery.toLowerCase()),
      );
    const matchesCategory =
      state.activeCategory === 'All' || link.category === state.activeCategory;
    const matchesTag = state.activeTag === null || link.tags?.includes(state.activeTag);
    return matchesSearch && matchesCategory && matchesTag;
  });
}

function renderLinks() {
  const filteredLinks = getFilteredLinks();
  
  // Update header
  const title = state.activeCategory === 'All' ? 'Timeline' : state.activeCategory;
  elements.contentTitle.textContent = title;
  
  // Update active tag display
  if (state.activeTag) {
    elements.activeTagContainer.style.display = 'inline-flex';
    elements.activeTagText.textContent = state.activeTag;
  } else {
    elements.activeTagContainer.style.display = 'none';
  }

  // Update entry count
  elements.entryCount.textContent = filteredLinks.length;
  elements.entryLabel.textContent = filteredLinks.length === 1 ? 'entry' : 'entries';

  if (filteredLinks.length === 0) {
    elements.linksContainer.innerHTML = '';
    elements.emptyState.style.display = 'flex';
    if (state.activeTag) {
      elements.emptyStateMessage.innerHTML = `
        <button class="empty-state-clear-tag">Clear tag filter</button>
      `;
      elements.emptyStateMessage.querySelector('.empty-state-clear-tag').addEventListener('click', () => {
        state.activeTag = null;
        renderLinks();
      });
      } else {
      elements.emptyStateMessage.innerHTML = `Press <kbd>Ctrl+K</kbd> to add a new link`;
    }
  } else {
    elements.linksContainer.innerHTML = '';
    elements.emptyState.style.display = 'none';

    filteredLinks.forEach((link, index) => {
      const isLast = index === filteredLinks.length - 1;
      const linkEl = createLinkCard(link, index, isLast);
      elements.linksContainer.appendChild(linkEl);
    });
  }

  renderSidebar();
}

function createLinkCard(link, index, isLast) {
  const card = document.createElement('div');
  card.className = `link-card ${isLast ? 'last' : ''}`;
  card.style.animationDelay = `${index * 0.1}s`;

  // Format date
  const date = new Date(link.createdAt);
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
  }).format(date);
  const yearStr = date.getFullYear();

  const tagsHTML = link.tags?.map((tag) => `
    <button class="link-tag ${state.activeTag === tag ? 'active' : ''}" data-tag="${tag}">
      ${tag}
    </button>
  `).join('') || '';

  const hasSubEntries = (link.subEntries || []).length > 0;
  const subEntriesHTML = (link.subEntries || []).map((s) => `
    <div class="sub-entry-item" data-sub-id="${s.id}">
      <div class="sub-entry-row">
        <a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer" class="sub-entry-title">${escapeHTML(s.title || s.url)}</a>
      </div>
      ${s.summary ? `<div class="sub-entry-summary ${s.isError ? 'error' : ''}">${escapeHTML(stripTags(s.summary))}</div>` : ''}
    </div>
  `).join('');

  card.innerHTML = `
    <div class="link-timeline">
      <div class="link-date">${dateStr}</div>
      <div class="link-year">${yearStr}</div>
      <div class="link-dot"></div>
      ${!isLast ? '<div class="link-line"></div>' : ''}
    </div>
    <div class="link-content">
      <div class="link-card-box">
        <div class="link-card-header">
          <div>
            ${hasSubEntries ? `<h3 class="link-title">${escapeHTML(link.title)}</h3>` : `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" class="link-title-link">${escapeHTML(link.title)}</a>`}
            ${link.contributor ? `<div class="link-contributor">${escapeHTML(link.contributor)}</div>` : ''}
          </div>
          <div class="link-actions">
            <button class="link-action-btn edit" data-id="${link.id}" aria-label="Edit link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
            <a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" class="link-action-btn" aria-label="Open link" ${hasSubEntries ? 'style="display: none;"' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
            <button class="link-action-btn summarize" data-id="${link.id}" aria-label="Summarize link" title="Summarize">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2 L12 12 M2 12 L22 12"></path>
              </svg>
            </button>
            <button class="link-action-btn delete" data-id="${link.id}" aria-label="Delete link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        ${hasSubEntries ? `<div class="link-subentries">${subEntriesHTML}</div>` : ''}
        ${link.summary ? `<div class="link-summary ${link.isError ? 'error' : ''}">${escapeHTML(stripTags(link.summary))}</div>` : ''}
        <div class="link-tags">${tagsHTML}</div>
        ${(!hasSubEntries && link.url) ? `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" class="link-card-overlay">
          <span class="sr-only">Open ${escapeHTML(link.title)}</span>
        </a>` : ''}
      </div>
    </div>
  `;

  // Event listeners
  card.querySelector('.link-action-btn.edit').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.editingId = link.id;
    openModal();
  });
  card.querySelector('.link-action-btn.delete').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteLink(link.id);
  });

  const summarizeBtn = card.querySelector('.link-action-btn.summarize');
  if (summarizeBtn) {
    summarizeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const hasSubEntries = (link.subEntries || []).length > 0;
      if (hasSubEntries) {
        handleSummarizeMultiEntry(link.id, summarizeBtn);
      } else {
        handleSummarize(link.id, summarizeBtn);
      }
    });
  }

  card.querySelectorAll('.link-tag').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      state.activeTag = btn.dataset.tag;
      renderLinks();
    });
  });

  // Link main summarize (text button)
  const linkSummBtn = card.querySelector('.link-summarize-btn');
  if (linkSummBtn) {
    linkSummBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const hasSubEntries = (link.subEntries || []).length > 0;
      if (hasSubEntries) {
        handleSummarizeMultiEntry(link.id, linkSummBtn);
      } else {
        handleSummarize(link.id, linkSummBtn);
      }
    });
  }

  // Removed Paste Content feature

  return card;
}

function deleteLink(id) {
  state.links = state.links.filter((link) => link.id !== id);
  saveLinksToStorage();
  renderLinks();
}

// Multi-entry summarization - summarizes all sub-entries at once
async function handleSummarizeMultiEntry(linkId, btn) {
  const link = state.links.find((l) => l.id === linkId);
  if (!link || !link.subEntries || link.subEntries.length === 0) return;

  // Check if any summaries exist
  const hasSummaries = link.subEntries.some(s => s.summary);
  if (hasSummaries) {
    const ok = confirm('Summaries exist for some sub-entries. Regenerate all?');
    if (!ok) return;
  }

  const originalInner = btn ? btn.innerHTML : null;
  const originalTitle = btn ? (btn.getAttribute('title') || 'Summarize') : null;
  
  try {
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'wait';
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2 A10 10 0 0 1 22 12" stroke-linecap="round"></path>
        </svg>
      `;
      btn.setAttribute('title', 'Summarizing all entries...');
    }

    // Summarize all sub-entries in parallel
    const summaryPromises = link.subEntries.map(async (sub) => {
      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sub.url }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Summarization failed');

        let summary = stripTags((data.summary || '').trim());
        if (!summary && data.excerpt) {
          summary = data.excerpt.trim();
        }
        if (!summary) {
          summary = 'Unable to generate summary.';
        }
        
        sub.summary = summary;
        sub.isError = false;
        return { success: true, title: sub.title };
      } catch (err) {
        console.error(`Failed to summarize ${sub.title}:`, err);
        sub.summary = `Failed to generate summary: ${err.message || err}`;
        sub.isError = true;
        return { success: false, title: sub.title, error: err.message || String(err) };
      }
    });

    const results = await Promise.all(summaryPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    saveLinksToStorage();
    renderLinks();
    if (failCount > 0) {
      alert(`Summarized ${successCount} entries. ${failCount} failed. Some URLs may block fetching.`);
    }
    
  } catch (err) {
    console.error('Multi-entry summarization error', err);
    alert('Failed to summarize entries: ' + (err.message || err));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
      btn.innerHTML = originalInner || 'Summarize';
      btn.setAttribute('title', originalTitle || 'Summarize');
    }
  }
}

async function handleSummarize(id, btn) {
  const link = state.links.find((l) => l.id === id);
  if (!link) return;

  // If a summary already exists, ask user before overwriting
  if (link.summary) {
    const ok = confirm('A summary already exists. Do you want to regenerate it?');
    if (!ok) return;
  }

  const originalInner = btn ? btn.innerHTML : null;
  const originalTitle = btn ? (btn.getAttribute('title') || 'Summarize') : null;
  try {
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'wait';
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2 A10 10 0 0 1 22 12" stroke-linecap="round"></path>
        </svg>
      `;
      btn.setAttribute('title', 'Summarizing...');
    }

    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: link.url }),
    });
    const data = await response.json();

    console.log('Summarize response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Summarization failed');
    }

    // Save summary - trim whitespace and fallback to excerpt or message
    let summary = stripTags((data.summary || '').trim());
    
    // If summary is empty, try excerpt
    if (!summary && data.excerpt) {
      summary = data.excerpt.trim();
    }
    
    // If still empty, show a message
    if (!summary) {
      summary = 'Unable to generate summary. This site may block content extraction. Try a different URL.';
    }
    
    link.summary = summary;
    console.log('Updated link summary:', link.summary);
    saveLinksToStorage();
    renderLinks();
  } catch (err) {
    console.error('Summarize error', err);
    // Persist a visible failure message on the card
    link.summary = `Failed to generate summary: ${err.message || err}`;
    link.isError = true;
    saveLinksToStorage();
    renderLinks();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
      btn.innerHTML = originalInner || 'Summarize';
      btn.setAttribute('title', originalTitle || 'Summarize');
    }
  }
}

async function handleSummarizeSubEntry(linkId, subEntryId, btn) {
  const link = state.links.find((l) => l.id === linkId);
  if (!link) return;
  const sub = (link.subEntries || []).find((s) => s.id === subEntryId);
  if (!sub) return;

  if (sub.summary) {
    const ok = confirm('A summary for this sub-entry exists. Regenerate?');
    if (!ok) return;
  }

  const original = btn ? btn.innerHTML : null;
  const originalTitle = btn ? (btn.getAttribute('title') || 'Summarize') : null;
  try {
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'wait';
      btn.innerHTML = '⏳';
      btn.setAttribute('title', 'Summarizing...'); 
    }

    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sub.url }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Summarization failed');

    // Save summary - trim whitespace and fallback to excerpt or message
    let summary = stripTags((data.summary || '').trim());
    
    if (!summary && data.excerpt) {
      summary = data.excerpt.trim();
    }
    
    if (!summary) {
      summary = 'Unable to generate summary. This site may block content extraction.';
    }
    
    sub.summary = summary;
    saveLinksToStorage();
    renderLinks();
  } catch (err) {
    console.error('Sub-entry summarization error', err);
    alert('Failed to summarize sub-entry: ' + (err.message || err));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
      btn.innerHTML = original || 'Summarize';
      btn.setAttribute('title', originalTitle || 'Summarize');
    }
  }
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
