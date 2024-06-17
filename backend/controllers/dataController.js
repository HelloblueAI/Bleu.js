exports.handlePost = (req, res) => {
    res.status(201).json({ message: 'Data received' });
};

exports.handlePut = (req, res) => {
    res.status(200).json({ message: 'Data updated' });
};

exports.handleDelete = (req, res) => {
    res.status(200).json({ message: 'Data deleted' });
};

exports.handlePatch = (req, res) => {
    res.status(200).json({ message: 'Data patched' });
};

exports.handleHead = (req, res) => {
    res.status(200).end();
};

exports.handleOptions = (req, res) => {
    res.status(204).setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS').end();
};

exports.handleGet = (req, res) => {
    res.status(200).json({ message: 'Data fetched' });
};

exports.handleGetJson = (req, res) => {
    res.status(200).json({ message: 'JSON Data' });
};

exports.handleGetHtml = (req, res) => {
    res.status(200).send('<html><body>HTML Data</body></html>');
};
