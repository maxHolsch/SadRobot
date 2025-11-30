const SCALE_TYPE = 'scale';
const TEXT_TYPE = 'text';

// Robot tag to identify which version of the robot (sad/happy) this session is using
// Change this to "happy" for the control group branch
const ROBOT_TAG = 'sad';

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
  },
  {
    text: "Please enter your Prolific ID here:",
    type: TEXT_TYPE,
    placeholder: "Enter your Prolific ID here"
  },
];

const baseSurveyPages = [
  {
    title: "Indicate to what extent you feel this way right now.",
    statements: [
      "Inspired",
      "Scared",
      "Excited",
      "Alert",
      "Enthusiastic",
      "Distressed",
      "Afraid",
      "Upset",
      "Determined",
      "Nervous"
    ]
  },
  {
    title: "Please answer the following items based on how you feel at the present moment.",
    statements: [
      "I am feeling optimistic about life’s challenges.",
      "Right now, I expect things to work out for the best.",
      "I am feeling optimistic about my future.",
      "Please select 'disagree'.",
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
      "I have fourteen fingers.",
      "I feel that I'm a person of worth.",
      "I wish I could have more respect for myself.",
      "All in all, I am inclined to think that I am a failure.",
      "I take a positive attitude toward myself."
    ]
  },
  {
    title: "Please indicate how true the following statements are of you using the 5-point response scale.",
    statements: [
      "I recognise when other people are feeling distressed without them having to tell me.",
      "I understand that everyone experiences suffering at some point in their lives.",
      "When someone is going through a difficult time, I feel kindly towards them.",
      "When someone else is upset, I try to stay open to their feelings rather than avoid them.",
      "I have never used a computer.",
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
      "Please select 'agree'.",
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
  title: "In 1 or 2 sentences, tell us about your interaction.",
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
          <h1>${this.mode === 'pre' ? 'Pre-Study Survey' : 'Post-Study Survey'}</h1>
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
      robotTag: ROBOT_TAG,
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
      this.showInstructionsPage();
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

  showInstructionsPage() {
    const surveyContainer = document.getElementById('survey-container');
    
    if (surveyContainer) {
      surveyContainer.style.display = 'none';
    }
    
    // Initialize instructions page
    if (window.initializeInstructions) {
      window.initializeInstructions();
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
          <h1>Thank you for completing the post-study survey! Prolific completion code: C7LT0ZTB </h1>
          <p class="completion-message">
            Thank you for participating in this study! Our team will review your responses and, pending standard quality checks, approve your payment promptly. Your Prolific completion code is: C7LT0ZTB
          </p>
        </div>
        <div class="survey-buttons center">
        </div>
      </div>
    `;

    const mainContent = document.getElementById('main-content');
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

class ConsentForm {
  constructor() {
    this.containerId = 'survey-container';
    this.storageKey = 'consentCompleted';
    this.init();
  }

  init() {
    if (this.checkIfCompleted()) {
      return;
    }
    this.render();
  }

  checkIfCompleted() {
    return localStorage.getItem(this.storageKey) === 'true';
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.style.display = 'flex';

    container.innerHTML = `
      <div class="survey-wrapper consent-form-wrapper">
        <div class="consent-header">
          <h1>CONSENT TO PARTICIPATE IN STUDY</h1>
          <h2 class="study-title">'Sad Robot': Exploring the Benefits of Pro-Social Behavior Towards a Sadness-Simulating AI Chatbot</h2>
        </div>
        
        <div class="consent-content">
          <p class="intro-text">
            You are invited to participate in a research study conducted by <strong>Matti Gruner, Viola Tan, Max Holschneider, and Om Gokhale</strong> from the MIT Media Lab at the Massachusetts Institute of Technology (M.I.T.). This study explores whether providing emotional support to a sadness-simulating AI chatbot yields psychological benefits for human participants, similar to those observed in helping behaviors between humans.
          </p>
          
          <p class="intro-text">
            You have been selected as a possible participant because you are an adult interested in studies of human–computer interaction. Please read the information below and ask any questions you may have before deciding whether to take part.
          </p>

          <div class="consent-section">
            <h3>Overview</h3>
            <ul>
              <li>Participation in this study is voluntary. You may withdraw at any time, for any reason, without penalty.</li>
              <li>The session will last approximately 15 minutes and will take place online.</li>
              <li>During the activity, you will interact with an AI chatbot that either appears sad or happy. Your task is simply to converse with the chatbot as instructed (for example, to comfort it or respond naturally), depending on the condition assigned to you.</li>
            </ul>
          </div>

          <div class="consent-section">
            <h3>Risks, Compensation, & Benefits</h3>
            <ul>
              <li>The study involves minimal risk. Some participants may experience very mild emotional discomfort or frustration when interacting with the chatbot, similar to that experienced in everyday online interactions.</li>
              <li>There are no direct personal benefits to you, outside of potential improvements to emotional state and self esteem. Your participation will contribute to research on how interacting with AI systems may influence human mood, empathy, and self-esteem.</li>
              <li>You will not receive compensation for participation.</li>
            </ul>
          </div>

          <div class="consent-section">
            <h3>Confidentiality and data handling</h3>
            <ul>
              <li>The session will be audio-recorded only to generate anonymized text transcripts.</li>
              <li>Recordings will be immediately deleted after transcription and data processing.</li>
              <li>The following data will be retained: anonymized transcripts, survey responses.</li>
              <li>All data will be stored securely for one year and then permanently deleted.</li>
              <li>Any information that can identify you will remain confidential and disclosed only with your permission or as required by law.</li>
              <li>Your information may be reviewed by authorized MIT representatives to ensure compliance with research policies.</li>
            </ul>
          </div>

          <div class="consent-section">
            <h3>Recording permission</h3>
            <p>Please indicate your permission below. Recordings will only be made for data processing purposes and not for publication or sharing.</p>
            <p><strong>Please check all that apply:</strong></p>
            <div class="checkbox-group">
              <label class="consent-checkbox">
                <input type="checkbox" id="recording-permission" required>
                <span>I give permission for my session to be audio-recorded for transcription.</span>
              </label>
              <label class="consent-checkbox">
                <input type="checkbox" id="recording-understanding" required>
                <span>I understand that audio recordings will be deleted immediately after processing and will not be used in publications.</span>
              </label>
            </div>
          </div>

          <div class="consent-section">
            <h3>Consent statement</h3>
            <p>I understand the procedures described above. My questions have been answered to my satisfaction, and I agree to participate in this study. I have been given a copy of this form.</p>
          </div>

          <form id="consent-form" class="consent-form">
            <div class="form-row">
              <div class="form-field">
                <label for="participant-name">Name of Participant</label>
                <input type="text" id="participant-name" name="participantName" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field signature-field">
                <label for="participant-signature">Signature of Participant</label>
                <div class="signature-container">
                  <canvas id="signature-canvas" width="500" height="150"></canvas>
                  <button type="button" id="clear-signature" class="btn-clear">Clear Signature</button>
                </div>
                <input type="hidden" id="signature-data" name="signatureData" required>
              </div>
              <div class="form-field">
                <label for="participant-date">Date</label>
                <input type="date" id="participant-date" name="participantDate" required>
              </div>
            </div>

            <div class="contact-info">
              <h3>Contact information:</h3>
              <p>If you have questions about this study, please contact:</p>
              <p><strong>Om Gokhale, MIT Media Lab</strong><br>
              Email: <a href="mailto:ogo@mit.edu">ogo@mit.edu</a></p>
              <p>If you feel you have been treated unfairly, or you have questions regarding your rights as a research subject, you may contact:</p>
              <p><strong>Chairman, Committee on the Use of Humans as Experimental Subjects (COUHES)</strong><br>
              Massachusetts Institute of Technology, Room E25-143b<br>
              7 Massachusetts Avenue, Cambridge, MA 02139<br>
              Phone: 617-253-6787</p>
            </div>

            <div class="consent-buttons">
              <button type="submit" class="btn btn-primary" id="consent-submit">I Consent and Agree to Participate</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.initializeSignature();
    this.attachEventListeners();
  }

  initializeSignature() {
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;

    let ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Use fixed logical size for simplicity
    const logicalWidth = 500;
    const logicalHeight = 150;
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas internal size (for high DPI)
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    
    // Set display size (CSS will handle responsive sizing)
    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';
    
    // Scale context to handle high DPI
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getEventPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      // Scale to logical coordinates (context is already scaled by dpr)
      // Use logical dimensions for scaling
      const scaleX = logicalWidth / rect.width;
      const scaleY = logicalHeight / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDrawing = (e) => {
      isDrawing = true;
      const pos = getEventPos(e);
      lastX = pos.x;
      lastY = pos.y;
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const pos = getEventPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
      this.updateSignatureData();
    };

    const stopDrawing = () => {
      if (isDrawing) {
        isDrawing = false;
        this.updateSignatureData();
      }
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startDrawing(e);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      draw(e);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      stopDrawing();
    }, { passive: false });
  }

  updateSignatureData() {
    const canvas = document.getElementById('signature-canvas');
    const signatureData = document.getElementById('signature-data');
    if (canvas && signatureData) {
      signatureData.value = canvas.toDataURL();
    }
  }

  attachEventListeners() {
    const form = document.getElementById('consent-form');
    const clearBtn = document.getElementById('clear-signature');

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const canvas = document.getElementById('signature-canvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const dpr = window.devicePixelRatio || 1;
          // Clear using logical coordinates (since context is scaled)
          ctx.clearRect(0, 0, 500, 150);
          // Reapply drawing properties
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          this.updateSignatureData();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitConsent();
      });
    }
  }

  async submitConsent() {
    const form = document.getElementById('consent-form');
    const formData = new FormData(form);
    
    // Check if signature has been drawn
    const canvas = document.getElementById('signature-canvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Check if there's any non-transparent pixel (signature drawn)
    let hasSignature = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) { // Check alpha channel
        hasSignature = true;
        break;
      }
    }

    if (!hasSignature) {
      alert('Please provide your signature before submitting.');
      return;
    }

    // Get or create session ID
    let sessionId = localStorage.getItem('userSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userSessionId', sessionId);
    }

    const consentData = {
      sessionId: sessionId,
      robotTag: ROBOT_TAG,
      participantName: formData.get('participantName'),
      signatureData: formData.get('signatureData'),
      participantDate: formData.get('participantDate'),
      recordingPermission: document.getElementById('recording-permission').checked,
      recordingUnderstanding: document.getElementById('recording-understanding').checked,
      timestamp: new Date().toISOString()
    };

    try {
      // Store consent data locally
      localStorage.setItem('consentData', JSON.stringify(consentData));
      localStorage.setItem(this.storageKey, 'true');
      
      // Send to server
      try {
        const response = await fetch('/api/submit-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(consentData)
        });

        const result = await response.json();

        if (response.ok) {
          console.log('✅ Consent form submitted successfully:', result);
        } else {
          console.error('❌ Failed to submit consent form:', result);
          // Continue anyway - data is stored locally
        }
      } catch (fetchError) {
        console.error('❌ Error sending consent to server:', fetchError);
        // Continue anyway - data is stored locally
      }

      this.handleCompletion();
    } catch (error) {
      console.error('Error submitting consent:', error);
      alert('There was an error submitting your consent. Please try again.');
    }
  }

  handleCompletion() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.style.display = 'none';
    }
    
    // Initialize the pre-survey
    initializePreSurvey();
  }
}

function initializePreSurvey() {
  window.preSurvey = new Survey('pre');
  if (!window.preSurvey.checkIfCompleted()) {
    window.preSurvey.render();
  }
}

function initializeConsentAndSurvey() {
  const consentForm = new ConsentForm();
  if (consentForm.checkIfCompleted()) {
    initializePreSurvey();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeConsentAndSurvey);
} else {
  initializeConsentAndSurvey();
}

window.startPostSurvey = async function startPostSurvey() {
  if (localStorage.getItem(surveyConfigs.post.storageKey) === 'true') {
    window.dispatchEvent(new CustomEvent(surveyConfigs.post.completionEvent));
    return;
  }

  // Stop voice agent if active before showing survey
  if (window.endVoiceConversation) {
    await window.endVoiceConversation();
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
