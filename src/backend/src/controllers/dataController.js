/* eslint-env node */

export function handlePost(req, res) {
  if (req.url.includes('predict')) {
    if (req.body.input === null) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    return res.status(200).json({ prediction: 'Predicted result' });
  }
  if (req.url.includes('processData')) {
    return res
      .status(201)
      .json({ message: 'Data processed and stored successfully' });
  }
  if (req.url.includes('trainModel')) {
    return res.status(202).json({ message: 'Model training started' });
  }
  if (req.url.includes('uploadDataset')) {
    return res.status(413).json({ error: 'Payload Too Large' });
  }
  return res.status(201).json({ message: 'Data received' });
}

export function handlePut(req, res) {
  res.status(200).json({ message: 'Data updated' });
}

export function handleDelete(req, res) {
  res.status(200).json({ message: 'Data deleted' });
}

export function handlePatch(req, res) {
  res.status(200).json({ message: 'Data patched' });
}

export function handleHead(req, res) {
  res.status(200).end();
}

export function handleOptions(req, res) {
  res
    .status(204)
    .setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    )
    .end();
}

export function handleGet(req, res) {
  if (req.url.includes('processedData')) {
    return res.status(200).json({ data: [] });
  }
  if (req.url.includes('trainModel/status')) {
    return res.status(200).json({ status: 'in progress' });
  }
  return res.status(200).json({ message: 'Data fetched' });
}

export function handleGetJson(req, res) {
  res.status(200).json({ message: 'JSON Data' });
}

export function handleGetHtml(req, res) {
  res.status(200).send('<html><body>HTML Data</body></html>');
}
