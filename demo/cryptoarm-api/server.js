const express = require('express');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');

const app = express();

const PORT = 8080;
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/form', function (req, res) {
  res.sendFile(__dirname + '/form.html');
});

// default options
app.use(fileUpload());
app.use(morgan('tiny'));
app.use(express.json());

app.use('/public', express.static(__dirname + '/public'));

app.post('/json', function (req, res) {
  const id = req.query.id;
  if (req.body.jsonrpc !== "2.0") {
    console.log("Error! Wrong jsonrpc version! (" + req.body.jsonrpc + " but MUST be 2.0)");
  }

  if (req.body.method === "certificates.parameters") {
    if (id !== req.body.id) {
      console.log("Error! Id from URL and ID from request is not match! (" + id + " and " + req.body.id+ ")");
    }

    if (id) {
      switch (req.body.id) {
        // Server errors
        case "c1e334d3-378a-45ac-842b-b823d2702722":
          res.sendFile(__dirname + '/public/json/server-errors/internal-error.json');
          break;
        case "d53032c9-fc0d-42a7-bdfd-b45bec7b8ab9":
          res.sendFile(__dirname + '/public/json/server-errors/invalid-params.json');
          break;
        case "90dc17c9-4df9-420a-9e25-53b8df4f709f":
          res.sendFile(__dirname + '/public/json/server-errors/invalid-request.json');
          break;
        case "d2056bc4-c8c7-41ee-bdf8-aaa306cdec2f":
          res.sendFile(__dirname + '/public/json/server-errors/method-not-found.json');
          break;
        case "14a52a48-dac7-4b21-8836-744e453a82d2":
          res.sendFile(__dirname + '/public/json/server-errors/parse-error.json');
          break;

        // Certificates
        case "f2502c2b-ea27-44d2-bb18-077c6e20dd7d":
          res.sendFile(__dirname + '/public/json/certs/import-cert.json');
          break;
        case "70505a39-3267-4c0f-99a9-02d43165f4f3":
          res.sendFile(__dirname + '/public/json/certs/export-cert.json');
          break;
        case "0a94fab1-eb68-4257-a9da-1399ad208445":
          res.sendFile(__dirname + '/public/json/certs/export-certs.json');
          break;
        case "9b5e6a0b-489d-4812-8866-0b9afce648e1":
          res.sendFile(__dirname + '/public/json/certs/export-certs-stores.json');
          break;
        case "4b05b126-4b74-4d0f-af66-f87ce0bb9cee":
          res.status(405).send('');
          break;
        case "d308db61-a693-4658-b089-25a242711217":
          res.status(415).send('');
          break;
      }
    }
  } else if (req.body.method === "certificates.base64") {
    if (id !== req.body.params.id) {
      console.log("Error! Id from URL and ID from request is not match! (" + id + " and " + req.body.params.id+ ")");
    }

    console.log("Recieved request with method " + req.body.method + " and id " + req.body.params.id);

    if (req.body.params.certificates){
      console.log("Recieved " + req.body.params.certificates.length + " certificates for import");
      console.log("========================");
      req.body.params.certificates.forEach(function(cert) {
        console.log("Certificate name: " + cert.friendlyName);
        console.log("Certificate data: " + cert.certificateBase64);
        console.log("------------------------");
      });
      console.log("========================");
    } else {
      console.log("Recieved signgle certificate for import: " + req.body.params.friendlyName);
      console.log("Certificate data: " + req.body.params.certificateBase64);
    }

    res.status(200).send("");
  } else {
    console.log("Unsupported method: " + req.body.method);
    res.status(400).send('Incorrect token');
  }
});

// Leagcy tests
app.get('/json', function (req, res) {
  const accessToken = req.query.accessToken;

  switch (accessToken) {
    case "efac5229-0595-41e9-b1aa-7df406539b87":
      res.sendFile(__dirname + '/public/json/efac5229-0595-41e9-b1aa-7df406539b87.json');
      break;
    case "9c7101f7-9c47-4481-b4da-a6a497abde08":
      res.sendFile(__dirname + '/public/json/9c7101f7-9c47-4481-b4da-a6a497abde08.json');
      break;
    case "2c48eb32-a0a8-405c-ade9-eed130605cba":
      res.sendFile(__dirname + '/public/json/2c48eb32-a0a8-405c-ade9-eed130605cba.json');
      break;
    default:
      res.status(400).send('Incorrect token');
  }
});

app.post('/upload', function (req, res) {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded.');
    return;
  }

  console.log('req.files >>>', req.files);

  sampleFile = req.files.file;

  uploadPath = __dirname + '/uploads/' + sampleFile.name;

  sampleFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    res.send('File uploaded to ' + uploadPath);
  });
});

app.listen(PORT, function () {
  console.log('Express server listening on port ', PORT);
});
