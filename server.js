const express = require('express');
const app = express();
const PORT = 3003;

app.use(express.static('dist'));

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));