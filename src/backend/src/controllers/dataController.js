//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
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
      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
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
