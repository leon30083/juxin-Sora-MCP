// WebSocket连接
let ws;

// DOM元素
const elements = {
    // 统计数据
    totalTasks: document.getElementById('totalTasks'),
    processingTasks: document.getElementById('processingTasks'),
    completedTasks: document.getElementById('completedTasks'),
    successRate: document.getElementById('successRate'),

    // 表单
    textForm: document.getElementById('text-form'),
    imageForm: document.getElementById('image-form'),
    characterForm: document.getElementById('character-form'),

    // 输入字段
    prompt: document.getElementById('prompt'),
    orientation: document.getElementById('orientation'),
    size: document.getElementById('size'),
    duration: document.getElementById('duration'),
    watermark: document.getElementById('watermark'),
    private: document.getElementById('private'),

    // 图生视频
    imageUpload: document.getElementById('imageUpload'),
    uploadArea: document.getElementById('uploadArea'),
    uploadPreview: document.getElementById('uploadPreview'),
    previewImage: document.getElementById('previewImage'),
    removeImage: document.getElementById('removeImage'),
    imagePrompt: document.getElementById('imagePrompt'),

    // 角色视频
    characterSelect: document.getElementById('characterSelect'),
    characterPrompt: document.getElementById('characterPrompt'),
    characterOrientation: document.getElementById('characterOrientation'),
    characterSize: document.getElementById('characterSize'),

    // 任务列表
    statusFilter: document.getElementById('statusFilter'),
    refreshBtn: document.getElementById('refreshBtn'),
    batchQueryBtn: document.getElementById('batchQueryBtn'),
    tasksList: document.getElementById('tasksList'),

    // 模态框
    taskModal: document.getElementById('taskModal'),
    modalClose: document.getElementById('modalClose'),
    modalBody: document.getElementById('modalBody')
};

// 当前状态
let currentTasks = [];
let uploadedImage = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    initTabs();
    initUpload();
    initForms();
    initTaskList();

    // 初始加载
    loadStats();
    loadTasks();
});

// WebSocket初始化
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // 如果在开发环境（localhost），使用指定端口
    const host = window.location.hostname === 'localhost' ? 'localhost:3033' : window.location.host;
    ws = new WebSocket(`${protocol}//${host}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        showMessage('WebSocket已连接', 'success');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        // 5秒后尝试重连
        setTimeout(initWebSocket, 5000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showMessage('WebSocket连接失败', 'error');
    };
}

// 处理WebSocket消息
function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'task_created':
            showNotification(`新任务已创建: ${data.data.id}`, 'info');
            loadTasks();
            loadStats();
            break;

        case 'task_updated':
            updateTaskStatus(data.data);
            loadStats();
            break;

        default:
            console.log('Unknown message type:', data.type);
    }
}

// 标签页初始化
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // 切换按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 切换内容
            tabContents.forEach(content => {
                if (content.id === `${tabName}-form`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
}

// 图片上传初始化
function initUpload() {
    elements.uploadArea.addEventListener('click', () => {
        elements.imageUpload.click();
    });

    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });

    elements.imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    elements.removeImage.addEventListener('click', () => {
        removeUploadedImage();
    });
}

// 处理图片上传
function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        showMessage('请选择图片文件', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showMessage('图片大小不能超过10MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = {
            file: file,
            url: e.target.result
        };

        elements.uploadArea.style.display = 'none';
        elements.uploadPreview.style.display = 'block';
        elements.previewImage.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// 移除上传的图片
function removeUploadedImage() {
    uploadedImage = null;
    elements.uploadArea.style.display = 'block';
    elements.uploadPreview.style.display = 'none';
    elements.imageUpload.value = '';
}

// 表单初始化
function initForms() {
    // 文生视频表单
    elements.textForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createVideo({
            prompt: elements.prompt.value,
            orientation: elements.orientation.value,
            size: elements.size.value,
            duration: parseInt(elements.duration.value),
            watermark: !elements.watermark.checked,
            private: elements.private.checked
        });
    });

    // 图生视频表单
    elements.imageForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!uploadedImage) {
            showMessage('请先上传图片', 'error');
            return;
        }

        // 上传图片到服务器
        const formData = new FormData();
        formData.append('image', uploadedImage.file);

        try {
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                throw new Error(uploadResult.error);
            }

            await createVideo({
                prompt: elements.imagePrompt.value || '处理上传的图片',
                orientation: elements.orientation.value,
                size: elements.size.value,
                duration: parseInt(elements.duration.value),
                watermark: !elements.watermark.checked,
                private: elements.private.checked,
                images: [uploadResult.path]
            });

        } catch (error) {
            showMessage(`图片上传失败: ${error.message}`, 'error');
        }
    });

    // 角色视频表单
    elements.characterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const character = elements.characterSelect.value;
        const prompt = elements.characterPrompt.value;

        if (!character) {
            showMessage('请选择一个角色', 'error');
            return;
        }

        await createVideo({
            prompt: `${character} ${prompt}`,
            orientation: elements.characterOrientation.value,
            size: elements.characterSize.value,
            duration: 15,
            watermark: false,
            private: true
        });
    });
}

// 创建视频
async function createVideo(params) {
    try {
        const response = await fetch('/api/video/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const result = await response.json();

        if (result.success) {
            showMessage(`视频创建成功！任务ID: ${result.task_id}`, 'success');
            loadTasks();
            loadStats();

            // 清空表单
            elements.textForm.reset();
            elements.imageForm.reset();
            elements.characterForm.reset();
            removeUploadedImage();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showMessage(`创建失败: ${error.message}`, 'error');
    }
}

// 任务列表初始化
function initTaskList() {
    elements.refreshBtn.addEventListener('click', () => {
        loadTasks();
    });

    elements.batchQueryBtn.addEventListener('click', async () => {
        await batchQueryTasks();
    });

    elements.statusFilter.addEventListener('change', () => {
        loadTasks();
    });

    elements.modalClose.addEventListener('click', () => {
        closeModal();
    });

    elements.taskModal.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) {
            closeModal();
        }
    });
}

// 加载统计信息
async function loadStats() {
    try {
        const response = await fetch('/api/tasks/stats');
        const result = await response.json();

        if (result.success) {
            const stats = result.stats;
            elements.totalTasks.textContent = stats.total;
            elements.processingTasks.textContent = stats.processing;
            elements.completedTasks.textContent = stats.completed;
            elements.successRate.textContent = stats.success_rate;
        }
    } catch (error) {
        console.error('加载统计失败:', error);
    }
}

// 加载任务列表
async function loadTasks() {
    try {
        const status = elements.statusFilter.value;
        const response = await fetch(`/api/tasks?status=${status}&limit=50`);
        const result = await response.json();

        if (result.success) {
            currentTasks = result.tasks;
            renderTasks(result.tasks);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        elements.tasksList.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
    }
}

// 渲染任务列表
function renderTasks(tasks) {
    if (tasks.length === 0) {
        elements.tasksList.innerHTML = '<div class="loading">暂无任务</div>';
        return;
    }

    const html = tasks.map(task => `
        <div class="task-item status-${task.status}" onclick="showTaskDetail('${task.id}')">
            <div class="task-header">
                <span class="task-id">${task.id}</span>
                <span class="task-status status-${task.status}">${getStatusText(task.status)}</span>
            </div>
            <div class="task-prompt">${task.prompt}</div>
            <div class="task-meta">
                <span>创建时间: ${formatTime(task.created_at)}</span>
                ${task.completed_at ? `<span>完成时间: ${formatTime(task.completed_at)}</span>` : ''}
            </div>
        </div>
    `).join('');

    elements.tasksList.innerHTML = html;
}

// 批量查询任务
async function batchQueryTasks() {
    const pendingTasks = currentTasks.filter(t => t.status === 'pending' || t.status === 'processing');

    if (pendingTasks.length === 0) {
        showMessage('没有需要查询的任务', 'info');
        return;
    }

    if (pendingTasks.length > 20) {
        showMessage('一次最多查询20个任务', 'warning');
        pendingTasks.length = 20;
    }

    try {
        const taskIds = pendingTasks.map(t => t.id);
        const response = await fetch('/api/tasks/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ task_ids })
        });

        const result = await response.json();

        if (result.success) {
            showMessage(`批量查询完成，处理了 ${result.total} 个任务`, 'success');
            loadTasks();
            loadStats();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showMessage(`批量查询失败: ${error.message}`, 'error');
    }
}

// 显示任务详情
function showTaskDetail(taskId) {
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;

    const html = `
        <div style="margin-bottom: 20px;">
            <p><strong>任务ID:</strong> ${task.id}</p>
            <p><strong>状态:</strong> <span class="task-status status-${task.status}">${getStatusText(task.status)}</span></p>
            <p><strong>提示词:</strong> ${task.prompt}</p>
            <p><strong>创建时间:</strong> ${formatTime(task.created_at)}</p>
            ${task.completed_at ? `<p><strong>完成时间:</strong> ${formatTime(task.completed_at)}</p>` : ''}
            ${task.video_url ? `<p><strong>视频链接:</strong> <a href="${task.video_url}" target="_blank">${task.video_url}</a></p>` : ''}
            ${task.error ? `<p><strong>错误信息:</strong> ${task.error}</p>` : ''}
        </div>
        ${task.video_url ? `
            <video controls style="width: 100%; max-height: 400px;">
                <source src="${task.video_url}" type="video/mp4">
                您的浏览器不支持视频播放。
            </video>
        ` : ''}
    `;

    elements.modalBody.innerHTML = html;
    elements.taskModal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    elements.taskModal.style.display = 'none';
}

// 更新任务状态
function updateTaskStatus(data) {
    const taskIndex = currentTasks.findIndex(t => t.id === data.id);
    if (taskIndex !== -1) {
        currentTasks[taskIndex] = { ...currentTasks[taskIndex], ...data };
        renderTasks(currentTasks);
    }
}

// 工具函数
function getStatusText(status) {
    const statusMap = {
        'pending': '等待中',
        'processing': '处理中',
        'completed': '已完成',
        'failed': '失败',
        'queued': '排队中'
    };
    return statusMap[status] || status;
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN');
}

function showMessage(message, type = 'info') {
    const div = document.createElement('div');
    div.className = `message message-${type}`;
    div.textContent = message;

    document.body.insertBefore(div, document.body.firstChild);

    setTimeout(() => {
        div.remove();
    }, 3000);
}

function showNotification(message, type) {
    // 使用浏览器的通知API
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('聚鑫视频生成', {
            body: message,
            icon: '/favicon.ico'
        });
    } else {
        // 降级到普通消息
        showMessage(message, type);
    }
}

// 请求通知权限
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}