const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./App');

const DB = process.env.LOCAL_DATABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connected Successfully'))
  .catch((err) => console.log(err));
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`App running  on port ${port}`);
});
