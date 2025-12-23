// Production-Ready Smart Campus Issue Reporting System
// Modular Architecture with enhanced error handling and performance

// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

const CONFIG = {
  // Firebase Configuration
  firebase: {
    apiKey: "AIzaSyA2n_cLQICWqU7qqk1YZhuW9MRpRgVE2Ak",
    authDomain: "smart-campus-issue-reporting.firebaseapp.com",
    projectId: "smart-campus-issue-reporting",
    storageBucket: "smart-campus-issue-reporting.firebasestorage.app",
    messagingSenderId: "998268306338",
    appId: "1:998268306338:web:eb393948a825999246e8fb",
    measurementId: "G-P99SE8185H"
  },
  
  // Application Settings
  app: {
    maxTitleLength: 100,
    maxDescriptionLength: 1000,
    minTitleLength: 3,
    minDescriptionLength: 10,
    passwordMinLength: 6,
    maxIssuesPerPage: 100,
    notificationTimeout: 5000,
    searchDebounceDelay: 300
  },
  
  // Error Messages
  errors: {
    required: "This field is required",
    invalidEmail: "Please enter a valid email address",
    weakPassword: "Password must be at least 6 characters long",
    invalidTitle: "Title must be between 3-100 characters",
    invalidDescription: "Description must be between 10-1000 characters",
    invalidUrl: "Please enter a valid URL",
    networkError: "Network error. Please check your connection.",
    systemError: "System error. Please refresh the page.",
    permissionDenied: "You don't have permission to perform this action",
    unauthorized: "Please login to continue",
    notFound: "Requested resource not found"
  }
};

// ========================================
// APPLICATION STATE MANAGEMENT
// ========================================

class AppState {
  constructor() {
    this.currentUser = null;
    this.currentUserRole = null;
    this.isLoading = false;
    this.issues = [];
    this.filteredIssues = [];
    this.currentFilter = '';
    this.searchTerm = '';
    this.subscribers = new Set();
  }

  // State management
  setUser(user) {
    this.currentUser = user;
    this.notifySubscribers('userChanged', user);
  }

  setUserRole(role) {
    this.currentUserRole = role;
    this.notifySubscribers('roleChanged', role);
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    this.notifySubscribers('loadingChanged', isLoading);
  }

  setIssues(issues) {
    this.issues = issues;
    this.applyFilters();
  }

  addIssue(issue) {
    this.issues.unshift(issue);
    this.applyFilters();
  }

  updateIssue(issueId, updates) {
    const index = this.issues.findIndex(issue => issue.id === issueId);
    if (index !== -1) {
      this.issues[index] = { ...this.issues[index], ...updates };
      this.applyFilters();
    }
  }

  // Filtering and search
  applyFilters() {
    let filtered = [...this.issues];

    // Apply status filter
    if (this.currentFilter) {
      filtered = filtered.filter(issue => issue.status === this.currentFilter);
    }

    // Apply search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(term) ||
        issue.description.toLowerCase().includes(term)
      );
    }

    this.filteredIssues = filtered;
    this.notifySubscribers('issuesChanged', filtered);
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.applyFilters();
  }

  setSearchTerm(term) {
    this.searchTerm = term;
    this.applyFilters();
  }

  // Subscription system
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  // Utility methods
  get isLoggedIn() {
    return !!this.currentUser;
  }

  get isAdmin() {
    return this.currentUserRole === 'admin';
  }

  get isStudent() {
    return this.currentUserRole === 'student';
  }

  // Statistics
  getIssueStats() {
    const stats = {
      total: this.issues.length,
      pending: 0,
      progress: 0,
      resolved: 0
    };

    this.issues.forEach(issue => {
      switch (issue.status) {
        case 'Pending':
          stats.pending++;
          break;
        case 'In Progress':
          stats.progress++;
          break;
        case 'Resolved':
          stats.resolved++;
          break;
      }
    });

    return stats;
  }
}

// Global state instance
const appState = new AppState();

// ========================================
// THEME MANAGEMENT
// ========================================

class ThemeController {
  constructor() {
    this.currentTheme = this.getStoredTheme();
    this.themeToggle = document.getElementById('themeToggle');
    
    // Initialize theme
    this.initializeTheme();
    this.setupEventListeners();
  }

  getStoredTheme() {
    return localStorage.getItem('campusTheme') || 'light';
  }

  initializeTheme() {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    
    // Update toggle icon
    this.updateToggleIcon();
    
    // Listen for system theme changes if user hasn't set a preference
    if (!localStorage.getItem('campusTheme')) {
      this.listenForSystemThemeChanges();
    }
  }

  setupEventListeners() {
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Keyboard accessibility
    if (this.themeToggle) {
      this.themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }
  }

  listenForSystemThemeChanges() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (!localStorage.getItem('campusTheme')) {
        this.currentTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateToggleIcon();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    handleChange(mediaQuery); // Initial check
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    
    // Store preference
    localStorage.setItem('campusTheme', this.currentTheme);
    
    // Update toggle icon
    this.updateToggleIcon();
    
    // Show notification
    if (window.notifications) {
      window.notifications.success(
        `Switched to ${this.currentTheme} mode`,
        'Theme Changed',
        { duration: 2000 }
      );
    }
    
    console.log(`Theme switched to: ${this.currentTheme}`);
  }

  updateToggleIcon() {
    if (!this.themeToggle) return;
    
    const icon = this.themeToggle.querySelector('i');
    if (!icon) return;
    
    if (this.currentTheme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusTheme', theme);
    this.updateToggleIcon();
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

class Utils {
  // Input validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    return password && password.length >= CONFIG.app.passwordMinLength;
  }

  static validateTitle(title) {
    const trimmed = title.trim();
    return trimmed.length >= CONFIG.app.minTitleLength && 
           trimmed.length <= CONFIG.app.maxTitleLength;
  }

  static validateDescription(description) {
    const trimmed = description.trim();
    return trimmed.length >= CONFIG.app.minDescriptionLength && 
           trimmed.length <= CONFIG.app.maxDescriptionLength;
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Sanitization
  static sanitizeInput(input) {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Time formatting
  static getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const time = timestamp.toDate();
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  // Debouncing
  static debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }

  // Retry mechanism
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries) throw error;
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================

class NotificationManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create notification container if it doesn't exist
    this.container = document.querySelector('.notification-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'notification-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
      `;
      document.body.appendChild(this.container);
    }
  }

  show(message, type = "info", duration = CONFIG.app.notificationTimeout) {
    this.removeExisting();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    
    this.container.appendChild(notification);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, duration);
    }

    return notification;
  }

  success(message, duration) {
    return this.show(message, "success", duration);
  }

  error(message, duration) {
    return this.show(message, "error", duration);
  }

  info(message, duration) {
    return this.show(message, "info", duration);
  }

  warning(message, duration) {
    return this.show(message, "warning", duration);
  }

  removeExisting() {
    const existing = this.container.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
  }
}

const notifications = new NotificationManager();

// ========================================
// FIREBASE SERVICE
// ========================================

class FirebaseService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.initialized = false;
  }

  static async initialize() {
    const service = new FirebaseService();
    await service.init();
    return service;
  }

  async init() {
    // Wait for Firebase SDK to be available
    let retries = 0;
    const maxRetries = 20;
    
    while (retries < maxRetries) {
      if (typeof firebase !== 'undefined' && firebase.apps) {
        try {
          firebase.initializeApp(CONFIG.firebase);
          this.auth = firebase.auth();
          this.db = firebase.firestore();
          this.initialized = true;
          console.log("Firebase initialized successfully");
          return true;
        } catch (error) {
          console.error("Firebase initialization error:", error);
          notifications.error("System initialization failed. Please refresh the page.");
          return false;
        }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    console.error("Firebase SDK not available after maximum retries");
    notifications.error("Failed to load Firebase SDK. Please check your internet connection.");
    return false;
  }

  // Authentication methods
  async register(email, password, role) {
    if (!this.initialized) throw new Error("Firebase not initialized");
    
    const cred = await this.auth.createUserWithEmailAndPassword(email, password);
    await this.db.collection("users").doc(cred.user.uid).set({
      email: email.trim(),
      role: role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    return cred;
  }

  async login(email, password) {
    if (!this.initialized) throw new Error("Firebase not initialized");
    return await this.auth.signInWithEmailAndPassword(email, password);
  }

  async logout() {
    if (!this.initialized) throw new Error("Firebase not initialized");
    return await this.auth.signOut();
  }

  // Issue management
  async createIssue(issueData) {
    if (!this.initialized) throw new Error("Firebase not initialized");
    
    const docRef = await this.db.collection("issues").add({
      ...issueData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return { id: docRef.id, ...issueData };
  }

  async updateIssueStatus(issueId, status, userId) {
    if (!this.initialized) throw new Error("Firebase not initialized");
    
    return await this.db.collection("issues").doc(issueId).update({
      status: status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId
    });
  }

  // Real-time listeners
  onAuthStateChanged(callback) {
    if (!this.initialized) return () => {};
    
    return this.auth.onAuthStateChanged(async (user) => {
      if (!user) {
        callback(null, null);
        return;
      }

      try {
        const userDoc = await this.db.collection("users").doc(user.uid).get();
        let userData = null;

        if (userDoc.exists) {
          userData = userDoc.data();
          
          // Check if user account is active
          if (userData.isActive === false) {
            await this.logout();
            callback(null, null);
            notifications.error("Your account has been deactivated. Please contact support.");
            return;
          }
        } else {
          // Create basic user entry if doesn't exist
          await this.db.collection("users").doc(user.uid).set({
            email: user.email,
            role: "student",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true
          });
          userData = { role: "student", email: user.email };
        }

        callback(user, userData.role);
      } catch (error) {
        console.error("Error fetching user data:", error);
        notifications.error("Error loading user data. Please refresh the page.");
        callback(null, null);
      }
    });
  }

  startIssuesListener(callback) {
    if (!this.initialized) return () => {};

    return this.db.collection("issues")
      .orderBy("createdAt", "desc")
      .limit(CONFIG.app.maxIssuesPerPage)
      .onSnapshot(
        (snapshot) => {
          const issues = [];
          snapshot.forEach((doc) => {
            issues.push({
              id: doc.id,
              ...doc.data()
            });
          });
          callback(issues);
        },
        (error) => {
          console.error("Issues listener error:", error);
          notifications.error("Failed to load issues. Please refresh the page.");
          callback([]);
        }
      );
  }

  async getUserProfile(userId) {
    if (!this.initialized) throw new Error("Firebase not initialized");
    
    const doc = await this.db.collection("users").doc(userId).get();
    return doc.exists ? doc.data() : null;
  }
}

let firebaseService = null;

// ========================================
// UI CONTROLLER
// ========================================

class UIController {
  constructor() {
    this.elements = {};
    this.init();
  }

  init() {
    // Cache DOM elements
    this.elements = {
      authSection: document.getElementById('authSection'),
      reportingSection: document.getElementById('reportingSection'),
      issuesSection: document.getElementById('issuesSection'),
      userInfo: document.getElementById('userInfo'),
      userEmail: document.getElementById('userEmail'),
      userRole: document.getElementById('userRole'),
      logoutBtn: document.getElementById('logoutBtn'),
      issuesList: document.getElementById('issuesList'),
      pendingCount: document.getElementById('pendingCount'),
      progressCount: document.getElementById('progressCount'),
      resolvedCount: document.getElementById('resolvedCount'),
      totalCount: document.getElementById('totalCount'),
      searchInput: document.getElementById('searchInput'),
      statusFilter: document.getElementById('statusFilter')
    };

    this.setupEventListeners();
    this.setupStateSubscriptions();
  }

  setupEventListeners() {
    // Form submissions
    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
      issueForm.addEventListener('submit', this.handleIssueSubmit.bind(this));
    }

    // Search and filter
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', 
        Utils.debounce((e) => {
          appState.setSearchTerm(e.target.value);
        }, CONFIG.app.searchDebounceDelay)
      );
    }

    if (this.elements.statusFilter) {
      this.elements.statusFilter.addEventListener('change', (e) => {
        appState.setFilter(e.target.value);
      });
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  setupStateSubscriptions() {
    appState.subscribe((event, data) => {
      switch (event) {
        case 'userChanged':
        case 'roleChanged':
          this.updateUIBasedOnAuth();
          break;
        case 'loadingChanged':
          this.updateLoadingState(data);
          break;
        case 'issuesChanged':
          this.updateIssuesDisplay(data);
          this.updateStats();
          break;
      }
    });
  }

  updateUIBasedOnAuth() {
    const { authSection, reportingSection, issuesSection, userInfo, userEmail, userRole } = this.elements;

    if (appState.isLoggedIn) {
      // User is logged in
      authSection.style.display = 'none';
      reportingSection.style.display = 'block';
      userInfo.style.display = 'flex';
      userEmail.textContent = appState.currentUser.email;
      userRole.textContent = appState.currentUserRole.charAt(0).toUpperCase() + appState.currentUserRole.slice(1);

      // Show issues section only for admins
      issuesSection.style.display = appState.isAdmin ? 'block' : 'none';
    } else {
      // User is not logged in
      authSection.style.display = 'block';
      reportingSection.style.display = 'none';
      issuesSection.style.display = 'none';
      userInfo.style.display = 'none';
    }
  }

  updateLoadingState(isLoading) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.disabled = isLoading;
      if (isLoading) {
        btn.dataset.originalText = btn.textContent;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      } else {
        btn.textContent = btn.dataset.originalText || btn.textContent;
      }
    });
  }

  updateIssuesDisplay(issues) {
    const { issuesList } = this.elements;
    
    if (!issuesList) return;

    if (issues.length === 0) {
      issuesList.innerHTML = '<div class="no-issues">No issues found.</div>';
      return;
    }

    issuesList.innerHTML = issues.map(issue => this.createIssueCard(issue)).join('');
  }

  createIssueCard(issue) {
    const timeAgo = Utils.getTimeAgo(issue.createdAt);
    const canUpdateStatus = appState.isAdmin;
    
    return `
      <div class="issue-card" data-status="${issue.status}">
        <div class="issue-header">
          <h3>${Utils.escapeHtml(issue.title)}</h3>
          <span class="issue-time">${timeAgo}</span>
        </div>
        <p class="issue-description">${Utils.escapeHtml(issue.description)}</p>
        ${issue.imageUrl ? `
          <div class="issue-image">
            <a href="${Utils.escapeHtml(issue.imageUrl)}" target="_blank" rel="noopener">
              📷 View Image
            </a>
          </div>
        ` : ""}
        <div class="issue-meta">
          <span class="issue-reporter">👤 ${Utils.escapeHtml(issue.reporterEmail || 'Anonymous')}</span>
          <span class="status status-${issue.status?.toLowerCase().replace(' ', '-')}">
            Status: ${issue.status || 'Pending'}
          </span>
        </div>
        ${canUpdateStatus ? `
          <div class="status-controls">
            <button class="status-btn" onclick="window.updateIssueStatus('${issue.id}', 'In Progress')" 
                    ${issue.status === 'In Progress' ? 'disabled' : ''}>
              In Progress
            </button>
            <button class="status-btn" onclick="window.updateIssueStatus('${issue.id}', 'Resolved')" 
                    ${issue.status === 'Resolved' ? 'disabled' : ''}>
              Resolved
            </button>
            <button class="status-btn" onclick="window.updateIssueStatus('${issue.id}', 'Pending')" 
                    ${issue.status === 'Pending' ? 'disabled' : ''}>
              Reopen
            </button>
          </div>
        ` : ""}
      </div>
    `;
  }

  updateStats() {
    const stats = appState.getIssueStats();
    
    if (this.elements.pendingCount) this.elements.pendingCount.textContent = stats.pending;
    if (this.elements.progressCount) this.elements.progressCount.textContent = stats.progress;
    if (this.elements.resolvedCount) this.elements.resolvedCount.textContent = stats.resolved;
    if (this.elements.totalCount) this.elements.totalCount.textContent = stats.total;
  }

  async handleIssueSubmit(e) {
    e.preventDefault();

    // Check Firebase initialization
    if (!firebaseService || !firebaseService.initialized) {
      notifications.error("System is still loading. Please wait a moment and try again.");
      return;
    }

    if (!appState.isLoggedIn) {
      notifications.error(CONFIG.errors.unauthorized);
      return;
    }

    const formData = new FormData(e.target);
    const title = Utils.sanitizeInput(formData.get('title') || document.getElementById('title').value);
    const description = Utils.sanitizeInput(formData.get('description') || document.getElementById('description').value);
    const imageUrl = (formData.get('imageUrl') || document.getElementById('imageUrl').value).trim();

    // Validation
    if (!Utils.validateTitle(title)) {
      notifications.error(CONFIG.errors.invalidTitle);
      return;
    }

    if (!Utils.validateDescription(description)) {
      notifications.error(CONFIG.errors.invalidDescription);
      return;
    }

    if (imageUrl && !Utils.isValidUrl(imageUrl)) {
      notifications.error(CONFIG.errors.invalidUrl);
      return;
    }

    try {
      appState.setLoading(true);

      const issueData = {
        title,
        description,
        imageUrl: imageUrl || null,
        status: "Pending",
        reporterId: appState.currentUser.uid,
        reporterEmail: appState.currentUser.email
      };

      await firebaseService.createIssue(issueData);
      
      notifications.success("Issue reported successfully!");
      e.target.reset();

    } catch (error) {
      console.error("Error creating issue:", error);
      notifications.error("Failed to save issue. Please try again.");
    } finally {
      appState.setLoading(false);
    }
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (this.elements.searchInput) {
        this.elements.searchInput.focus();
      }
    }

    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === this.elements.searchInput) {
      this.elements.searchInput.value = '';
      appState.setSearchTerm('');
    }
  }

  // Public methods for global access
  showLoading(placeholder = true) {
    if (this.elements.issuesList && placeholder) {
      this.elements.issuesList.innerHTML = `
        <div class="loading-placeholder">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading issues...</p>
        </div>
      `;
    }
  }
}

const uiController = new UIController();

// ========================================
// AUTHENTICATION CONTROLLER
// ========================================

class AuthController {
  constructor() {
    // Don't setup event listeners immediately - wait for Firebase
    this.setupGlobally = this.setupGlobally.bind(this);
  }

  setupGlobally() {
    // Make methods globally accessible only after Firebase is ready
    window.register = () => {
      if (!firebaseService || !firebaseService.initialized) {
        notifications.error("System is still loading. Please wait a moment and try again.");
        return;
      }
      this.register();
    };
    
    window.login = () => {
      if (!firebaseService || !firebaseService.initialized) {
        notifications.error("System is still loading. Please wait a moment and try again.");
        return;
      }
      this.login();
    };
    
    window.logout = () => {
      if (!firebaseService || !firebaseService.initialized) {
        notifications.error("System is still loading. Please wait a moment and try again.");
        return;
      }
      this.logout();
    };
    
    window.updateIssueStatus = (issueId, status) => {
      if (!firebaseService || !firebaseService.initialized) {
        notifications.error("System is still loading. Please wait a moment and try again.");
        return;
      }
      this.updateIssueStatus(issueId, status);
    };
    
    console.log('Global functions registered with safeguards');
  }

  async register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    // Check Firebase initialization
    if (!firebaseService || !firebaseService.initialized) {
      notifications.error("System is still loading. Please wait a moment and try again.");
      return;
    }

    // Input validation
    if (!email || !Utils.validateEmail(email)) {
      notifications.error(CONFIG.errors.invalidEmail);
      return;
    }

    if (!Utils.validatePassword(password)) {
      notifications.error(CONFIG.errors.weakPassword);
      return;
    }

    if (!role) {
      notifications.error("Please select a role");
      return;
    }

    try {
      appState.setLoading(true);
      
      await firebaseService.register(email, password, role);
      
      notifications.success("Registration successful! Please check your email for verification.");
      this.clearAuthForm();
      
    } catch (error) {
      console.error("Registration error:", error);
      this.handleAuthError(error, 'Registration');
    } finally {
      appState.setLoading(false);
    }
  }

  async login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Check Firebase initialization
    if (!firebaseService || !firebaseService.initialized) {
      notifications.error("System is still loading. Please wait a moment and try again.");
      return;
    }

    // Input validation
    if (!email || !Utils.validateEmail(email)) {
      notifications.error(CONFIG.errors.invalidEmail);
      return;
    }

    if (!password) {
      notifications.error(CONFIG.errors.required);
      return;
    }

    try {
      appState.setLoading(true);
      
      await firebaseService.login(email, password);
      
      notifications.success("Login successful!");
      this.clearAuthForm();
      
    } catch (error) {
      console.error("Login error:", error);
      this.handleAuthError(error, 'Login');
    } finally {
      appState.setLoading(false);
    }
  }

  async logout() {
    try {
      appState.setLoading(true);
      
      await firebaseService.logout();
      
      notifications.success("Logged out successfully");
      
    } catch (error) {
      console.error("Logout error:", error);
      notifications.error("Logout failed. Please try again.");
    } finally {
      appState.setLoading(false);
    }
  }

  async updateIssueStatus(issueId, newStatus) {
    // Check Firebase initialization
    if (!firebaseService || !firebaseService.initialized) {
      notifications.error("System is still loading. Please wait a moment and try again.");
      return;
    }

    if (!appState.isAdmin) {
      notifications.error(CONFIG.errors.permissionDenied);
      return;
    }

    try {
      appState.setLoading(true);
      
      await firebaseService.updateIssueStatus(issueId, newStatus, appState.currentUser.uid);
      
      notifications.success(`Issue marked as ${newStatus}`);
      
    } catch (error) {
      console.error("Status update error:", error);
      notifications.error("Failed to update status. Please try again.");
    } finally {
      appState.setLoading(false);
    }
  }

  handleAuthError(error, operation) {
    let errorMessage = `${operation} failed. Please try again.`;
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "Email is already registered. Please use a different email or login.";
        break;
      case 'auth/user-not-found':
        errorMessage = "No account found with this email. Please register first.";
        break;
      case 'auth/wrong-password':
        errorMessage = "Incorrect password. Please try again.";
        break;
      case 'auth/invalid-email':
        errorMessage = "Invalid email address format.";
        break;
      case 'auth/user-disabled':
        errorMessage = "This account has been disabled. Please contact support.";
        break;
      case 'auth/too-many-requests':
        errorMessage = "Too many failed attempts. Please try again later.";
        break;
      case 'auth/network-request-failed':
        errorMessage = CONFIG.errors.networkError;
        break;
      default:
        errorMessage = `${operation} failed: ${error.message}`;
    }
    
    notifications.error(errorMessage);
  }

  clearAuthForm() {
    document.getElementById("email").value = '';
    document.getElementById("password").value = '';
  }
}

const authController = new AuthController();

// ========================================
// APPLICATION INITIALIZER
// ========================================

class AppInitializer {
  constructor() {
    this.init();
  }

  async init() {
    console.log('Smart Campus Issue Reporting System - Production Ready');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.onDOMReady.bind(this));
    } else {
      await this.onDOMReady();
    }
  }

  async onDOMReady() {
    // Update system status to initializing
    this.updateSystemStatus('initializing', 'System initializing...');
    
    // Initialize theme controller first (can work independently)
    console.log('Initializing theme controller...');
    const themeController = new ThemeController();
    
    // Initialize Firebase first
    console.log('Initializing Firebase...');
    const service = await FirebaseService.initialize();
    
    if (!service.initialized) {
      console.error('Firebase initialization failed');
      this.updateSystemStatus('error', 'System initialization failed. Please refresh the page.');
      notifications.error('System initialization failed. Please refresh the page.');
      return;
    }
    
    firebaseService = service;
    console.log('Firebase initialized, setting up application...');
    this.updateSystemStatus('ready', 'System ready! You can now register or login.');
    
    // Setup global functions after Firebase is ready
    authController.setupGlobally();
    
    // Initialize authentication listener
    this.setupAuthListener();
    
    // Setup global error handling
    this.setupErrorHandling();
    
    // Performance monitoring
    this.setupPerformanceMonitoring();
    
    console.log('Application initialized successfully');
  }

  updateSystemStatus(status, message) {
    const statusElement = document.getElementById('systemStatus');
    if (!statusElement) return;
    
    statusElement.className = `system-status ${status}`;
    const icon = statusElement.querySelector('i');
    const text = statusElement.querySelector('span');
    
    // Update icon based on status
    icon.className = 'fas';
    switch (status) {
      case 'initializing':
        icon.classList.add('fa-spinner', 'fa-spin');
        break;
      case 'ready':
        icon.classList.add('fa-check-circle');
        break;
      case 'error':
        icon.classList.add('fa-exclamation-triangle');
        break;
    }
    
    text.textContent = message;
  }

  setupAuthListener() {
    if (!firebaseService.initialized) return;

    const unsubscribe = firebaseService.onAuthStateChanged((user, role) => {
      appState.setUser(user);
      appState.setUserRole(role);

      if (user && role === 'admin') {
        // Start listening for issues if admin
        this.setupIssuesListener();
      } else {
        // Stop listening for issues
        if (this.issuesUnsubscribe) {
          this.issuesUnsubscribe();
          this.issuesUnsubscribe = null;
        }
      }

      // Show role-specific messages
      if (user && role) {
        if (role === 'student') {
          notifications.info("👨‍🎓 Welcome, Student! You can report campus issues.");
        } else if (role === 'admin') {
          notifications.info("🧑‍💼 Welcome, Admin! You can manage all reported issues.");
        }
      }
    });

    // Store unsubscribe function for cleanup
    this.authUnsubscribe = unsubscribe;
  }

  setupIssuesListener() {
    if (this.issuesUnsubscribe) {
      this.issuesUnsubscribe();
    }

    uiController.showLoading();
    this.issuesUnsubscribe = firebaseService.startIssuesListener((issues) => {
      appState.setIssues(issues);
    });
  }

  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      notifications.error(CONFIG.errors.systemError);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      notifications.error(CONFIG.errors.systemError);
    });
  }

  setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
      }
    });
  }

  // Cleanup method
  destroy() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
    if (this.issuesUnsubscribe) {
      this.issuesUnsubscribe();
    }
  }
}

// Initialize the application
const app = new AppInitializer();

// Export for global access (for debugging)
window.app = app;
window.appState = appState;
window.notifications = notifications;
window.firebaseService = firebaseService;
window.uiController = uiController;
window.authController = authController;
