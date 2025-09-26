// JavaScript functionality for the to-do list application

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const clearAllBtn = document.getElementById('clear-all');
    
    // Task counter and current filter state
    let taskCounter = 0;
    let currentFilter = 'all';
    
    // Data storage keys
    const STORAGE_KEY = 'todoApp_tasks';
    const COUNTER_KEY = 'todoApp_counter';
    
    // Save task data to localStorage
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
                        id: Date.now() + Math.random() // Simple ID generation
                    });
                }
            });
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            localStorage.setItem(COUNTER_KEY, taskCounter.toString());
        } catch (error) {
            console.warn('Failed to save task data:', error);
            showNotification('Failed to save data, please check browser settings', 'info');
        }
    }
    
    // Load task data from localStorage
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
            console.warn('Failed to load task data:', error);
            showNotification('Failed to load data, starting from scratch', 'info');
        }
    }
    
    // Validate the security of task data
    function validateTaskData(task) {
        if (!task || typeof task !== 'object') {
            return false;
        }
        
        // Check for required fields
        if (typeof task.text !== 'string' || typeof task.completed !== 'boolean') {
            return false;
        }
        
        // Check text length limit
        if (task.text.length === 0 || task.text.length > 1000) {
            return false;
        }
        
        // Check for potentially malicious content
        const dangerousPatterns = /<script|javascript:|on\w+=/i;
        if (dangerousPatterns.test(task.text)) {
            return false;
        }
        
        return true;
    }
    
    // Restore a single task
    function restoreTask(taskText, isCompleted) {
        taskCounter++;
        
        const listItem = document.createElement('li');
        
        listItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" onchange="toggleTask(this)" ${isCompleted ? 'checked' : ''}>
            <span class="task-text">${escapeHtml(taskText)}</span>
            <button class="delete-btn" onclick="deleteTask(this)">Delete</button>
        `;
        
        // Set task status
        listItem.dataset.status = isCompleted ? 'completed' : 'pending';
        
        if (isCompleted) {
            listItem.classList.add('completed');
        }
        
        taskList.appendChild(listItem);
    }
    
    // Listen for form submission event
    taskForm.addEventListener('submit', function(e) {
        // Prevent the form's default submission behavior
        e.preventDefault();
        
        // Get the input value and remove leading/trailing spaces
        const taskText = taskInput.value.trim();
        
        // Check if the input is empty
        if (taskText === '') {
            alert('Please enter a to-do item!');
            return;
        }
        
        // Create a new to-do item
        addTask(taskText);
        
        // Clear the input field
        taskInput.value = '';
        
        // Set focus back to the input field
        taskInput.focus();
    });
    
    // Function to add a to-do item
    function addTask(taskText) {
        // Increment the task counter
        taskCounter++;
        
        // Create a new li element
        const listItem = document.createElement('li');
        
        // Set the content of the li
        listItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" onchange="toggleTask(this)">
            <span class="task-text">${escapeHtml(taskText)}</span>
            <button class="delete-btn" onclick="deleteTask(this)">Delete</button>
        `;
        
        // Set the task status
        listItem.dataset.status = 'pending';
        
        // Add animation effect for the newly added task item
        listItem.style.opacity = '0';
        listItem.style.transform = 'translateY(-10px)';
        
        // Add the new li to the task list
        taskList.appendChild(listItem);
        
        // Add fade-in animation
        setTimeout(() => {
            listItem.style.transition = 'all 0.3s ease';
            listItem.style.opacity = '1';
            listItem.style.transform = 'translateY(0)';
        }, 10);
        
        // Show success notification
        showNotification('Task added successfully!', 'success');
        
        // Save data to localStorage
        saveTasksToStorage();
    }
    
    // Function to toggle task completion status (global function for HTML to call)
    window.toggleTask = function(checkbox) {
        const listItem = checkbox.parentElement;
        const isCompleted = checkbox.checked;
        
        if (isCompleted) {
            listItem.classList.add('completed');
            listItem.dataset.status = 'completed';
            showNotification('Task completed!', 'success');
        } else {
            listItem.classList.remove('completed');
            listItem.dataset.status = 'pending';
            showNotification('Task marked as pending!', 'info');
        }
        
        // Re-apply the current filter
        applyFilter(currentFilter);
        
        // Save data to localStorage
        saveTasksToStorage();
    };
    
    // Function to delete a to-do item (global function for HTML to call)
    window.deleteTask = function(button) {
        const listItem = button.parentElement;
        
        // Add delete animation
        listItem.style.transition = 'all 0.3s ease';
        listItem.style.opacity = '0';
        listItem.style.transform = 'translateX(-100%)';
        
        // Remove the element after the animation completes
        setTimeout(() => {
            listItem.remove();
            showNotification('Task deleted!', 'info');
            
            // Save data to localStorage
            saveTasksToStorage();
        }, 300);
    };
    
    // HTML escape function to prevent XSS attacks
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Custom confirmation modal function
    function showConfirmModal(title, message) {
        return new Promise((resolve) => {
            // Create the modal HTML structure
            const modalHTML = `
                <div class="modal-overlay" id="confirmModal">
                    <div class="modal-content">
                        <h3 class="modal-title">${escapeHtml(title)}</h3>
                        <p class="modal-message">${escapeHtml(message)}</p>
                        <div class="modal-buttons">
                            <button class="modal-btn modal-btn-cancel" id="modalCancel">Cancel</button>
                            <button class="modal-btn modal-btn-confirm" id="modalConfirm">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add the modal to the page
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('confirmModal');
            const confirmBtn = document.getElementById('modalConfirm');
            const cancelBtn = document.getElementById('modalCancel');
            
            // Show the modal
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // Handle confirm button click
            confirmBtn.addEventListener('click', () => {
                hideModal(modal, () => resolve(true));
            });
            
            // Handle cancel button click
            cancelBtn.addEventListener('click', () => {
                hideModal(modal, () => resolve(false));
            });
            
            // Close the modal when clicking on the overlay
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideModal(modal, () => resolve(false));
                }
            });
            
            // Close the modal with the ESC key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    hideModal(modal, () => resolve(false));
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
            
            // Function to hide the modal
            function hideModal(modal, callback) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    callback();
                }, 300);
            }
        });
    }
    
    // Function to show notifications
    function showNotification(message, type = 'info') {
        // Create the notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Set notification styles
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
        
        // Set background color based on type
        if (type === 'success') {
            notification.style.background = '#28a745';
        } else if (type === 'info') {
            notification.style.background = '#17a2b8';
        } else {
            notification.style.background = '#6c757d';
        }
        
        // Add to the page
        document.body.appendChild(notification);
        
        // Show animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            // Remove the element after the animation completes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Keyboard shortcut support
    document.addEventListener('keydown', function(e) {
        // Ctrl + Enter to quickly add a task
        if (e.ctrlKey && e.key === 'Enter') {
            taskForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Function to filter tasks
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
    
    // Event listener for filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove the active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add the active class to the current button
            this.classList.add('active');
            
            // Get the filter type and apply it
            currentFilter = this.dataset.filter;
            applyFilter(currentFilter);
        });
    });
    
    // Event listener for the clear completed tasks button
    clearCompletedBtn.addEventListener('click', async function() {
        const completedTasks = taskList.querySelectorAll('li[data-status="completed"]');
        
        if (completedTasks.length === 0) {
            showNotification('No completed tasks to clear!', 'info');
            return;
        }
        
        const confirmed = await showConfirmModal(
            'Clear Completed Tasks',
            `Are you sure you want to clear ${completedTasks.length} completed tasks?`
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
            
            showNotification(`Cleared ${completedTasks.length} completed tasks!`, 'success');
            
            // Delay saving data to ensure DOM update is complete
            setTimeout(() => {
                saveTasksToStorage();
            }, 350);
        }
    });
    
    // Event listener for the clear all tasks button
    clearAllBtn.addEventListener('click', async function() {
        const allTasks = taskList.querySelectorAll('li');
        
        if (allTasks.length === 0) {
            showNotification('No tasks to clear!', 'info');
            return;
        }
        
        const confirmed = await showConfirmModal(
            'Clear All Tasks',
            `Are you sure you want to clear all ${allTasks.length} tasks? This action cannot be undone!`
        );
        
        if (confirmed) {
            allTasks.forEach((task, index) => {
                task.style.transition = 'all 0.3s ease';
                task.style.opacity = '0';
                task.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    task.remove();
                }, 300 + index * 50); // Add delay effect
            });
            
            // Reset the task counter
            taskCounter = 0;
            
            showNotification(`Cleared all ${allTasks.length} tasks!`, 'success');
            
            // Delay saving data to ensure DOM update is complete
            setTimeout(() => {
                saveTasksToStorage();
            }, 350 + allTasks.length * 50);
        }
    });
    
    // Load saved task data after the page is loaded
    loadTasksFromStorage();
    
    // Set focus to the input field
    taskInput.focus();
});