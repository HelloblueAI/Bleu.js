const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.status(201).send({ message: 'Data received', data: req.body.data });
});

router.put('/', (req, res) => {
  res.status(200).send({ message: 'Data updated' });
});

router.delete('/', (req, res) => {
  res.status(200).send({ message: 'Data deleted' });
});

router.patch('/', (req, res) => {
  res.status(200).send({ message: 'Data patched' });
});

router.head('/', (req, res) => {
  res.status(200).send({});
});

router.options('/', (req, res) => {
  res
    .status(204)
    .set(
      'access-control-allow-methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    )
    .send();
});

module.exports = router;
