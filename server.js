const express = require('express');
const axios = require('axios');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// VPS-iň öz IP-sini almak
function getServerIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}

// API endpoint
app.get('/api/info', async (req, res) => {
    try {
        // VPS-iň daşarky IP-sini anykla
        const publicIpRes = await axios.get('https://api.ipify.org?format=json');
        const publicIP = publicIpRes.data.ip;

        // IP maglumatlaryny al
        const geoRes = await axios.get(`https://ipapi.co/${publicIP}/json/`);
        const geo = geoRes.data;

        res.json({
            success: true,
            server: {
                publicIP: publicIP,
                localIP: getServerIP(),
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                uptime: formatUptime(os.uptime())
            },
            geo: {
                city: geo.city || '-',
                region: geo.region || '-',
                country: geo.country_name || '-',
                countryCode: geo.country_code || '-',
                postal: geo.postal || '-',
                latitude: geo.latitude || '-',
                longitude: geo.longitude || '-',
                timezone: geo.timezone || '-',
                isp: geo.org || '-',
                asn: geo.asn || '-'
            },
            client: {
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}g ${h}s ${m}m`;
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serwer işleýär: http://0.0.0.0:${PORT}`);
});
