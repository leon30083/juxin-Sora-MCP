// Application State
const state = {
    ws: null,
    activeTab: 'video',
    tasks: new Map(),
    activeTasksCount: 0,
    uploadedImages: [],
    currentTaskId: null
};

// DOM Elements
const elements = {
    // Tab navigation
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Video generation
    videoForm: document.getElementById('video-form'),
    videoPrompt: document.getElementById('video-prompt'),
    videoOrientation: document.getElementById('video-orientation'),
    videoSize: document.getElementById('video-size'),
    videoWatermark: document.getElementById('video-watermark'),
    videoPrivate: document.getElementById('video-private'),
    videoImages: document.getElementById('video-images'),
    fileUploadArea: document.getElementById('file-upload-area'),
    uploadedImages: document.getElementById('uploaded-images'),
    videoPreview: document.getElementById('video-preview'),
    generatedVideo: document.getElementById('generated-video'),
    downloadLink: document.getElementById('download-link'),

    // Character creation
    characterForm: document.getElementById('character-form'),
    characterPrompt: document.getElementById('character-prompt'),
    characterStyle: document.getElementById('character-style'),
    characterPreview: document.getElementById('character-preview'),
    generatedCharacter: document.getElementById('generated-character'),
    downloadCharacter: document.getElementById('download-character'),

    // Tasks management
    refreshTasks: document.getElementById('refresh-tasks'),
    tasksList: document.getElementById('tasks-list'),
    filterBtns: document.querySelectorAll('.filter-btn'),

    // Status
    connectionStatus: document.getElementById('connection-status'),
    activeTasksCount: document.getElementById('active-tasks-count'),

    // Progress modal
    progressModal: document.getElementById('progress-modal'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    progressStatus: document.getElementById('progress-status'),
    cancelTask: document.getElementById('cancel-task')
};

// Initialize WebSocket connection
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionStatus(true);
    };

    state.ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(initWebSocket, 3000);
    };

    state.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };

    state.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
}

// Handle WebSocket messages
function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'init':
            if (message.data.tasks) {
                message.data.tasks.forEach(task => {
                    state.tasks.set(task.id, task);
                });
                updateTasksList();
                updateActiveTasksCount();
            }
            break;

        case 'taskCreated':
            state.tasks.set(message.data.taskId, {
                id: message.data.taskId,
                type: message.data.type,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            updateTasksList();
            updateActiveTasksCount();
            showNotification('任务创建成功', 'success');
            break;

        case 'taskUpdated':
            const updatedTask = state.tasks.get(message.data.taskId);
            if (updatedTask) {
                Object.assign(updatedTask, message.data.task);
                updateTasksList();
                updateActiveTasksCount();
            }
            break;

        case 'progress':
            updateProgress(message.data.progress, message.data.status);
            break;

        case 'completed':
            updateProgress(100, '已完成');
            setTimeout(() => {
                hideProgressModal();
                handleTaskCompletion(message.data);
            }, 1500);
            break;

        case 'failed':
            updateProgress(0, '生成失败');
            elements.progressStatus.textContent = message.data.error || '任务失败';
            showNotification('任务失败: ' + (message.data.error || '未知错误'), 'error');
            break;
    }
}

// Update connection status
function updateConnectionStatus(connected) {
    if (connected) {
        elements.connectionStatus.innerHTML = '🟢 已连接';
        elements.connectionStatus.className = 'connection-status connected';
    } else {
        elements.connectionStatus.innerHTML = '🔴 未连接';
        elements.connectionStatus.className = 'connection-status disconnected';
    }
}

// Update active tasks count
function updateActiveTasksCount() {
    const activeTasks = Array.from(state.tasks.values()).filter(
        task => task.status === 'pending' || task.status === 'processing'
    ).length;
    state.activeTasksCount = activeTasks;
    elements.activeTasksCount.textContent = activeTasks;
}

// Tab navigation
elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    // Update tab buttons
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab contents
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    state.activeTab = tabName;

    // Load tasks if switching to tasks tab
    if (tabName === 'tasks') {
        updateTasksList();
    }
}

// File upload handling
setupFileUpload();

function setupFileUpload() {
    const fileInput = elements.videoImages;

    // Handle file selection
    fileInput.addEventListener('change', handleFileSelection);

    // Handle drag and drop
    elements.fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.fileUploadArea.style.borderColor = 'var(--primary-color)';
    });

    elements.fileUploadArea.addEventListener('dragleave', () => {
        elements.fileUploadArea.style.borderColor = 'var(--border-color)';
    });

    elements.fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.fileUploadArea.style.borderColor = 'var(--border-color)';
        handleFiles(e.dataTransfer.files);
    });
}

function handleFileSelection(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                addUploadedImage(e.target.result, file.name);
            };
            reader.readAsDataURL(file);
        }
    });
}

function addUploadedImage(src, name) {
    const imageId = Date.now() + Math.random();
    state.uploadedImages.push({ id: imageId, src, name });

    const imageContainer = document.createElement('div');
    imageContainer.className = 'uploaded-image';
    imageContainer.dataset.imageId = imageId;

    const img = document.createElement('img');
    img.src = src;
    img.alt = name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => removeUploadedImage(imageId);

    imageContainer.appendChild(img);
    imageContainer.appendChild(removeBtn);
    elements.uploadedImages.appendChild(imageContainer);
}

function removeUploadedImage(imageId) {
    state.uploadedImages = state.uploadedImages.filter(img => img.id !== imageId);
    const container = document.querySelector(`[data-image-id="${imageId}"]`);
    if (container) {
        container.remove();
    }
}

// Video form submission
elements.videoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        prompt: elements.videoPrompt.value,
        orientation: elements.videoOrientation.value,
        size: elements.videoSize.value,
        watermark: elements.videoWatermark.checked,
        private: elements.videoPrivate.checked,
        images: state.uploadedImages.map(img => img.src)
    };

    await createVideoTask(formData);
});

// Character form submission
elements.characterForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        prompt: elements.characterPrompt.value,
        style: elements.characterStyle.value
    };

    await createCharacterTask(formData);
});

// Create video task
async function createVideoTask(params) {
    try {
        setFormLoading(elements.videoForm, true);

        const response = await fetch('/api/video/generate-and-follow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const result = await response.json();

        if (result.success) {
            state.currentTaskId = result.taskId;
            showProgressModal();
            subscribeToTask(result.taskId);
        } else {
            throw new Error(result.error || 'Failed to create video task');
        }
    } catch (error) {
        console.error('Create video error:', error);
        showNotification('创建视频失败: ' + error.message, 'error');
    } finally {
        setFormLoading(elements.videoForm, false);
    }
}

// Create character task
async function createCharacterTask(params) {
    try {
        setFormLoading(elements.characterForm, true);

        const response = await fetch('/api/character/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const result = await response.json();

        if (result.success) {
            state.currentTaskId = result.taskId;
            showProgressModal();
            subscribeToTask(result.taskId);
        } else {
            throw new Error(result.error || 'Failed to create character task');
        }
    } catch (error) {
        console.error('Create character error:', error);
        showNotification('创建角色失败: ' + error.message, 'error');
    } finally {
        setFormLoading(elements.characterForm, false);
    }
}

// Set form loading state
function setFormLoading(form, loading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    if (loading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'inline-flex';
        btnLoader.style.display = 'none';
    }
}

// Subscribe to task updates
function subscribeToTask(taskId) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify({
            type: 'subscribeToTask',
            data: { taskId }
        }));
    }
}

// Progress modal
function showProgressModal() {
    elements.progressModal.style.display = 'flex';
    updateProgress(0, '正在处理...');
}

function hideProgressModal() {
    elements.progressModal.style.display = 'none';
}

function updateProgress(progress, status) {
    elements.progressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `${Math.round(progress)}%`;
    elements.progressStatus.textContent = status;
}

// Cancel task
elements.cancelTask.addEventListener('click', () => {
    hideProgressModal();
    showNotification('任务已取消', 'info');
});

// Handle task completion
function handleTaskCompletion(data) {
    const { taskId, videoUrl } = data;

    if (state.activeTab === 'video' && videoUrl) {
        // Show video preview
        elements.generatedVideo.src = videoUrl;
        elements.downloadLink.href = videoUrl;
        elements.videoPreview.style.display = 'block';

        // Scroll to preview
        elements.videoPreview.scrollIntoView({ behavior: 'smooth' });
    } else if (state.activeTab === 'character') {
        // Show character preview
        // Implementation depends on API response
    }

    showNotification('任务完成！', 'success');
}

// Tasks management
elements.refreshTasks.addEventListener('click', async () => {
    await loadTasks();
});

async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        const result = await response.json();

        if (result.success) {
            result.data.forEach(task => {
                state.tasks.set(task.taskId, {
                    id: task.taskId,
                    type: task.type,
                    status: task.status,
                    progress: task.progress,
                    createdAt: task.createdAt
                });
            });
            updateTasksList();
        }
    } catch (error) {
        console.error('Load tasks error:', error);
        showNotification('加载任务失败', 'error');
    }
}

// Filter tasks
elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterTasks(filter);
    });
});

function filterTasks(filter) {
    elements.filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));

    const tasks = Array.from(state.tasks.values());
    const filteredTasks = filter === 'all'
        ? tasks
        : tasks.filter(task => task.status === filter);

    renderTasksList(filteredTasks);
}

function updateTasksList() {
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    filterTasks(activeFilter);
}

function renderTasksList(tasks) {
    if (tasks.length === 0) {
        elements.tasksList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无任务</p>';
        return;
    }

    elements.tasksList.innerHTML = tasks.map(task => `
        <div class="task-card">
            <div class="task-info">
                <h4>${task.type === 'video' ? '视频生成' : '角色创建'} - ${task.id.substring(0, 8)}</h4>
                <p>创建时间: ${new Date(task.createdAt).toLocaleString()}</p>
                ${task.progress !== undefined ? `<p>进度: ${task.progress}%</p>` : ''}
            </div>
            <div class="task-status">
                <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
                ${task.status === 'completed' ? '<button class="btn-secondary" onclick="viewResult(\'' + task.id + '\')">查看</button>' : ''}
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        pending: '等待中',
        processing: '处理中',
        completed: '已完成',
        failed: '失败'
    };
    return statusMap[status] || status;
}

// View task result
window.viewResult = async function(taskId) {
    try {
        const response = await fetch(`/api/video/status/${taskId}`);
        const result = await response.json();

        if (result.success && result.data.video_url) {
            // Open video in new tab
            window.open(result.data.video_url, '_blank');
        }
    } catch (error) {
        console.error('View result error:', error);
    }
};

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: var(--card-bg);
        color: var(--text-primary);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;

    if (type === 'success') {
        notification.style.borderLeft = '4px solid var(--success-color)';
    } else if (type === 'error') {
        notification.style.borderLeft = '4px solid var(--error-color)';
    } else {
        notification.style.borderLeft = '4px solid var(--primary-color)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    loadTasks();
});