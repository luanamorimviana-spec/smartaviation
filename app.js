const api = window.SmartAviationApi;

const refs = {
    editableHeroTitle: document.querySelector('[data-editable="hero.title"]'),
    editableHeroSubtitle: document.querySelector('[data-editable="hero.subtitle"]'),
    bannerCallout: document.querySelector('[data-editable="banner.callout"]'),
    portfolioGrid: document.querySelector('[data-list="products"]'),
    leadForm: document.getElementById('lead-form'),
    leadFeedback: document.getElementById('lead-feedback'),
    currentYear: document.getElementById('current-year'),
    navToggle: document.querySelector('.nav-toggle'),
    navMenu: document.getElementById('primary-menu')
};

let content = {
    hero: { title: '', subtitle: '' },
    banner: { title: '', description: '' },
    products: []
};

const renderHero = () => {
    if (!refs.editableHeroTitle || !refs.editableHeroSubtitle) return;
    refs.editableHeroTitle.textContent = content.hero.title;
    refs.editableHeroSubtitle.textContent = content.hero.subtitle;
};

const renderBanner = () => {
    if (!refs.bannerCallout) return;
    const titleElement = refs.bannerCallout.querySelector('h2');
    const descElement = refs.bannerCallout.querySelector('p');
    if (titleElement) titleElement.textContent = content.banner.title;
    if (descElement) descElement.textContent = content.banner.description;
};

const createGalleryMarkup = (product) => {
    if (!Array.isArray(product.gallery)) return '';
    return product.gallery
        .slice(0, 3)
        .map((image, index) => `<img src="${image}" alt="${product.name} - detalhe ${index + 1}">`)
        .join('');
};

const createProductCard = (product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-visual">
            <img src="${product.mainImage}" alt="${product.name} - imagem principal">
        </div>
        <div class="product-content">
            <span class="product-tag">${product.tag || 'Projeto SmartAviation'}</span>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-gallery">${createGalleryMarkup(product)}</div>
        </div>
    `;
    return card;
};

const renderProducts = () => {
    if (!refs.portfolioGrid) return;
    refs.portfolioGrid.innerHTML = '';

    if (!content.products.length) {
        const empty = document.createElement('p');
        empty.className = 'portfolio-empty';
        empty.textContent = 'Nenhum projeto cadastrado no momento. Atualize pelo painel administrativo.';
        refs.portfolioGrid.appendChild(empty);
        return;
    }

    content.products.forEach((product) => {
        refs.portfolioGrid.appendChild(createProductCard(product));
    });
};

const showFeedback = (message, isError = false) => {
    if (!refs.leadFeedback) return;
    refs.leadFeedback.textContent = message;
    refs.leadFeedback.classList.toggle('error', Boolean(isError));
};

const handleContactSubmit = async (event) => {
    event.preventDefault();
    if (!refs.leadForm) return;

    const formData = new FormData(refs.leadForm);
    const data = Object.fromEntries(formData.entries());
    const requiredFields = ['name', 'phone', 'email', 'company', 'address'];
    const hasEmpty = requiredFields.some((field) => !data[field] || !data[field].trim());

    if (hasEmpty) {
        showFeedback('Preencha todos os campos obrigatórios para avançar.', true);
        return;
    }

    try {
        await api.submitRequest({
            name: data.name.trim(),
            phone: data.phone.trim(),
            email: data.email.trim(),
            company: data.company.trim(),
            address: data.address.trim(),
            message: data.message?.trim() ?? ''
        });
        refs.leadForm.reset();
        showFeedback('Solicitação enviada com sucesso! Nossa equipe retornará em breve.');
    } catch (error) {
        console.error(error);
        showFeedback(error.message || 'Não foi possível enviar a solicitação.', true);
    }
};

const setupNavigation = () => {
    if (!refs.navToggle || !refs.navMenu) return;
    refs.navToggle.setAttribute('aria-expanded', 'false');
    refs.navMenu.setAttribute('aria-expanded', 'false');
    refs.navToggle.textContent = '☰';

    refs.navToggle.addEventListener('click', () => {
        const expanded = refs.navToggle.getAttribute('aria-expanded') === 'true';
        refs.navToggle.setAttribute('aria-expanded', String(!expanded));
        refs.navMenu.setAttribute('aria-expanded', String(!expanded));
        refs.navToggle.textContent = expanded ? '☰' : '✕';
    });

    refs.navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            refs.navToggle.setAttribute('aria-expanded', 'false');
            refs.navMenu.setAttribute('aria-expanded', 'false');
            refs.navToggle.textContent = '☰';
        });
    });
};

const loadContent = async () => {
    try {
        const data = await api.getContent();
        content = data;
        renderHero();
        renderBanner();
        renderProducts();
    } catch (error) {
        console.error('Erro ao carregar conteúdo', error);
        showFeedback('Não foi possível carregar os dados do site. Tente novamente em instantes.', true);
    }
};

const init = () => {
    if (refs.currentYear) {
        refs.currentYear.textContent = new Date().getFullYear();
    }

    loadContent();
    setupNavigation();
    refs.leadForm?.addEventListener('submit', handleContactSubmit);
};

document.addEventListener('DOMContentLoaded', init);
