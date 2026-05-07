/**
 * SISO FAQ Loader - Google Sheets Integration
 * Google Sheets에서 FAQ 데이터를 가져와 동적으로 렌더링
 */

class FAQLoader {
    constructor(sheetId, sheetName, language = 'en', options = {}) {
        this.sheetId = sheetId;
        this.sheetName = sheetName;
        this.language = language;
        this.openFirstItem = options.openFirstItem ?? false;
        this.baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`;
    }

    /**
     * Google Sheets에서 데이터 가져오기
     */
    async fetchData() {
        try {
            const url = `${this.baseUrl}?tqx=out:json&sheet=${encodeURIComponent(this.sheetName)}&cache=${Date.now()}`;
            const response = await fetch(url, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = await response.text();
            const jsonText = text
                .replace(/^[\s\S]*google\.visualization\.Query\.setResponse\(/, '')
                .replace(/\);?\s*$/, '');
            const json = JSON.parse(jsonText);

            return this.parseData(json);
        } catch (error) {
            console.error('FAQ 데이터 로딩 실패:', error);
            return [];
        }
    }

    /**
     * JSON 데이터를 FAQ 객체로 변환
     */
    parseData(json) {
        const rows = json.table?.rows || [];
        const faqs = [];

        rows.forEach(row => {
            const cells = row.c || [];
            
            // active가 TRUE인 것만 포함
            if (this.isActive(cells[6]?.v)) {
                const faq = {
                    id: cells[0]?.v || '',
                    questionKo: cells[1]?.v || '',
                    answerKo: cells[2]?.v || '',
                    questionEn: cells[3]?.v || '',
                    answerEn: cells[4]?.v || '',
                    order: Number(cells[5]?.v) || 999,
                    active: this.isActive(cells[6]?.v)
                };
                
                faqs.push(faq);
            }
        });

        // order 기준으로 정렬
        return faqs.sort((a, b) => a.order - b.order);
    }

    /**
     * FAQ 아코디언 HTML 생성
     */
    generateHTML(faqs) {
        const questionKey = this.language === 'ko' ? 'questionKo' : 'questionEn';
        const answerKey = this.language === 'ko' ? 'answerKo' : 'answerEn';

        return faqs.map((faq, index) => {
            const collapseId = this.getCollapseId(faq.id, index);
            const isOpen = this.openFirstItem && index === 0;

            return `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button ${isOpen ? '' : 'collapsed'}" 
                            type="button" 
                            data-bs-toggle="collapse"
                            data-bs-target="#${collapseId}" 
                            aria-expanded="${isOpen ? 'true' : 'false'}" 
                            aria-controls="${collapseId}">
                        #${index + 1} ${this.escapeHTML(faq[questionKey])}
                    </button>
                </h2>
                <div id="${collapseId}" 
                     class="accordion-collapse collapse ${isOpen ? 'show' : ''}" 
                     data-bs-parent="#accordionExample">
                    <div class="accordion-body">
                        ${this.formatAnswer(faq[answerKey])}
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    /**
     * 답변 텍스트 포맷팅 (줄바꿈, 링크 등)
     */
    formatAnswer(text) {
        const links = [];
        const textWithLinkTokens = String(text || '').replace(/\[(.*?)\]\((.*?)\)/g, (_, label, url) => {
            const token = `__FAQ_LINK_${links.length}__`;
            const safeUrl = this.sanitizeUrl(url);
            links.push(`<a href="${this.escapeAttribute(safeUrl)}" class="text-black" target="_blank" rel="noopener noreferrer">${this.escapeHTML(label)}</a>`);
            return token;
        });

        return this.escapeHTML(textWithLinkTokens)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__FAQ_LINK_(\d+)__/g, (_, index) => links[Number(index)] || '');
    }

    escapeHTML(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    escapeAttribute(value) {
        return this.escapeHTML(value).replace(/`/g, '&#096;');
    }

    sanitizeUrl(url) {
        const value = String(url || '').trim();

        if (/^(https?:|mailto:)/i.test(value)) {
            return value;
        }

        return '#';
    }

    isActive(value) {
        return value === true || String(value).toLowerCase() === 'true';
    }

    getCollapseId(id, index) {
        const safeId = String(id || index + 1).replace(/[^A-Za-z0-9_-]/g, '');
        return `collapse${safeId || index + 1}`;
    }

    /**
     * FAQ를 페이지에 렌더링
     */
    async render(containerId = 'accordionExample') {
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error(`Container #${containerId}를 찾을 수 없습니다.`);
            return;
        }

        const fallbackHTML = container.innerHTML;
        const hasFallback = fallbackHTML.trim().length > 0;

        // 로딩 표시
        container.setAttribute('aria-busy', 'true');
        container.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">FAQ 로딩 중...</p>
            </div>
        `;

        // 데이터 가져오기
        const faqs = await this.fetchData();

        if (faqs.length === 0) {
            container.removeAttribute('aria-busy');

            if (hasFallback) {
                container.innerHTML = fallbackHTML;
                return;
            }

            container.innerHTML = this.getErrorHTML();
            return;
        }

        // HTML 생성 및 렌더링
        container.removeAttribute('aria-busy');
        container.innerHTML = this.generateHTML(faqs);
    }

    getErrorHTML() {
        const message = this.language === 'ko'
            ? 'FAQ 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'
            : 'FAQ data could not be loaded. Please try again later.';

        return `
            <div class="alert alert-warning" role="alert">
                ${message}
            </div>
        `;
    }
}

/**
 * 페이지별 설정
 * 각 HTML 페이지에서 해당하는 시트 이름으로 FAQ를 로드
 */
document.addEventListener('DOMContentLoaded', function() {
    // 현재 페이지 확인
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    // 언어 확인 (한국어/영어)
    const isKorean = window.location.pathname.includes('/korean/');
    const language = isKorean ? 'ko' : 'en';
    
    const defaultSheetId = '1DZ3nFELpYomZapdS8jcUQRF-LSBPV_VyaxMPs3TeFMo';
    const sheetIdMeta = document.querySelector('meta[name="faq-sheet-id"]');
    const sheetId = sheetIdMeta?.content || defaultSheetId;
    
    // 페이지별 시트 이름 매핑
    const sheetMapping = {
        'RC': 'RC',
        'krc': 'RC',
        'dorm': 'Dorm',
        'kdorm': 'Dorm',
        'timetable': 'Timetable',
        'ktime': 'Timetable',
        'ssu': 'SSU',
        'kssu': 'SSU'
    };
    
    const sheetName = sheetMapping[currentPage];
    
    if (sheetName) {
        const container = document.getElementById('accordionExample');
        const configuredSheetName = container?.dataset.faqSheet || sheetName;
        const openFirstItem = container?.dataset.openFirst === 'true';
        const loader = new FAQLoader(sheetId, configuredSheetName, language, { openFirstItem });
        loader.render();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FAQLoader;
}
