// FILE: script.js (最終版)
document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM 元素選取 (集中管理) ----
    const body = document.querySelector('body');
    const nameContainer = document.querySelector('.name-container');
    const projectModal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');
    const portfolioList = document.querySelector('.portfolio-list');
    const eyes = document.querySelectorAll('.eye');

    // ---- 通用工具函式 ----
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // ---- 功能函式 ----
    async function loadProjects() {
        const API_URL = 'api/get_projects.php'; 
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            const projects = await response.json();
            if (!portfolioList) return;
            portfolioList.innerHTML = '';
            if (projects.length === 0) {
                 portfolioList.innerHTML = '<p>目前尚無已發布的專案。</p>';
                 return;
            }
            projects.forEach(project => {
                const projectLink = document.createElement('a');
                projectLink.href = '#';
                projectLink.className = 'portfolio-capsule';
                projectLink.textContent = project.title;
                projectLink.dataset.projectId = project.id;
                portfolioList.appendChild(projectLink);
            });
        } catch (error) {
            console.error('專案載入失敗:', error);
            if (portfolioList) {
                portfolioList.innerHTML = '<p>專案載入失敗，請稍後再試。</p>';
            }
        }
    }

    async function showProjectDetail(projectId) {
        const API_URL = `api/get_project_detail.php?id=${projectId}`;
        if (!projectModal || !modalBody) return;
        modalBody.innerHTML = '<p>載入中...</p>';
        projectModal.classList.add('show');
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                 throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            const project = await response.json();
            if (project && !project.error) {
                let tagsHtml = '';
                if (project.tags && project.tags.length > 0) {
                    tagsHtml = '<div class="modal-tags">';
                    project.tags.forEach(tag => {
                        tagsHtml += `<span class="modal-tag">${tag.name}</span>`;
                    });
                    tagsHtml += '</div>';
                }
                let galleryHtml = '';
                if (project.gallery && project.gallery.length > 0) {
                    galleryHtml = '<div class="modal-gallery">';
                    project.gallery.forEach(img => {
                        galleryHtml += `
                            <div class="gallery-item">
                                <img src="${img.image_url}" alt="${img.caption || project.title}">
                                ${img.caption ? `<p class="caption">${img.caption}</p>` : ''}
                            </div>
                        `;
                    });
                    galleryHtml += '</div>';
                }
                modalBody.innerHTML = `
                    <span class="modal-category">${project.category_name}</span>
                    <h2>${project.title}</h2>
                    ${tagsHtml}
                    <img src="${project.cover_image_url || 'https://placehold.co/400x200/cccccc/969696?text=No+Image'}" alt="${project.title}" class="modal-cover-image">
                    <p class="modal-description">${project.description}</p>
                    ${galleryHtml}
                    ${project.project_link ? `<a href="${project.project_link}" class="cta-button" target="_blank" rel="noopener noreferrer">查看專案</a>` : ''}
                `;
            } else {
                throw new Error(project?.error || '專案資料格式錯誤');
            }
        } catch (error) {
            console.error('無法顯示專案詳情:', error);
            modalBody.innerHTML = `<p>找不到專案詳情，或該專案尚未發布。</p>`;
        }
    }
    
    function closeModal() {
        projectModal?.classList.remove('show');
    }

    const toggleHorizontalCapsules = () => {
        portfolioList?.classList.toggle('horizontal-capsules', window.innerWidth >= 769);
    };

    // ---- 事件監聽器設定 ----
    nameContainer?.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
    });

    portfolioList?.addEventListener('click', (event) => {
        const capsule = event.target.closest('.portfolio-capsule');
        if (capsule) {
            event.preventDefault();
            const projectId = capsule.dataset.projectId;
            if (projectId) {
                showProjectDetail(projectId);
            }
        }
    });

    closeButton?.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => (event.target === projectModal) && closeModal());
    document.addEventListener('keydown', (event) => (event.key === "Escape" && projectModal?.classList.contains('show')) && closeModal());

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        eyes.forEach(eye => {
            const { left, top, width, height } = eye.parentElement.getBoundingClientRect();
            const eyeCenterX = left + width / 2;
            const eyeCenterY = top + height / 2;
            const deltaX = clientX - eyeCenterX;
            const deltaY = clientY - eyeCenterY;
            const angle = Math.atan2(deltaY, deltaX);
            const maxMoveX = (eye.parentElement.offsetWidth - eye.offsetWidth) / 2;
            const maxMoveY = (eye.parentElement.offsetHeight - eye.offsetHeight) / 2;
            const moveX = Math.cos(angle) * maxMoveX;
            const moveY = Math.sin(angle) * maxMoveY;
            eye.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    };
    window.addEventListener('mousemove', throttle(handleMouseMove, 100));
    
    // ---- 初始化執行 ----
    toggleHorizontalCapsules();
    loadProjects();
});
