// 待办事项应用的JavaScript功能

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const clearAllBtn = document.getElementById('clear-all');
    
    // 任务计数器和当前过滤状态
    let taskCounter = 0;
    let currentFilter = 'all';
    
    // 数据存储键名
    const STORAGE_KEY = 'todoApp_tasks';
    const COUNTER_KEY = 'todoApp_counter';
    
    // 保存任务数据到localStorage
    function saveTasksToStorage() {
        try {
            const tasks = [];
            const taskItems = taskList.querySelectorAll('li');
            
            taskItems.forEach(item => {
                const checkbox = item.querySelector('.task-checkbox');
                const textElement = item.querySelector('.task-text');
                
                if (textElement) {
                    tasks.push({
                        text: textElement.textContent.trim(),
                        completed: checkbox ? checkbox.checked : false,
                        id: Date.now() + Math.random() // 简单的ID生成
                    });
                }
            });
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            localStorage.setItem(COUNTER_KEY, taskCounter.toString());
        } catch (error) {
            console.warn('保存任务数据失败:', error);
            showNotification('数据保存失败，请检查浏览器设置', 'info');
        }
    }
    
    // 从localStorage加载任务数据
    function loadTasksFromStorage() {
        try {
            const savedTasks = localStorage.getItem(STORAGE_KEY);
            const savedCounter = localStorage.getItem(COUNTER_KEY);
            
            if (savedCounter) {
                const counter = parseInt(savedCounter, 10);
                if (!isNaN(counter) && counter >= 0) {
                    taskCounter = counter;
                }
            }
            
            if (savedTasks) {
                const tasks = JSON.parse(savedTasks);
                
                if (Array.isArray(tasks)) {
                    tasks.forEach(task => {
                        if (validateTaskData(task)) {
                            restoreTask(task.text, task.completed);
                        }
                    });
                }
            }
        } catch (error) {
            console.warn('加载任务数据失败:', error);
            showNotification('数据加载失败，将从空白开始', 'info');
        }
    }
    
    // 验证任务数据的安全性
    function validateTaskData(task) {
        if (!task || typeof task !== 'object') {
            return false;
        }
        
        // 检查必要字段
        if (typeof task.text !== 'string' || typeof task.completed !== 'boolean') {
            return false;
        }
        
        // 检查文本长度限制
        if (task.text.length === 0 || task.text.length > 1000) {
            return false;
        }
        
        // 检查是否包含潜在的恶意内容
        const dangerousPatterns = /<script|javascript:|on\w+=/i;
        if (dangerousPatterns.test(task.text)) {
            return false;
        }
        
        return true;
    }
    
    // 恢复单个任务
    function restoreTask(taskText, isCompleted) {
        taskCounter++;
        
        const listItem = document.createElement('li');
        
        listItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" onchange="toggleTask(this)" ${isCompleted ? 'checked' : ''}>
            <span class="task-text">${escapeHtml(taskText)}</span>
            <button class="delete-btn" onclick="deleteTask(this)">删除</button>
        `;
        
        // 设置任务状态
        listItem.dataset.status = isCompleted ? 'completed' : 'pending';
        
        if (isCompleted) {
            listItem.classList.add('completed');
        }
        
        taskList.appendChild(listItem);
    }
    
    // 监听表单提交事件
    taskForm.addEventListener('submit', function(e) {
        // 阻止表单默认提交行为
        e.preventDefault();
        
        // 获取输入框的值并去除首尾空格
        const taskText = taskInput.value.trim();
        
        // 检查输入是否为空
        if (taskText === '') {
            alert('请输入待办事项内容！');
            return;
        }
        
        // 创建新的待办事项
        addTask(taskText);
        
        // 清空输入框
        taskInput.value = '';
        
        // 让输入框重新获得焦点
        taskInput.focus();
    });
    
    // 添加待办事项函数
    function addTask(taskText) {
        // 增加任务计数
        taskCounter++;
        
        // 创建新的li元素
        const listItem = document.createElement('li');
        
        // 设置li的内容
        listItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" onchange="toggleTask(this)">
            <span class="task-text">${escapeHtml(taskText)}</span>
            <button class="delete-btn" onclick="deleteTask(this)">删除</button>
        `;
        
        // 设置任务状态
        listItem.dataset.status = 'pending';
        
        // 为新添加的任务项添加动画效果
        listItem.style.opacity = '0';
        listItem.style.transform = 'translateY(-10px)';
        
        // 将新的li添加到任务列表中
        taskList.appendChild(listItem);
        
        // 添加淡入动画
        setTimeout(() => {
            listItem.style.transition = 'all 0.3s ease';
            listItem.style.opacity = '1';
            listItem.style.transform = 'translateY(0)';
        }, 10);
        
        // 显示成功提示
        showNotification('任务添加成功！', 'success');
        
        // 保存数据到localStorage
        saveTasksToStorage();
    }
    
    // 切换任务完成状态函数（全局函数，供HTML调用）
    window.toggleTask = function(checkbox) {
        const listItem = checkbox.parentElement;
        const isCompleted = checkbox.checked;
        
        if (isCompleted) {
            listItem.classList.add('completed');
            listItem.dataset.status = 'completed';
            showNotification('任务已完成！', 'success');
        } else {
            listItem.classList.remove('completed');
            listItem.dataset.status = 'pending';
            showNotification('任务已标记为未完成！', 'info');
        }
        
        // 重新应用当前过滤器
        applyFilter(currentFilter);
        
        // 保存数据到localStorage
        saveTasksToStorage();
    };
    
    // 删除待办事项函数（全局函数，供HTML调用）
    window.deleteTask = function(button) {
        const listItem = button.parentElement;
        
        // 添加删除动画
        listItem.style.transition = 'all 0.3s ease';
        listItem.style.opacity = '0';
        listItem.style.transform = 'translateX(-100%)';
        
        // 动画完成后移除元素
        setTimeout(() => {
            listItem.remove();
            showNotification('任务已删除！', 'info');
            
            // 保存数据到localStorage
            saveTasksToStorage();
        }, 300);
    };
    
    // HTML转义函数，防止XSS攻击
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 自定义确认弹窗函数
    function showConfirmModal(title, message) {
        return new Promise((resolve) => {
            // 创建弹窗HTML结构
            const modalHTML = `
                <div class="modal-overlay" id="confirmModal">
                    <div class="modal-content">
                        <h3 class="modal-title">${escapeHtml(title)}</h3>
                        <p class="modal-message">${escapeHtml(message)}</p>
                        <div class="modal-buttons">
                            <button class="modal-btn modal-btn-cancel" id="modalCancel">取消</button>
                            <button class="modal-btn modal-btn-confirm" id="modalConfirm">确认</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加弹窗到页面
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('confirmModal');
            const confirmBtn = document.getElementById('modalConfirm');
            const cancelBtn = document.getElementById('modalCancel');
            
            // 显示弹窗
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // 处理确认按钮点击
            confirmBtn.addEventListener('click', () => {
                hideModal(modal, () => resolve(true));
            });
            
            // 处理取消按钮点击
            cancelBtn.addEventListener('click', () => {
                hideModal(modal, () => resolve(false));
            });
            
            // 点击遮罩层关闭弹窗
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideModal(modal, () => resolve(false));
                }
            });
            
            // ESC键关闭弹窗
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    hideModal(modal, () => resolve(false));
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
            
            // 隐藏弹窗函数
            function hideModal(modal, callback) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    callback();
                }, 300);
            }
        });
    }
    
    // 显示通知函数
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 设置通知样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // 根据类型设置背景色
        if (type === 'success') {
            notification.style.background = '#28a745';
        } else if (type === 'info') {
            notification.style.background = '#17a2b8';
        } else {
            notification.style.background = '#6c757d';
        }
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 3秒后自动隐藏
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            // 动画完成后移除元素
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl + Enter 快速添加任务
        if (e.ctrlKey && e.key === 'Enter') {
            taskForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // 过滤任务函数
    function applyFilter(filter) {
        const tasks = taskList.querySelectorAll('li');
        
        tasks.forEach(task => {
            const status = task.dataset.status;
            let shouldShow = false;
            
            switch(filter) {
                case 'all':
                    shouldShow = true;
                    break;
                case 'pending':
                    shouldShow = status === 'pending';
                    break;
                case 'completed':
                    shouldShow = status === 'completed';
                    break;
            }
            
            if (shouldShow) {
                task.classList.remove('hidden');
            } else {
                task.classList.add('hidden');
            }
        });
    }
    
    // 过滤按钮事件监听
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // 为当前按钮添加active类
            this.classList.add('active');
            
            // 获取过滤类型并应用
            currentFilter = this.dataset.filter;
            applyFilter(currentFilter);
        });
    });
    
    // 清空已完成任务按钮事件监听
    clearCompletedBtn.addEventListener('click', async function() {
        const completedTasks = taskList.querySelectorAll('li[data-status="completed"]');
        
        if (completedTasks.length === 0) {
            showNotification('没有已完成的任务需要清空！', 'info');
            return;
        }
        
        const confirmed = await showConfirmModal(
            '清空已完成任务',
            `确定要清空 ${completedTasks.length} 个已完成的任务吗？`
        );
        
        if (confirmed) {
            completedTasks.forEach(task => {
                task.style.transition = 'all 0.3s ease';
                task.style.opacity = '0';
                task.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    task.remove();
                }, 300);
            });
            
            showNotification(`已清空 ${completedTasks.length} 个已完成任务！`, 'success');
            
            // 延迟保存数据，确保DOM更新完成
            setTimeout(() => {
                saveTasksToStorage();
            }, 350);
        }
    });
    
    // 清空所有任务按钮事件监听
    clearAllBtn.addEventListener('click', async function() {
        const allTasks = taskList.querySelectorAll('li');
        
        if (allTasks.length === 0) {
            showNotification('没有任务需要清空！', 'info');
            return;
        }
        
        const confirmed = await showConfirmModal(
            '清空所有任务',
            `确定要清空所有 ${allTasks.length} 个任务吗？此操作不可撤销！`
        );
        
        if (confirmed) {
            allTasks.forEach((task, index) => {
                task.style.transition = 'all 0.3s ease';
                task.style.opacity = '0';
                task.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    task.remove();
                }, 300 + index * 50); // 添加延迟效果
            });
            
            // 重置任务计数器
            taskCounter = 0;
            
            showNotification(`已清空所有 ${allTasks.length} 个任务！`, 'success');
            
            // 延迟保存数据，确保DOM更新完成
            setTimeout(() => {
                saveTasksToStorage();
            }, 350 + allTasks.length * 50);
        }
    });
    
    // 页面加载完成后加载保存的任务数据
    loadTasksFromStorage();
    
    // 让输入框获得焦点
    taskInput.focus();
});