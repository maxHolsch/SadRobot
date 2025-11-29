// Instructions Page Logic
class InstructionsPage {
  constructor() {
    this.containerId = 'instructions-container';
    this.contentUrl = 'instructions.html';
  }

  async init() {
    await this.render();
  }

  async render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error('Instructions container not found');
      return;
    }

    try {
      // Fetch the instructions HTML content
      const response = await fetch(this.contentUrl);
      if (!response.ok) {
        throw new Error('Failed to load instructions');
      }
      
      const html = await response.text();
      container.innerHTML = html;
      container.style.display = 'flex';

      // Attach event listeners after content is loaded
      this.attachEventListeners();
      
      // Set up window size detection
      this.setupWindowSizeDetection();
      
      // Scroll to top
      container.scrollTop = 0;
    } catch (error) {
      console.error('Error loading instructions:', error);
      // If loading fails, skip to main content
      this.handleCompletion();
    }
  }

  setupWindowSizeDetection() {
    const MIN_WIDTH = 700;
    const warningElement = document.getElementById('window-size-warning');
    const mainContentElement = document.getElementById('instructions-main-content');
    
    if (!warningElement || !mainContentElement) {
      console.warn('Warning or main content elements not found');
      return;
    }

    const checkWindowSize = () => {
      const windowWidth = window.innerWidth;
      
      if (windowWidth < MIN_WIDTH) {
        // Show warning, hide main content
        warningElement.style.display = 'block';
        mainContentElement.style.display = 'none';
      } else {
        // Hide warning, show main content
        warningElement.style.display = 'none';
        mainContentElement.style.display = 'flex';
      }
    };

    // Check on load
    checkWindowSize();

    // Check on resize
    window.addEventListener('resize', checkWindowSize);
  }

  attachEventListeners() {
    const startBtn = document.getElementById('start-interaction-btn');
    
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.completeInstructions();
      });
    }
  }

  completeInstructions() {
    // Hide instructions container
    const container = document.getElementById(this.containerId);
    if (container) {
      container.style.display = 'none';
    }
    
    this.handleCompletion();
  }

  handleCompletion() {
    // Show main content and initialize the application
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.display = 'block';
    }

    // Trigger custom event for other modules to listen to
    window.dispatchEvent(new CustomEvent('instructionsComplete'));
    
    // Call the global initialization function if it exists
    if (window.onInstructionsComplete) {
      window.onInstructionsComplete();
    }
  }
}

// Function to initialize instructions page
function initializeInstructions() {
  window.instructionsPage = new InstructionsPage();
  window.instructionsPage.init();
}

// Export for use in other modules
export { InstructionsPage, initializeInstructions };
