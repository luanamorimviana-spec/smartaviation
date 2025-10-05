import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(__dirname));

const ensureUploadDir = async () => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
        console.error('Erro ao garantir diretório de uploads', error);
    }
};

const readData = async () => {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
};

const writeData = async (data) => {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        await ensureUploadDir();
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${uuid()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Somente arquivos de imagem são permitidos.'));
        }
        cb(null, true);
    }
});

const sessions = new Map();
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 horas

const createSession = (user) => {
    const token = uuid();
    sessions.set(token, {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        expiresAt: Date.now() + SESSION_TTL
    });
    return token;
};

const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const token = header.slice(7);
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
        sessions.delete(token);
        return res.status(401).json({ message: 'Sessão expirada' });
    }
    req.user = session.user;
    next();
};

const sanitizeProduct = (product) => ({
    id: product.id,
    name: product.name,
    tag: product.tag,
    description: product.description,
    mainImage: product.mainImage,
    gallery: product.gallery,
    createdAt: product.createdAt
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Informe e-mail e senha.' });
    }
    const data = await readData();
    const user = data.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    const token = createSession(user);
    return res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

app.post('/api/logout', authMiddleware, (req, res) => {
    const header = req.headers.authorization;
    const token = header.slice(7);
    sessions.delete(token);
    res.json({ message: 'Sessão encerrada.' });
});

app.get('/api/content', async (req, res) => {
    const data = await readData();
    res.json({
        hero: data.hero,
        banner: data.banner,
        products: data.products.map(sanitizeProduct)
    });
});

app.get('/api/products', async (req, res) => {
    const data = await readData();
    res.json(data.products.map(sanitizeProduct));
});

app.post('/api/products', authMiddleware, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'gallery1', maxCount: 1 },
    { name: 'gallery2', maxCount: 1 },
    { name: 'gallery3', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, tag, description } = req.body;
        if (!name || !description) {
            return res.status(400).json({ message: 'Nome e descrição são obrigatórios.' });
        }

        const files = req.files || {};
        const data = await readData();

        const product = {
            id: uuid(),
            name: name.trim(),
            tag: tag?.trim() || '',
            description: description.trim(),
            mainImage: files.mainImage?.[0] ? `/uploads/${files.mainImage[0].filename}` : '',
            gallery: [
                files.gallery1?.[0] ? `/uploads/${files.gallery1[0].filename}` : '',
                files.gallery2?.[0] ? `/uploads/${files.gallery2[0].filename}` : '',
                files.gallery3?.[0] ? `/uploads/${files.gallery3[0].filename}` : ''
            ].filter(Boolean),
            createdAt: new Date().toISOString()
        };

        data.products = [product, ...(data.products ?? [])];
        await writeData(data);
        res.status(201).json(sanitizeProduct(product));
    } catch (error) {
        console.error('Erro ao cadastrar produto', error);
        res.status(500).json({ message: 'Erro ao cadastrar produto.' });
    }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const data = await readData();
    const product = data.products.find((item) => item.id === id);
    if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    data.products = data.products.filter((item) => item.id !== id);
    await writeData(data);
    res.json({ message: 'Produto removido.' });
});

app.put('/api/hero', authMiddleware, async (req, res) => {
    const { title, subtitle } = req.body;
    if (!title || !subtitle) {
        return res.status(400).json({ message: 'Título e subtítulo são obrigatórios.' });
    }
    const data = await readData();
    data.hero = { title: title.trim(), subtitle: subtitle.trim() };
    await writeData(data);
    res.json(data.hero);
});

app.put('/api/banner', authMiddleware, async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        return res.status(400).json({ message: 'Chamada e descrição são obrigatórias.' });
    }
    const data = await readData();
    data.banner = { title: title.trim(), description: description.trim() };
    await writeData(data);
    res.json(data.banner);
});

app.get('/api/requests', authMiddleware, async (req, res) => {
    const data = await readData();
    res.json(data.requests ?? []);
});

app.post('/api/requests', async (req, res) => {
    const { name, phone, email, company, address, message } = req.body;
    const required = [name, phone, email, company, address];
    if (required.some((field) => !field || !field.trim())) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
    }
    const data = await readData();
    const request = {
        id: uuid(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim(),
        address: address.trim(),
        message: message?.trim() ?? '',
        status: 'Novo',
        createdAt: new Date().toISOString()
    };
    data.requests = [request, ...(data.requests ?? [])];
    await writeData(data);
    res.status(201).json(request);
});

app.patch('/api/requests/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ message: 'Status é obrigatório.' });
    }
    const data = await readData();
    const request = data.requests?.find((item) => item.id === id);
    if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada.' });
    }
    request.status = status;
    await writeData(data);
    res.json(request);
});

app.get('/api/users', authMiddleware, async (req, res) => {
    const data = await readData();
    const users = data.users.map(({ password, ...rest }) => rest);
    res.json(users);
});

app.post('/api/users', authMiddleware, async (req, res) => {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    const data = await readData();
    if (data.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ message: 'Já existe um usuário com este e-mail.' });
    }
    const user = {
        id: uuid(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim(),
        password: password,
        createdAt: new Date().toISOString()
    };
    data.users.push(user);
    await writeData(data);
    const { password: _, ...rest } = user;
    res.status(201).json(rest);
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const data = await readData();
    if ((data.users ?? []).length <= 1) {
        return res.status(400).json({ message: 'É necessário manter pelo menos um usuário.' });
    }
    const user = data.users.find((item) => item.id === id);
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    data.users = data.users.filter((item) => item.id !== id);
    await writeData(data);
    res.json({ message: 'Usuário removido.' });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        console.error('Erro não tratado', err);
        return res.status(500).json({ message: err.message || 'Erro interno.' });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`SmartAviation server rodando em http://localhost:${PORT}`);
});
