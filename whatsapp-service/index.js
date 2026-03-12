const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isReady = false;

// QR kod terminalde gösterilir, telefonla okutursun
client.on('qr', (qr) => {
    console.log('QR KODU OKUT:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp bağlantısı hazır!');
    isReady = true;
});

client.on('disconnected', () => {
    console.log('❌ WhatsApp bağlantısı kesildi!');
    isReady = false;
});

client.initialize();

// --- ENDPOINTS ---
app.get('/', (req, res) => {
    res.json({ status: isReady ? 'Bağlı ✅' : 'Bağlı değil ❌' });
});

app.post('/mesaj-gonder', async (req, res) => {
    const { numara, mesaj } = req.body;
    if (!isReady) {
        return res.status(503).json({ success: false, hata: 'WhatsApp bağlı değil' });
    }
    try {
        const chatId = numara + '@c.us';
        await client.sendMessage(chatId, mesaj);
        res.json({ success: true, mesaj: 'Mesaj gönderildi ✅' });
    } catch (e) {
        res.status(500).json({ success: false, hata: e.message });
    }
});

app.listen(3001, () => {
    console.log('WhatsApp servisi 3001 portunda çalışıyor 🚀');
});