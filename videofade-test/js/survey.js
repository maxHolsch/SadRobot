const SCALE_TYPE = 'scale';
const TEXT_TYPE = 'text';

const responseOptions = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" }
];

const qualitativeStatements = [
  {
    text: "How would you describe the robot’s emotional state during your interaction?",
    type: TEXT_TYPE,
    placeholder: "Enter your response here"
  },
  {
    text: "How did that make you feel?",
    type: TEXT_TYPE,
    placeholder: "Enter your response here"
  },
  {
    text: "Did you feel motivated to try to help it? Why or why not?",
    type: TEXT_TYPE,
    placeholder: "Enter your response here"
  },
  {
    text: "Do you think you had any effect on the robot’s mood? How did that feel?",
    type: TEXT_TYPE,
    placeholder: "Enter your response here"
  },
  {
    text: "How realistic or artificial did the robot’s emotional state seem to you?",
    type: TEXT_TYPE,
    placeholder: "Enter your response here"
  }
];

const baseSurveyPages = [
  {
    title: "Indicate the extent you feel this way at the present moment.",
    statements: [
      "Interested",
      "Distressed",
      "Excited",
      "Upset",
      "Strong",
      "Guilty",
      "Scared",
      "Hostile",
      "Enthusiastic",
      "Proud",
      "Irritable",
      "Alert",
      "Ashamed",
      "Inspired",
      "Nervous",
      "Determined",
      "Attentive",
      "Jittery",
      "Active",
      "Afraid"
    ]
  },
  {
    title: "Please answer the following items based on how you feel at the present moment.",
    statements: [
      "I am feeling optimistic about life’s challenges.",
      "Right now, I expect things to work out for the best.",
      "I am feeling optimistic about my future.",
      "The future is looking bright to me.",
      "I am expecting things to turn out well."
    ]
  },
  {
    title: "Please record the answer for each item depending on to what degree you agree with it.",
    statements: [
      "On the whole, I am satisfied with myself.",
      "At times I think I am no good at all.",
      "I feel that I have a number of good qualities.",
      "I am able to do things as well as most other people",
      "I feel I do not have much to be proud of.",
      "I certainly feel useless at times.",
      "I feel that I'm a person of worth.",
      "I wish I could have more respect for myself.",
      "All in all, I am inclined to think that I am a failure.",
      "I take a positive attitude toward myself."
    ]
  },
  {
    title: "Please indicate how true the following statements are of you using the 5-point response scale.",
    statements: [
      "I’m good at recognising when I’m feeling distressed.",
      "I understand that everyone experiences suffering at some point in their lives.",
      "When I’m going through a difficult time, I feel kindly towards myself.",
      "When I’m upset, I try to stay open to my feelings rather than avoid them.",
      "I try to make myself feel better when I’m distressed, even if I can’t do anything about the cause.",
      "I notice when I’m feeling distressed.",
      "I understand that feeling upset at times is part of human nature.",
      "When bad things happen to me, I feel caring towards myself.",
      "I connect with my own distress without letting it overwhelm me.",
      "When I’m going through a difficult time, I try to look after myself.",
      "I’m quick to notice early signs of distress in myself.",
      "Like me, I know that other people also experience struggles in life.",
      "When I'm upset, I try to tune in to how I'm feeling.",
      "I connect with my own suffering without judging myself.",
      "When I’m upset, I try to do what’s best for myself.",
      "I recognise signs of suffering in myself.",
      "I know that we can all feel distressed when things don’t go well in our lives.",
      "Even when I'm disappointed with myself, I can feel warmly towards myself when I'm in distress.",
      "When I’m upset, I can let the emotions be there without feeling overwhelmed.",
      "When I’m upset, I do my best to take care of myself."
    ]
  },
  {
    title: "Please indicate how true the following statements are of you using the 5-point response scale.",
    statements: [
      "I recognise when other people are feeling distressed without them having to tell me.",
      "I understand that everyone experiences suffering at some point in their lives.",
      "When someone is going through a difficult time, I feel kindly towards them.",
      "When someone else is upset, I try to stay open to their feelings rather than avoid them.",
      "When others are struggling, I try to do things that would be helpful.",
      "I notice when others are feeling distressed.",
      "I understand that feeling upset at times is part of human nature.",
      "When I hear about bad things happening to other people, I feel concern for their wellbeing.",
      "I stay with and listen to other people when they’re upset even if it’s hard to bear.",
      "When someone is going through a difficult time, I try to look after them.",
      "I’m quick to notice early signs of distress in others.",
      "Like me, I know that other people also experience struggles in life.",
      "When someone is upset, I try to tune in to how they’re feeling.",
      "I connect with the suffering of others without judging them.",
      "When I see someone in need, I try to do what’s best for them.",
      "I recognise signs of suffering in others.",
      "I know that we can all feel upset at times when we are wronged.",
      "I’m sensitive to other people’s distress.",
      "When someone else is upset, I can be there for them without feeling overwhelmed by their distress.",
      "When I see that someone is upset, I do my best to take care of them."
    ]
  }
];

const buildSurveyPages = (pages) => pages.map((page, index) => ({
  page: index + 1,
  title: page.title,
  statements: page.statements.map((statement) => ({
    text: statement,
    type: SCALE_TYPE
  }))
}));

const preSurveyData = buildSurveyPages(baseSurveyPages);
const postSurveyData = buildSurveyPages(baseSurveyPages);
postSurveyData.push({
  page: postSurveyData.length + 1,
  title: "Tell us about your interaction with Sad Robot.",
  statements: qualitativeStatements
});

const surveyConfigs = {
  pre: {
    surveyType: 'pre',
    data: preSurveyData,
    storageKey: 'surveyCompleted',
    storageTimestampKey: 'surveyCompletionTime',
    completionEvent: 'surveyCompleted'
  },
  post: {
    surveyType: 'post',
    data: postSurveyData,
    storageKey: 'postSurveyCompleted',
    storageTimestampKey: 'postSurveyCompletionTime',
    completionEvent: 'postSurveyCompleted'
  }
};

class Survey {
  constructor(mode = 'pre') {
    if (!surveyConfigs[mode]) {
      throw new Error(`Unknown survey mode: ${mode}`);
    }

    this.mode = mode;
    this.config = surveyConfigs[mode];
    this.surveyData = this.config.data;
    this.currentPage = 0;
    this.responses = {};
    this.startTime = Date.now();
    this.containerId = 'survey-container';
    this.init();
  }

  init() {
    this.surveyData.forEach((page, pageIndex) => {
      page.statements.forEach((statement, statementIndex) => {
        const key = this.getResponseKey(pageIndex, statementIndex);
        this.responses[key] = null;
      });
    });
  }

  getResponseKey(pageIndex, statementIndex) {
    return `page${pageIndex + 1}_statement${statementIndex + 1}`;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.style.display = 'flex';

    const currentPageData = this.surveyData[this.currentPage];
    const totalPages = this.surveyData.length;
    const isLastPage = this.currentPage === totalPages - 1;
    
    // Check if this page contains only qualitative (text) questions
    const isQualitativePage = currentPageData.statements.every(stmt => stmt.type === TEXT_TYPE);

    container.innerHTML = `
      <div class="survey-wrapper">
        <div class="survey-header">
          <h1>${this.mode === 'pre' ? 'Sad Robot Pre-Study Survey' : 'Sad Robot Post-Study Survey'}</h1>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((this.currentPage + 1) / totalPages) * 100}%"></div>
          </div>
          <p class="page-indicator">Page ${this.currentPage + 1} of ${totalPages}</p>
        </div>
        
        <div class="survey-content">
          <h2 class="page-title">${currentPageData.title}</h2>
          
          <form id="survey-form" class="survey-form">
            ${isQualitativePage ? `
              <!-- Qualitative questions layout (no table headers) -->
              <div class="qualitative-questions-container">
                ${currentPageData.statements.map((statementConfig, index) => `
                  <div class="qualitative-question-item">
                    <label class="qualitative-question-label">
                      <span class="qualitative-question-text">${statementConfig.text}</span>
                      <textarea
                        class="qualitative-textarea"
                        name="statement_${index}"
                        rows="5"
                        placeholder="${statementConfig.placeholder || 'Share your thoughts...'}"
                        required
                      ></textarea>
                    </label>
                  </div>
                `).join('')}
              </div>
            ` : `
              <!-- Scale questions layout (with table) -->
              <div class="table-wrapper">
                <table class="survey-table">
                  <thead>
                    <tr>
                      <th class="statement-header">Statement</th>
                      ${responseOptions.map(option => `
                        <th class="option-header">${option.label}</th>
                      `).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${currentPageData.statements.map((statementConfig, index) => `
                      <tr class="statement-row">
                        <td class="statement-cell">${statementConfig.text}</td>
                        ${responseOptions.map(option => `
                          <td class="option-cell">
                            <label class="radio-label">
                              <input 
                                type="radio" 
                                name="statement_${index}" 
                                value="${option.value}"
                                required
                              />
                              <span class="radio-custom"></span>
                            </label>
                          </td>
                        `).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
            
            <div class="survey-buttons">
              ${this.currentPage > 0 ? `
                <button type="button" class="btn btn-secondary" id="prev-btn">Previous</button>
              ` : ''}
              <button type="submit" class="btn btn-primary" id="next-btn">
                ${isLastPage ? 'Submit Survey' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.restorePageResponses();
  }

  attachEventListeners() {
    const form = document.getElementById('survey-form');
    const prevBtn = document.getElementById('prev-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.goToPreviousPage());
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCurrentPageResponses();
      
      if (this.currentPage < this.surveyData.length - 1) {
        this.goToNextPage();
      } else {
        this.submitSurvey();
      }
    });
  }

  saveCurrentPageResponses() {
    const form = document.getElementById('survey-form');
    const formData = new FormData(form);
    const currentPageData = this.surveyData[this.currentPage];

    currentPageData.statements.forEach((statementConfig, index) => {
      const key = this.getResponseKey(this.currentPage, index);
      const value = formData.get(`statement_${index}`);
      if (value === null) {
        return;
      }

      if (statementConfig.type === TEXT_TYPE) {
        this.responses[key] = value.trim();
      } else {
        this.responses[key] = parseInt(value, 10);
      }
    });
  }

  goToNextPage() {
    if (this.currentPage < this.surveyData.length - 1) {
      this.currentPage++;
      this.render();
    }
  }

  goToPreviousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.render();
    }
  }

  restorePageResponses() {
    const form = document.getElementById('survey-form');
    if (!form) return;

    const currentPageData = this.surveyData[this.currentPage];

    currentPageData.statements.forEach((statementConfig, index) => {
      const key = this.getResponseKey(this.currentPage, index);
      const value = this.responses[key];
      if (value === null || value === undefined) {
        return;
      }

      if (statementConfig.type === TEXT_TYPE) {
        const textarea = form.querySelector(`textarea[name="statement_${index}"]`);
        if (textarea) {
          textarea.value = value;
        }
        return;
      }

      const radio = form.querySelector(`input[name="statement_${index}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
      }
    });
  }

  async submitSurvey() {
    const submitBtn = document.getElementById('next-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Get or create session ID to link pre and post surveys
    let sessionId = localStorage.getItem('userSessionId');
    if (!sessionId) {
      // Generate a unique session ID
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userSessionId', sessionId);
    }

    const submissionData = {
      sessionId: sessionId,
      responses: this.responses,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      userAgent: navigator.userAgent,
      surveyType: this.config.surveyType,
      mode: this.mode,
      pageData: this.surveyData.map((page, pageIndex) => ({
        page: pageIndex + 1,
        title: page.title,
        statements: page.statements.map((stmt, stmtIndex) => ({
          statement: stmt.text,
          type: stmt.type,
          response: this.responses[this.getResponseKey(pageIndex, stmtIndex)]
        }))
      }))
    };

    try {
      const response = await fetch('/api/submit-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      localStorage.setItem(this.config.storageKey, 'true');
      localStorage.setItem(this.config.storageTimestampKey, Date.now().toString());

      this.handleCompletion();
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('There was an error submitting your survey. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Survey';
    }
  }

  handleCompletion() {
    if (this.mode === 'pre') {
      this.showMainPage();
    } else {
      this.showPostCompletion();
    }

    if (window.onSurveyComplete && this.mode === 'pre') {
      window.onSurveyComplete();
    }

    if (this.config.completionEvent) {
      window.dispatchEvent(new CustomEvent(this.config.completionEvent));
    }
  }

  showMainPage() {
    const surveyContainer = document.getElementById('survey-container');
    const mainContent = document.getElementById('main-content');
    
    if (surveyContainer) {
      surveyContainer.style.display = 'none';
    }
    
    if (mainContent) {
      mainContent.style.display = 'block';
    }
  }

  showPostCompletion() {
    const surveyContainer = document.getElementById(this.containerId);
    if (!surveyContainer) return;

    surveyContainer.innerHTML = `
      <div class="survey-wrapper post-survey-completion">
        <div class="survey-header">
          <h1>Thank you for completing the post-study survey!</h1>
          <p class="completion-message">
            Your insights help us understand how Sad Robot resonated with you.
          </p>
        </div>
        <div class="survey-buttons center">
          <button type="button" class="btn btn-primary" id="return-to-experience">
            Return to Interaction
          </button>
        </div>
      </div>
    `;

    const mainContent = document.getElementById('main-content');
    const returnBtn = document.getElementById('return-to-experience');

    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        surveyContainer.style.display = 'none';
        if (mainContent) {
          mainContent.style.display = 'block';
        }
      });
    }
  }

  checkIfCompleted() {
    const completed = localStorage.getItem(this.config.storageKey);
    if (completed === 'true') {
      if (this.mode === 'pre') {
        this.showMainPage();
      }
      return true;
    }
    return false;
  }
}

function initializePreSurvey() {
  window.preSurvey = new Survey('pre');
  if (!window.preSurvey.checkIfCompleted()) {
    window.preSurvey.render();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePreSurvey);
} else {
  initializePreSurvey();
}

window.startPostSurvey = function startPostSurvey() {
  if (localStorage.getItem(surveyConfigs.post.storageKey) === 'true') {
    window.dispatchEvent(new CustomEvent(surveyConfigs.post.completionEvent));
    return;
  }

  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.style.display = 'none';
  }

  window.postSurvey = new Survey('post');
  window.postSurvey.render();

  const surveyContainer = document.getElementById('survey-container');
  if (surveyContainer) {
    surveyContainer.scrollTop = 0;
  }
};

export { Survey, preSurveyData, postSurveyData };
