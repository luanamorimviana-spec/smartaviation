const api = window.SmartAviationApi;

const refs = {
    overlay: document.getElementById('auth-overlay'),
    shell: document.getElementById('admin-shell'),
    loginForm: document.getElementById('admin-login'),
    loginFeedback: document.getElementById('admin-login-feedback'),
    logoutButton: document.getElementById('logout'),
    activeUser: document.getElementById('active-user'),
    heroForm: document.getElementById('hero-form'),
    bannerForm: document.getElementById('banner-form'),
    productForm: document.getElementById('product-form'),
    toggleProductForm: document.getElementById('toggle-product-form'),
    cancelProduct: document.getElementById('cancel-product'),
    productAdminList: document.getElementById('product-admin-list'),
    requestsTable: document.getElementById('requests-table'),
    userForm: document.getElementById('user-form'),
    userList: document.getElementById('user-list'),
    portfolioCount: document.getElementById('portfolio-count'),
    requestCount: document.getElementById('request-count')
};

const state = {
    content: { hero: { title: '', subtitle: '' }, banner: { title: '', description: '' }, products: [] },
    requests: [],
    users: []
};

const showFeedback = (element, message, isError = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('error', Boolean(isError));
    if (!message) {
        element.classList.remove('error');
    }
};

const showFormFeedback = (id, message, isError = false) => {
    const element = document.querySelector(`[data-feedback="${id}"]`);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('error', Boolean(isError));
    if (message) {
        setTimeout(() => {
            element.textContent = '';
            element.classList.remove('error');
        }, 4000);
    }
};

const closeOverlay = (userEmail) => {
    if (!refs.overlay || !refs.shell) return;
    refs.overlay.setAttribute('aria-hidden', 'true');
    refs.shell.hidden = false;
    if (refs.activeUser) {
        refs.activeUser.textContent = userEmail;
    }
};

const openOverlay = () => {
    if (!refs.overlay || !refs.shell) return;
    refs.overlay.setAttribute('aria-hidden', 'false');
    refs.shell.hidden = true;
    if (refs.loginForm) {
        refs.loginForm.reset();
    }
    showFeedback(refs.loginFeedback, '', false);
};

const renderHeroForm = () => {
    if (!refs.heroForm) return;
    refs.heroForm.elements.title.value = state.content.hero.title;
    refs.heroForm.elements.subtitle.value = state.content.hero.subtitle;
};

const renderBannerForm = () => {
    if (!refs.bannerForm) return;
    refs.bannerForm.elements.title.value = state.content.banner.title;
    refs.bannerForm.elements.description.value = state.content.banner.description;
};

const createAdminProductCard = (product) => {
    const card = document.createElement('article');
    card.className = 'portfolio-card';
    card.innerHTML = `
        <img src="${product.mainImage}" alt="${product.name} - imagem principal">
        <div class="portfolio-body">
            <span class="portfolio-tag">${product.tag || 'Projeto SmartAviation'}</span>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="portfolio-gallery">
                ${product.gallery
                    .slice(0, 3)
                    .map((image, index) => `<img src="${image}" alt="${product.name} - detalhe ${index + 1}">`)
                    .join('')}
            </div>
        </div>
        <footer>
            <button type="button" class="btn ghost" data-action="remove" data-id="${product.id}">Remover</button>
        </footer>
    `;
    return card;
};

const renderProducts = () => {
    if (!refs.productAdminList) return;
    refs.productAdminList.innerHTML = '';

    if (!state.content.products.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Nenhum item cadastrado. Utilize o botão "Novo item" para adicionar.';
        empty.className = 'portfolio-empty';
        refs.productAdminList.appendChild(empty);
        return;
    }

    state.content.products.forEach((product) => {
        refs.productAdminList.appendChild(createAdminProductCard(product));
    });

    refs.productAdminList.querySelectorAll('[data-action="remove"]').forEach((button) => {
        button.addEventListener('click', () => removeProduct(button.dataset.id));
    });
};

const renderRequests = () => {
    if (!refs.requestsTable) return;
    refs.requestsTable.innerHTML = '';

    if (!state.requests.length) {
        const emptyRow = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'Nenhuma solicitação recebida até o momento.';
        emptyRow.appendChild(cell);
        refs.requestsTable.appendChild(emptyRow);
        return;
    }

    state.requests.forEach((request) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${request.name}</strong><br>
                <small>${request.address}</small>
            </td>
            <td>${request.company}</td>
            <td>
                <span>${request.email}</span><br>
                <small>${request.phone}</small>
            </td>
            <td><span class="status-pill">${request.status}</span></td>
            <td class="request-actions">
                <button type="button" class="btn ghost" data-action="progress" data-id="${request.id}">Em andamento</button>
                <button type="button" class="btn ghost" data-action="finish" data-id="${request.id}">Concluído</button>
            </td>
        `;
        refs.requestsTable.appendChild(row);
    });

    refs.requestsTable.querySelectorAll('[data-action="progress"]').forEach((button) => {
        button.addEventListener('click', () => updateRequestStatus(button.dataset.id, 'Em andamento'));
    });

    refs.requestsTable.querySelectorAll('[data-action="finish"]').forEach((button) => {
        button.addEventListener('click', () => updateRequestStatus(button.dataset.id, 'Concluído'));
    });
};

const renderUsers = () => {
    if (!refs.userList) return;
    refs.userList.innerHTML = '';

    state.users.forEach((user) => {
        const item = document.createElement('li');
        const info = document.createElement('div');
        info.innerHTML = `<strong>${user.name}</strong><br><small>${user.email} • ${user.role}</small>`;
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '0.5rem';

        if (state.users.length > 1) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = 'Remover';
            removeBtn.addEventListener('click', () => removeUser(user.id));
            actions.append(removeBtn);
        }

        item.append(info, actions);
        refs.userList.appendChild(item);
    });
};

const updateCounters = () => {
    if (refs.portfolioCount) {
        refs.portfolioCount.textContent = state.content.products.length;
    }
    if (refs.requestCount) {
        refs.requestCount.textContent = state.requests.length;
    }
};

const refreshContent = async () => {
    const content = await api.getContent();
    state.content = content;
    renderHeroForm();
    renderBannerForm();
    renderProducts();
};

const refreshRequests = async () => {
    state.requests = await api.getRequests();
    renderRequests();
};

const refreshUsers = async () => {
    state.users = await api.getUsers();
    renderUsers();
};

const refresh = async () => {
    try {
        await Promise.all([refreshContent(), refreshRequests(), refreshUsers()]);
        updateCounters();
        const session = api.getSession();
        if (session.user) {
            closeOverlay(session.user.email);
        }
    } catch (error) {
        console.error('Erro ao carregar dados do painel', error);
        showFeedback(refs.loginFeedback, error.message || 'Falha ao carregar dados. Faça login novamente.', true);
        api.setSession(null, null);
        openOverlay();
    }
};

const handleHeroSubmit = async (event) => {
    event.preventDefault();
    const { title, subtitle } = event.target.elements;
    try {
        await api.updateHero({
            title: title.value.trim(),
            subtitle: subtitle.value.trim()
        });
        await refreshContent();
        showFormFeedback('hero', 'Banner atualizado com sucesso.');
    } catch (error) {
        console.error(error);
        showFormFeedback('hero', error.message || 'Erro ao salvar banner.', true);
    }
};

const handleBannerSubmit = async (event) => {
    event.preventDefault();
    const { title, description } = event.target.elements;
    try {
        await api.updateBanner({
            title: title.value.trim(),
            description: description.value.trim()
        });
        await refreshContent();
        showFormFeedback('banner', 'Chamada atualizada.');
    } catch (error) {
        console.error(error);
        showFormFeedback('banner', error.message || 'Erro ao atualizar chamada.', true);
    }
};

const handleProductSubmit = async (event) => {
    event.preventDefault();
    const { name, tag, description, mainImage, gallery1, gallery2, gallery3 } = event.target.elements;

    if (!mainImage.files[0] || !gallery1.files[0] || !gallery2.files[0] || !gallery3.files[0]) {
        showFormFeedback('product', 'Adicione todas as imagens solicitadas.', true);
        return;
    }

    const formData = new FormData();
    formData.append('name', name.value.trim());
    formData.append('tag', tag.value.trim());
    formData.append('description', description.value.trim());
    formData.append('mainImage', mainImage.files[0]);
    formData.append('gallery1', gallery1.files[0]);
    formData.append('gallery2', gallery2.files[0]);
    formData.append('gallery3', gallery3.files[0]);

    try {
        await api.createProduct(formData);
        hideProductForm();
        await refreshContent();
        updateCounters();
        showFormFeedback('product', 'Produto adicionado ao portfólio.');
    } catch (error) {
        console.error(error);
        showFormFeedback('product', error.message || 'Erro ao adicionar produto.', true);
    }
};

const handleUserSubmit = async (event) => {
    event.preventDefault();
    const { name, email, role, password } = event.target.elements;

    try {
        await api.createUser({
            name: name.value.trim(),
            email: email.value.trim(),
            role: role.value.trim(),
            password: password.value
        });
        event.target.reset();
        await refreshUsers();
        showFormFeedback('user', 'Usuário cadastrado com sucesso.');
    } catch (error) {
        console.error(error);
        showFormFeedback('user', error.message || 'Erro ao cadastrar usuário.', true);
    }
};

const updateRequestStatus = async (id, status) => {
    try {
        await api.updateRequestStatus(id, status);
        await refreshRequests();
        updateCounters();
    } catch (error) {
        console.error(error);
    }
};

const removeProduct = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este item do portfólio?')) {
        return;
    }
    try {
        await api.deleteProduct(id);
        await refreshContent();
        updateCounters();
    } catch (error) {
        console.error(error);
        showFormFeedback('product', error.message || 'Erro ao remover produto.', true);
    }
};

const removeUser = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário?')) {
        return;
    }
    try {
        await api.deleteUser(id);
        await refreshUsers();
    } catch (error) {
        console.error(error);
        showFormFeedback('user', error.message || 'Erro ao remover usuário.', true);
    }
};

const handleLogin = async (event) => {
    event.preventDefault();
    const email = event.target.elements.email.value.trim();
    const password = event.target.elements.password.value;

    try {
        const result = await api.login(email, password);
        showFeedback(refs.loginFeedback, 'Acesso liberado. Carregando painel...');
        await refresh();
        closeOverlay(result.user.email);
    } catch (error) {
        console.error(error);
        showFeedback(refs.loginFeedback, error.message || 'Não foi possível autenticar.', true);
    }
};

const handleLogout = async () => {
    await api.logout();
    openOverlay();
};

const showProductForm = () => {
    if (!refs.productForm || !refs.toggleProductForm) return;
    refs.productForm.hidden = false;
    refs.toggleProductForm.setAttribute('disabled', 'true');
};

const hideProductForm = () => {
    if (!refs.productForm || !refs.toggleProductForm) return;
    refs.productForm.reset();
    refs.productForm.hidden = true;
    refs.toggleProductForm.removeAttribute('disabled');
    showFormFeedback('product', '');
};

const bindEvents = () => {
    refs.loginForm?.addEventListener('submit', handleLogin);
    refs.logoutButton?.addEventListener('click', handleLogout);
    refs.heroForm?.addEventListener('submit', handleHeroSubmit);
    refs.bannerForm?.addEventListener('submit', handleBannerSubmit);
    refs.productForm?.addEventListener('submit', handleProductSubmit);
    refs.userForm?.addEventListener('submit', handleUserSubmit);
    refs.toggleProductForm?.addEventListener('click', showProductForm);
    refs.cancelProduct?.addEventListener('click', hideProductForm);
};

const init = async () => {
    bindEvents();
    const session = api.getSession();
    if (session.token) {
        try {
            await refresh();
        } catch (_) {
            openOverlay();
        }
    } else {
        openOverlay();
    }
};

document.addEventListener('DOMContentLoaded', init);


