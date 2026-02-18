// NUCLEAR OPTION: Zero dependencies. Pure Node.js handler.
// If this doesn't work, Vercel project config is broken.
module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
        status: 'pong',
        message: 'Equinox Vercel function is alive!',
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    }));
};
