// home-service.js
import { showEmptyState } from './render-service.js';

// Data informasi tentang ISO 45001:2018
const ISO45001_INFO = {
    title: "ISO 45001:2018 - Sistem Manajemen Kesehatan dan Keselamatan Kerja",
    description: "ISO 45001 adalah standar internasional yang menetapkan persyaratan untuk sistem manajemen kesehatan dan keselamatan kerja (K3), dengan panduan untuk penggunaannya, untuk memungkinkan organisasi menyediakan tempat kerja yang aman dan sehat dengan mencegah cedera dan penyakit terkait kerja serta secara proaktif meningkatkan kinerja K3-nya.",
    benefits: [
        "Mengurangi risiko kecelakaan kerja dan penyakit akibat kerja",
        "Meningkatkan kepatuhan terhadap peraturan K3",
        "Menciptakan budaya K3 yang positif di tempat kerja",
        "Meningkatkan reputasi organisasi di mata stakeholder",
        "Mengurangi biaya akibat kecelakaan kerja dan ketidakhadiran",
        "Meningkatkan produktivitas melalui lingkungan kerja yang lebih aman"
    ],
    keyElements: [
        "Konteks organisasi dan kepemimpinan",
        "Perencanaan untuk mengatasi risiko dan peluang",
        "Dukungan dan sumber daya",
        "Operasional dan kesiapan darurat",
        "Evaluasi kinerja dan perbaikan berkelanjutan"
    ],
    implementationSteps: [
        "Komitmen manajemen puncak",
        "Pembentukan tim implementasi",
        "Gap analysis terhadap standar",
        "Pelatihan dan peningkatan kesadaran",
        "Pengembangan dokumentasi sistem",
        "Implementasi dan operasionalisasi",
        "Audit internal dan tinjauan manajemen",
        "Sertifikasi oleh badan independen"
    ],
    statistics: {
        globalAdoption: "Diadopsi oleh lebih dari 160 negara",
        reductionInjuries: "Organisasi dengan ISO 45001 melaporkan penurunan 30-50% kecelakaan kerja",
        certificationGrowth: "Pertumbuhan sertifikasi 20% per tahun sejak diluncurkan"
    }
};

// Fungsi untuk merender tampilan home
function renderHomeView(container) {
    if (!container) return false;

    try {
        const homeHTML = `
            <div class="home-view">
                <div class="card border-0 mb-4">
                    <div class="card-body">
                        <div class="clause-header">
                            <h1>${ISO45001_INFO.title}</h1>
                        </div>
                        <div class="clause-body">
                            <p class="mb-4">${ISO45001_INFO.description}</p>
                            
                            <div class="section-title">
                                <h2 class="h6">Manfaat Utama</h2>
                            </div>
                            <ul class="list-unstyled mb-4">
                                ${ISO45001_INFO.benefits.map(benefit => `
                                    <li class="mb-2">
                                        <div class="implementation-item">
                                            <div class="step-number" style="background-color: var(--success-color);">✓</div>
                                            <div class="step-text">${benefit}</div>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                            
                            <div class="section-title">
                                <h2 class="h6">Elemen Kunci Standar</h2>
                            </div>
                            <div class="row mb-4">
                                ${ISO45001_INFO.keyElements.map((element, index) => `
                                    <div class="col-12 col-md-6 mb-2">
                                        <div class="implementation-item">
                                            <div class="step-number" style="background-color: var(--primary-color);">${index + 1}</div>
                                            <div class="step-text">${element}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="section-title">
                                <h2 class="h6">Tahapan Implementasi</h2>
                            </div>
                            <ol class="mb-4">
                                ${ISO45001_INFO.implementationSteps.map(step => `
                                    <li class="mb-2">${step}</li>
                                `).join('')}
                            </ol>
                            
                            <div class="section-title">
                                <h2 class="h6">Fakta dan Statistik</h2>
                            </div>
                            <div class="row">
                                <div class="col-12 col-md-4 mb-3">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body text-center">
                                            <h3 class="h5 text-primary">${ISO45001_INFO.statistics.globalAdoption.split(':')[0]}</h3>
                                            <p class="mb-0">${ISO45001_INFO.statistics.globalAdoption.split(':')[1]}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4 mb-3">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body text-center">
                                            <h3 class="h5 text-primary">Penurunan Kecelakaan</h3>
                                            <p class="mb-0">${ISO45001_INFO.statistics.reductionInjuries}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4 mb-3">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body text-center">
                                            <h3 class="h5 text-primary">Pertumbuhan Sertifikasi</h3>
                                            <p class="mb-0">${ISO45001_INFO.statistics.certificationGrowth}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="alert alert-primary mt-4">
                                <strong>Mulai eksplorasi:</strong> Pilih klausul dari menu navigasi di atas untuk melihat detail persyaratan dan panduan implementasi.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = homeHTML;
        return true;
    } catch (error) {
        console.error('Error rendering home view:', error);
        showEmptyState(container, 'Gagal memuat halaman beranda');
        return false;
    }
}

export { renderHomeView };