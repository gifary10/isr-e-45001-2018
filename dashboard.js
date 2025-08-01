// dashboard.js
import { getAppState } from './state-service.js';
import { getAllNotes } from './notes-service.js';
import { getAllProgress, calculateOverallProgress } from './progress-service.js';
import { loadClauseData } from './data-service.js';
import { showEmptyState } from './render-service.js';
import { showClauseDetail, showSubclauseDetail } from './app.js';

const DASHBOARD_REFRESH_INTERVAL = 30000; // 30 seconds
const CLAUSE_COUNT = 10;

function createDashboardContainer() {
    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';
    dashboardContainer.innerHTML = `
        <div class="section-title">
            <h1 class="h5">Dashboard Implementasi</h1>
            <button id="refresh-dashboard-btn" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-arrow-clockwise"></i> Segarkan
            </button>
        </div>
        <div class="row">
            <div class="col-12 col-md-6 mb-3">
                <div class="card dashboard-card h-100">
                    <div class="card-header dashboard-card-header bg-primary text-white">
                        <h6 class="mb-0">Progress Implementasi</h6>
                    </div>
                    <div class="card-body dashboard-card-body">
                        <div class="progress-overall mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Progress Keseluruhan</span>
                                <strong id="overall-progress-percent">0%</strong>
                            </div>
                            <div class="progress" style="height: 20px;">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                     id="overall-progress-bar" role="progressbar" style="width: 0%">
                                </div>
                            </div>
                            <small class="text-muted mt-1 d-block" id="completed-items">0 dari 0 item selesai</small>
                        </div>
                        <div class="clause-progress-grid">
                            ${Array.from({length: CLAUSE_COUNT}, (_, i) => i + 1).map(clauseNum => `
                                <div class="clause-progress-item" data-clause="${clauseNum}">
                                    <div class="clause-progress-header">
                                        <span>Klausul ${clauseNum}</span>
                                        <span class="badge bg-secondary clause-progress-badge">0%</span>
                                    </div>
                                    <div class="progress" style="height: 6px;">
                                        <div class="progress-bar clause-progress" data-clause="${clauseNum}" 
                                             role="progressbar" style="width: 0%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-12 col-md-6 mb-3">
                <div class="card dashboard-card h-100">
                    <div class="card-header dashboard-card-header bg-primary text-white">
                        <h6 class="mb-0">Aktivitas Terkini</h6>
                    </div>
                    <div class="card-body dashboard-card-body">
                        <ul class="nav nav-tabs" id="activity-tabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="recent-clauses-tab" data-bs-toggle="tab" 
                                        data-bs-target="#recent-clauses" type="button" role="tab">
                                    Klausul Terakhir
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="recent-notes-tab" data-bs-toggle="tab" 
                                        data-bs-target="#recent-notes" type="button" role="tab">
                                    Catatan Terakhir
                                </button>
                            </li>
                        </ul>
                        <div class="tab-content mt-3" id="activity-tab-content">
                            <div class="tab-pane fade show active" id="recent-clauses" role="tabpanel">
                                <div id="recent-clauses-list"></div>
                            </div>
                            <div class="tab-pane fade" id="recent-notes" role="tabpanel">
                                <div id="recent-notes-list"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-12 mb-3">
                <div class="card dashboard-card">
                    <div class="card-header dashboard-card-header bg-primary text-white">
                        <h6 class="mb-0">Statistik Dokumen</h6>
                    </div>
                    <div class="card-body dashboard-card-body">
                        <div class="row">
                            <div class="col-12 col-md-4 mb-3">
                                <div class="document-stat-card bg-light p-3 rounded text-center">
                                    <h3 class="text-primary" id="total-documents">0</h3>
                                    <p class="mb-0 small">Total Dokumen</p>
                                </div>
                            </div>
                            <div class="col-12 col-md-4 mb-3">
                                <div class="document-stat-card bg-light p-3 rounded text-center">
                                    <h3 class="text-danger" id="mandatory-documents">0</h3>
                                    <p class="mb-0 small">Dokumen Wajib</p>
                                </div>
                            </div>
                            <div class="col-12 col-md-4 mb-3">
                                <div class="document-stat-card bg-light p-3 rounded text-center">
                                    <h3 class="text-success" id="supporting-documents">0</h3>
                                    <p class="mb-0 small">Dokumen Pendukung</p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <canvas id="documents-chart" height="100"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners after creating the container
    const refreshBtn = dashboardContainer.querySelector('#refresh-dashboard-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', updateDashboard);
    }
    
    return dashboardContainer;
}

function updateOverallProgress() {
    try {
        const progress = calculateOverallProgress();
        const progressBar = document.getElementById('overall-progress-bar');
        const progressPercent = document.getElementById('overall-progress-percent');
        const completedItemsEl = document.getElementById('completed-items');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        if (progressPercent) {
            progressPercent.textContent = `${progress}%`;
        }
        
        const allProgress = getAllProgress();
        const totalItems = Object.keys(allProgress).length;
        const completedItems = Object.values(allProgress).filter(item => item.completed).length;
        
        if (completedItemsEl) {
            completedItemsEl.textContent = `${completedItems} dari ${totalItems} item selesai`;
        }

        updateClauseProgressBars();
    } catch (error) {
        console.error('Error updating overall progress:', error);
    }
}

function updateClauseProgressBars() {
    try {
        const progressData = getAllProgress();
        const clauseProgress = {};
        
        Object.entries(progressData).forEach(([key, value]) => {
            const clauseNum = key.split('_')[0];
            if (!clauseProgress[clauseNum]) {
                clauseProgress[clauseNum] = { total: 0, completed: 0 };
            }
            clauseProgress[clauseNum].total++;
            if (value.completed) {
                clauseProgress[clauseNum].completed++;
            }
        });
        
        Object.entries(clauseProgress).forEach(([clauseNum, progress]) => {
            const percent = Math.round((progress.completed / progress.total) * 100);
            const progressBar = document.querySelector(`.clause-progress[data-clause="${clauseNum}"]`);
            const progressBadge = document.querySelector(`.clause-progress-item[data-clause="${clauseNum}"] .clause-progress-badge`);
            
            if (progressBar) {
                progressBar.style.width = `${percent}%`;
                progressBar.classList.toggle('bg-success', percent === 100);
                progressBar.classList.toggle('bg-warning', percent < 100 && percent > 0);
                progressBar.classList.toggle('bg-danger', percent === 0);
            }
            
            if (progressBadge) {
                progressBadge.textContent = `${percent}%`;
                progressBadge.classList.toggle('bg-success', percent === 100);
                progressBadge.classList.toggle('bg-warning', percent < 100 && percent > 0);
                progressBadge.classList.toggle('bg-secondary', percent === 0);
            }
        });
    } catch (error) {
        console.error('Error updating clause progress bars:', error);
    }
}

function renderRecentClauses() {
    try {
        const container = document.getElementById('recent-clauses-list');
        if (!container) return;
        
        const state = getAppState();
        const clausesData = state.clausesData;
        const progressData = getAllProgress();
        
        const recentClauses = Object.entries(progressData)
            .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
            .slice(0, 5);
        
        if (recentClauses.length === 0) {
            showEmptyState(container, 'Belum ada progress yang dicatat');
            return;
        }
        
        container.innerHTML = '';
        
        recentClauses.forEach(([clauseId, progress]) => {
            const clauseNum = clauseId.split('_')[0];
            const clauseData = clausesData[clauseNum];
            const isSubclause = clauseId.includes('.');
            
            const clauseItem = document.createElement('div');
            clauseItem.className = 'recent-clause-item p-2 mb-2 rounded';
            
            const clauseTitle = isSubclause 
                ? `Klausul ${clauseNum}.${clauseId.split('_')[1]}` 
                : `Klausul ${clauseNum}`;
            
            const clauseName = clauseData?.clause?.title || 'Tidak diketahui';
            const lastUpdated = new Date(progress.timestamp).toLocaleString();
            
            clauseItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${clauseTitle}</strong>
                        <p class="small mb-1 text-muted">${clauseName}</p>
                        <small class="text-muted">${lastUpdated}</small>
                    </div>
                    <span class="badge ${progress.completed ? 'bg-success' : 'bg-warning'}">
                        ${progress.completed ? 'Selesai' : 'Dalam Proses'}
                    </span>
                </div>
            `;
            
            clauseItem.addEventListener('click', () => {
                if (isSubclause) {
                    showSubclauseDetail(clauseNum, clauseId.split('_')[1]);
                } else {
                    showClauseDetail(clauseNum);
                }
            });
            
            container.appendChild(clauseItem);
        });
    } catch (error) {
        console.error('Error rendering recent clauses:', error);
    }
}

function renderRecentNotes() {
    try {
        const container = document.getElementById('recent-notes-list');
        if (!container) return;
        
        const notes = getAllNotes();
        const recentNotes = Object.entries(notes)
            .sort((a, b) => new Date(b[1].lastUpdated) - new Date(a[1].lastUpdated))
            .slice(0, 5);
        
        if (recentNotes.length === 0) {
            showEmptyState(container, 'Belum ada catatan yang dibuat');
            return;
        }
        
        container.innerHTML = '';
        
        recentNotes.forEach(([noteId, note]) => {
            const [clauseNum, subclauseNum] = noteId.split('_');
            const noteItem = document.createElement('div');
            noteItem.className = 'recent-note-item p-2 mb-2 rounded';
            
            const notePreview = note.text.length > 50 
                ? note.text.substring(0, 50) + '...' 
                : note.text;
            const lastUpdated = new Date(note.lastUpdated).toLocaleString();
            const title = subclauseNum === 'main' 
                ? `Klausul ${clauseNum}` 
                : `Klausul ${clauseNum}.${subclauseNum}`;
            
            noteItem.innerHTML = `
                <div>
                    <strong>${title}</strong>
                    <p class="small mb-1 text-muted">${notePreview}</p>
                    <small class="text-muted">${lastUpdated}</small>
                </div>
            `;
            
            noteItem.addEventListener('click', () => {
                if (subclauseNum === 'main') {
                    showClauseDetail(clauseNum);
                } else {
                    showSubclauseDetail(clauseNum, subclauseNum);
                }
            });
            
            container.appendChild(noteItem);
        });
    } catch (error) {
        console.error('Error rendering recent notes:', error);
    }
}

function renderDocumentStats() {
    try {
        const state = getAppState();
        const clausesData = state.clausesData;
        
        let totalDocuments = 0;
        let mandatoryDocuments = 0;
        let supportingDocuments = 0;
        
        Object.values(clausesData).forEach(clause => {
            if (!clause?.subClauses) return;
            
            clause.subClauses.forEach(subclause => {
                if (!subclause?.documents) return;
                
                subclause.documents.forEach(doc => {
                    totalDocuments++;
                    if (doc.type === 'wajib') {
                        mandatoryDocuments++;
                    } else {
                        supportingDocuments++;
                    }
                });
            });
        });
        
        const totalEl = document.getElementById('total-documents');
        const mandatoryEl = document.getElementById('mandatory-documents');
        const supportingEl = document.getElementById('supporting-documents');
        
        if (totalEl) totalEl.textContent = totalDocuments;
        if (mandatoryEl) mandatoryEl.textContent = mandatoryDocuments;
        if (supportingEl) supportingEl.textContent = supportingDocuments;
        
        updateDocumentsChart(totalDocuments, mandatoryDocuments, supportingDocuments);
    } catch (error) {
        console.error('Error rendering document stats:', error);
    }
}

function updateDocumentsChart(total, mandatory, supporting) {
    try {
        const ctx = document.getElementById('documents-chart');
        if (!ctx) return;
        
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        
        ctx.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Wajib', 'Pendukung'],
                datasets: [{
                    data: [mandatory, supporting],
                    backgroundColor: [
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(25, 135, 84, 0.8)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error updating documents chart:', error);
    }
}

function showDashboard() {
    try {
        const dashboardView = document.getElementById('dashboard-view');
        const mainContentView = document.getElementById('main-content-view');
        
        if (!dashboardView || !mainContentView) return;
        
        mainContentView.classList.add('d-none');
        dashboardView.classList.remove('d-none');
        
        const toggleBtn = document.getElementById('toggle-view-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-list-ul"></i> Daftar Klausul';
            toggleBtn.onclick = showMainContent;
        }
        
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (!dashboardContainer) {
            const container = createDashboardContainer();
            dashboardView.innerHTML = '';
            dashboardView.appendChild(container);
        }
        
        updateDashboard();
        
        clearInterval(window.dashboardRefreshInterval);
        window.dashboardRefreshInterval = setInterval(updateDashboard, DASHBOARD_REFRESH_INTERVAL);
    } catch (error) {
        console.error('Error showing dashboard:', error);
    }
}

function showMainContent() {
    try {
        const dashboardView = document.getElementById('dashboard-view');
        const mainContentView = document.getElementById('main-content-view');
        
        if (!dashboardView || !mainContentView) return;
        
        dashboardView.classList.add('d-none');
        mainContentView.classList.remove('d-none');
        
        const toggleBtn = document.getElementById('toggle-view-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-speedometer2"></i> Dashboard';
            toggleBtn.onclick = showDashboard;
        }
        
        clearInterval(window.dashboardRefreshInterval);
    } catch (error) {
        console.error('Error showing main content:', error);
    }
}

function updateDashboard() {
    try {
        updateOverallProgress();
        renderRecentClauses();
        renderRecentNotes();
        renderDocumentStats();
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

export { showDashboard, showMainContent, updateDashboard };